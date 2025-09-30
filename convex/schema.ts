import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const applicationTables = {
  profiles: defineTable({
    userId: v.string(), // Auth subject ID, not a document ID
    name: v.string(),
    bio: v.string(),
    skills: v.array(v.string()),
    interests: v.array(v.string()),
    lookingFor: v.string(), // "technical co-founder", "business co-founder", "designer", etc.
    photos: v.array(v.id("_storage")),
    location: v.optional(v.string()),
    experience: v.string(), // "beginner", "intermediate", "expert"
    username: v.optional(v.string()), // Unique username for shareable profile URLs
    isActive: v.boolean(),
    isComplete: v.optional(v.boolean()), // Track if profile setup is completed with required fields
    // Social media fields
    twitter: v.optional(v.string()),
    discord: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    portfolio: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_username", ["username"]),

  swipes: defineTable({
    swiperId: v.string(), // Auth subject ID
    swipedId: v.string(), // Auth subject ID
    direction: v.union(v.literal("left"), v.literal("right")), // left = pass, right = like
  }).index("by_swiper", ["swiperId"])
    .index("by_swiped", ["swipedId"])
    .index("by_swiper_and_swiped", ["swiperId", "swipedId"]),

  matches: defineTable({
    user1Id: v.string(), // Auth subject ID
    user2Id: v.string(), // Auth subject ID
    matchedAt: v.number(),
  }).index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"]),

  messages: defineTable({
    matchId: v.id("matches"),
    senderId: v.string(), // Auth subject ID
    content: v.string(),
    sentAt: v.number(),
  }).index("by_match", ["matchId"])
    .index("by_match_and_time", ["matchId", "sentAt"]),

  // Enhanced tables for AI chat and RAG
  documents: defineTable({
    userId: v.string(), // Auth subject ID
    title: v.string(),
    content: v.string(),
    sourceType: v.union(
      v.literal("pdf"),
      v.literal("social"),
      v.literal("manual"),
      v.literal("website")
    ),
    sourceUrl: v.optional(v.string()), // For social media or website sources
    fileId: v.optional(v.id("_storage")),
    fileType: v.optional(v.string()),
    metadata: v.optional(v.object({
      platform: v.optional(v.string()), // "twitter", "github", "linkedin", etc.
      author: v.optional(v.string()),
      publishedAt: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
    })),
    uploadedAt: v.number(),
    processedAt: v.optional(v.number()),
    isPublic: v.boolean(), // Whether others can access this document for AI chat
    isProcessed: v.boolean(), // Whether embeddings have been generated
  }).index("by_user", ["userId"])
    .index("by_user_and_public", ["userId", "isPublic"])
    .index("by_source_type", ["userId", "sourceType"])
    .index("by_processed", ["isProcessed"]),

  aiChats: defineTable({
    participantId: v.string(), // Auth subject ID - Person chatting with the AI
    profileOwnerId: v.string(), // Auth subject ID - Person whose AI they're chatting with
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
      sources: v.optional(v.array(v.object({
        documentId: v.id("documents"),
        title: v.string(),
        relevanceScore: v.number(),
      }))), // Track which documents were used for AI response
    })),
    lastMessageAt: v.number(),
    totalMessages: v.number(),
  }).index("by_participant", ["participantId"])
    .index("by_profile_owner", ["profileOwnerId"])
    .index("by_participant_and_owner", ["participantId", "profileOwnerId"]),

  documentChunks: defineTable({
    documentId: v.id("documents"),
    userId: v.string(), // Auth subject ID
    content: v.string(),
    chunkIndex: v.number(),
    startIndex: v.number(), // Character position in original document
    endIndex: v.number(),
    embedding: v.optional(v.array(v.number())), // Vector embeddings for semantic search
    embeddingModel: v.optional(v.string()), // Track which model generated the embedding
    keywords: v.optional(v.array(v.string())), // Extracted keywords for hybrid search
  }).index("by_document", ["documentId"])
    .index("by_user", ["userId"])
    .index("by_user_processed", ["userId", "embedding"]),

  // Social media connections and data
  socialConnections: defineTable({
    userId: v.string(), // Auth subject ID
    platform: v.union(
      v.literal("twitter"),
      v.literal("github"),
      v.literal("linkedin"),
      v.literal("instagram"),
      v.literal("website")
    ),
    username: v.string(),
    profileUrl: v.string(),
    isActive: v.boolean(),
    lastScrapedAt: v.optional(v.number()),
    scrapingEnabled: v.boolean(),
    metadata: v.optional(v.object({
      followers: v.optional(v.number()),
      following: v.optional(v.number()),
      posts: v.optional(v.number()),
      bio: v.optional(v.string()),
      location: v.optional(v.string()),
      website: v.optional(v.string()),
    })),
  }).index("by_user", ["userId"])
    .index("by_platform", ["platform"])
    .index("by_user_and_platform", ["userId", "platform"]),

  // Notifications system
  notifications: defineTable({
    userId: v.string(), // Auth subject ID
    type: v.union(
      v.literal("match"),
      v.literal("message"),
      v.literal("ai_chat"),
      v.literal("profile_view"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    relatedUserId: v.optional(v.string()), // Auth subject ID
    relatedMatchId: v.optional(v.id("matches")),
    relatedChatId: v.optional(v.id("aiChats")),
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
    actionUrl: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"])
    .index("by_type", ["type"]),
};

export default defineSchema(applicationTables);
