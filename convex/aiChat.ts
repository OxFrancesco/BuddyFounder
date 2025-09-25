import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation, internalAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

export const getAiChat = query({
  args: {
    profileOwnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const chat = await ctx.db
      .query("aiChats")
      .withIndex("by_participant_and_owner", (q) => 
        q.eq("participantId", userId).eq("profileOwnerId", args.profileOwnerId)
      )
      .unique();

    return chat;
  },
});

export const sendAiMessage = mutation({
  args: {
    profileOwnerId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (userId === args.profileOwnerId) {
      throw new Error("Cannot chat with your own AI");
    }

    // Check if users are matched (required for AI chat access)
    const match = await ctx.db
      .query("matches")
      .filter((q) =>
        q.or(
          q.and(q.eq(q.field("user1Id"), userId), q.eq(q.field("user2Id"), args.profileOwnerId)),
          q.and(q.eq(q.field("user1Id"), args.profileOwnerId), q.eq(q.field("user2Id"), userId))
        )
      )
      .first();

    if (!match) {
      throw new Error("You must be matched with this founder to chat with their AI");
    }

    // Get or create chat
    let chat = await ctx.db
      .query("aiChats")
      .withIndex("by_participant_and_owner", (q) =>
        q.eq("participantId", userId).eq("profileOwnerId", args.profileOwnerId)
      )
      .unique();

    const userMessage = {
      role: "user" as const,
      content: args.message,
      timestamp: Date.now(),
      sources: undefined, // User messages don't have sources
    };

    if (!chat) {
      const chatId = await ctx.db.insert("aiChats", {
        participantId: userId,
        profileOwnerId: args.profileOwnerId,
        messages: [userMessage],
        lastMessageAt: Date.now(),
        totalMessages: 1,
      });

      // TODO: Add AI chat notification when notifications are properly exported
      // await ctx.scheduler.runAfter(0, internal.notifications.sendAiChatNotification, {
      //   profileOwnerId: args.profileOwnerId,
      //   participantId: userId,
      //   chatId,
      // });

      // Schedule AI response generation
      await ctx.scheduler.runAfter(0, internal.aiChat.generateAiResponse, {
        chatId,
        profileOwnerId: args.profileOwnerId,
        userMessage: args.message,
      });

      return chatId;
    } else {
      const updatedMessages = [...chat.messages, userMessage];
      await ctx.db.patch(chat._id, {
        messages: updatedMessages,
        lastMessageAt: Date.now(),
        totalMessages: updatedMessages.length,
      });

      // Schedule AI response generation
      await ctx.scheduler.runAfter(0, internal.aiChat.generateAiResponse, {
        chatId: chat._id,
        profileOwnerId: args.profileOwnerId,
        userMessage: args.message,
      });

      return chat._id;
    }
  },
});

export const generateAiResponse = internalAction({
  args: {
    chatId: v.id("aiChats"),
    profileOwnerId: v.id("users"),
    userMessage: v.string(),
  },
  handler: async (ctx, args) => {
    // Get chat and profile information
    const chat = await ctx.runQuery(internal.aiChat.getChatForResponse, {
      chatId: args.chatId,
    });

    if (!chat) throw new Error("Chat not found");

    const profileInfo = await ctx.runQuery(internal.aiChat.getProfileContext, {
      userId: args.profileOwnerId,
    });

    // Get relevant context using the new RAG system
    const conversationHistory = chat.messages.slice(-5).map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // TODO: Use vector search when properly exported
    const contextResults: any[] = [];
    // const contextResults = await ctx.runAction(internal.vectorSearch.getContextForAiChat, {
    //   query: args.userMessage,
    //   userId: args.profileOwnerId,
    //   conversationHistory,
    // });

    // Get social connections for additional context
    const socialConnections = await ctx.runQuery(internal.aiChat.getSocialConnections, {
      userId: args.profileOwnerId,
    });

    // Build enhanced context for AI
    const contextSources = contextResults.map(result => ({
      content: result.content,
      source: result.source,
      sourceType: result.sourceType,
      relevanceScore: result.relevanceScore,
    }));

    const systemPrompt = `You are an AI assistant representing ${profileInfo.name}. You should respond as if you are them, based on the following information:

Profile Information:
- Name: ${profileInfo.name}
- Bio: ${profileInfo.bio}
- Skills: ${profileInfo.skills.join(", ")}
- Interests: ${profileInfo.interests.join(", ")}
- Looking for: ${profileInfo.lookingFor}
- Experience: ${profileInfo.experience}
- Location: ${profileInfo.location || "Not specified"}

Social Media Presence:
${socialConnections.map(conn => `- ${conn.platform}: ${conn.profileUrl}`).join('\n')}

Relevant Context from Personal Documents and Social Media:
${contextSources.map((source, idx) => `
[Source ${idx + 1}: ${source.source} (${source.sourceType}) - Relevance: ${source.relevanceScore.toFixed(2)}]
${source.content}
`).join('\n')}

Instructions:
- Respond as ${profileInfo.name} in first person
- Be helpful, engaging, and authentic
- Use the context from documents and social media to provide detailed, personalized answers
- Reference specific projects, experiences, or achievements when relevant
- If asked about something not in your context, politely say you don't have that information
- Keep responses conversational and friendly (aim for 1-3 paragraphs)
- Don't reveal that you're an AI - respond as if you're the actual person
- When discussing technical topics, use the person's actual experience level and expertise
- Feel free to mention specific companies, projects, or technologies from the context`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...chat.messages.slice(-8).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 600,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const aiMessage = response.choices[0].message.content;
      if (!aiMessage) throw new Error("No response from AI");

      // Add AI response to chat with source attribution
      await ctx.runMutation(internal.aiChat.addAiMessage, {
        chatId: args.chatId,
        message: aiMessage,
        sources: [], // TODO: Add proper source tracking
      });
    } catch (error) {
      console.error("AI response generation failed:", error);
      // Add fallback message
      await ctx.runMutation(internal.aiChat.addAiMessage, {
        chatId: args.chatId,
        message: "I'm sorry, I'm having trouble responding right now. Please try again later.",
        sources: [],
      });
    }
  },
});

export const getChatForResponse = internalQuery({
  args: {
    chatId: v.id("aiChats"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chatId);
  },
});

export const getProfileContext = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    return profile;
  },
});

export const getSocialConnections = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("socialConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const addAiMessage = internalMutation({
  args: {
    chatId: v.id("aiChats"),
    message: v.string(),
    sources: v.optional(v.array(v.object({
      documentId: v.id("documents"),
      title: v.string(),
      relevanceScore: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");

    const aiMessage = {
      role: "assistant" as const,
      content: args.message,
      timestamp: Date.now(),
      sources: args.sources,
    };

    const updatedMessages = [...chat.messages, aiMessage];
    await ctx.db.patch(args.chatId, {
      messages: updatedMessages,
      lastMessageAt: Date.now(),
      totalMessages: updatedMessages.length,
    });
  },
});

// New function to check if user can access AI chat
export const canAccessAiChat = query({
  args: {
    profileOwnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { canAccess: false, reason: "Not authenticated" };

    if (userId === args.profileOwnerId) {
      return { canAccess: false, reason: "Cannot chat with your own AI" };
    }

    // Check if users are matched
    const match = await ctx.db
      .query("matches")
      .filter((q) =>
        q.or(
          q.and(q.eq(q.field("user1Id"), userId), q.eq(q.field("user2Id"), args.profileOwnerId)),
          q.and(q.eq(q.field("user1Id"), args.profileOwnerId), q.eq(q.field("user2Id"), userId))
        )
      )
      .first();

    if (!match) {
      return { canAccess: false, reason: "You must be matched with this founder to chat with their AI" };
    }

    return { canAccess: true, matchedAt: match.matchedAt };
  },
});

// Get AI chat with enhanced information
export const getEnhancedAiChat = query({
  args: {
    profileOwnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Check access first
    const accessCheck = await ctx.db
      .query("matches")
      .filter((q) =>
        q.or(
          q.and(q.eq(q.field("user1Id"), userId), q.eq(q.field("user2Id"), args.profileOwnerId)),
          q.and(q.eq(q.field("user1Id"), args.profileOwnerId), q.eq(q.field("user2Id"), userId))
        )
      )
      .first();

    if (!accessCheck) return null;

    const chat = await ctx.db
      .query("aiChats")
      .withIndex("by_participant_and_owner", (q) =>
        q.eq("participantId", userId).eq("profileOwnerId", args.profileOwnerId)
      )
      .unique();

    if (!chat) return null;

    // Get profile information
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.profileOwnerId))
      .unique();

    return {
      ...chat,
      profileInfo: profile ? {
        name: profile.name,
        bio: profile.bio,
        experience: profile.experience,
      } : null,
    };
  },
});
