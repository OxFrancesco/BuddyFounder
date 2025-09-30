import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const getMatches = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user || !user._id || typeof user._id !== "string") return [];
    const userId: string = user._id;

    const matches = await ctx.db
      .query("matches")
      .filter((q) => 
        q.or(
          q.eq(q.field("user1Id"), userId),
          q.eq(q.field("user2Id"), userId)
        )
      )
      .collect();

    const matchesWithProfiles = await Promise.all(
      matches.map(async (match) => {
        const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
        
        const otherProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", otherUserId))
          .unique();

        if (!otherProfile) return null;

        // Get photos
        const photos = await Promise.all(
          otherProfile.photos.map(async (photoId) => {
            const url = await ctx.storage.getUrl(photoId);
            return { id: photoId, url };
          })
        );

        // Get latest message
        const latestMessage = await ctx.db
          .query("messages")
          .withIndex("by_match", (q) => q.eq("matchId", match._id))
          .order("desc")
          .first();

        return {
          matchId: match._id,
          matchedAt: match.matchedAt,
          profile: { ...otherProfile, photos },
          latestMessage,
        };
      })
    );

    return matchesWithProfiles
      .filter(Boolean)
      .sort((a, b) => {
        // Sort by latest message time, then by match time
        const aTime = a!.latestMessage?.sentAt || a!.matchedAt;
        const bTime = b!.latestMessage?.sentAt || b!.matchedAt;
        return bTime - aTime;
      });
  },
});

export const getMessages = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user || !user._id || typeof user._id !== "string") return [];
    const userId: string = user._id;

    // Verify user is part of this match
    const match = await ctx.db.get(args.matchId);
    if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
      throw new Error("Not authorized to view this match");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_match_and_time", (q) => q.eq("matchId", args.matchId))
      .collect();

    return messages;
  },
});

export const sendMessage = mutation({
  args: {
    matchId: v.id("matches"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user || !user._id || typeof user._id !== "string") {
      throw new Error("Not authenticated");
    }
    const userId: string = user._id;

    // Verify user is part of this match
    const match = await ctx.db.get(args.matchId);
    if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
      throw new Error("Not authorized to send message to this match");
    }

    await ctx.db.insert("messages", {
      matchId: args.matchId,
      senderId: userId,
      content: args.content,
      sentAt: Date.now(),
    });

    // TODO: Add message notifications when properly exported
    // const receiverId = match.user1Id === userId ? match.user2Id : match.user1Id;
    // await ctx.scheduler.runAfter(0, internal.notifications.sendMessageNotification, {
    //   receiverId,
    //   senderId: userId,
    //   matchId: args.matchId,
    //   messagePreview: args.content,
    // });
  },
});
