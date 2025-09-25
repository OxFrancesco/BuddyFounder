import { v } from "convex/values";
import { query, action, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { cosineSimilarity } from "./embeddings";

// Main semantic search function
export const searchSimilarContent = action({
  args: {
    query: v.string(),
    userId: v.id("users"),
    limit: v.optional(v.number()),
    threshold: v.optional(v.number()),
    sourceTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // TODO: Implement vector search when embeddings are properly set up
    return [];
  },
});

// Hybrid search combining vector and keyword search
export const hybridSearch = action({
  args: {
    query: v.string(),
    userId: v.id("users"),
    limit: v.optional(v.number()),
    vectorWeight: v.optional(v.number()),
    keywordWeight: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // TODO: Implement hybrid search when vector search is ready
    return [];
  },
});

// Get context for AI chat based on the last message
export const getContextForAiChat = action({
  args: {
    query: v.string(),
    userId: v.id("users"),
    conversationHistory: v.optional(v.array(v.object({
      role: v.string(),
      content: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    // TODO: Implement context retrieval when search is ready
    return [];
  },
});

// Internal queries
export const getProcessedChunks = internalQuery({
  args: {
    userId: v.id("users"),
    sourceTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const chunks = await ctx.db
      .query("documentChunks")
      .withIndex("by_user_processed", (q) => q.eq("userId", args.userId))
      .filter((q) => q.neq(q.field("embedding"), undefined))
      .collect();

    if (!args.sourceTypes || args.sourceTypes.length === 0) {
      return chunks;
    }

    // Filter by source types
    const filteredChunks = [];
    for (const chunk of chunks) {
      const document = await ctx.db.get(chunk.documentId);
      if (document && args.sourceTypes.includes(document.sourceType)) {
        filteredChunks.push(chunk);
      }
    }

    return filteredChunks;
  },
});

export const getDocumentInfo = internalQuery({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }
    return document;
  },
});

export const keywordSearch = internalQuery({
  args: {
    query: v.string(),
    userId: v.id("users"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const queryWords = args.query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2);

    if (queryWords.length === 0) {
      return [];
    }

    const chunks = await ctx.db
      .query("documentChunks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const scoredChunks = chunks.map(chunk => {
      const content = chunk.content.toLowerCase();
      let score = 0;

      // Score based on word matches
      queryWords.forEach(word => {
        const matches = (content.match(new RegExp(word, 'g')) || []).length;
        score += matches;
      });

      // Boost score for exact phrase matches
      if (content.includes(args.query.toLowerCase())) {
        score += 10;
      }

      // Score based on keyword matches if available
      if (chunk.keywords) {
        chunk.keywords.forEach(keyword => {
          if (queryWords.includes(keyword)) {
            score += 5;
          }
        });
      }

      return {
        ...chunk,
        keywordScore: score / (content.length / 100), // Normalize by content length
      };
    });

    // Get document info for each chunk
    const results = [];
    for (const chunk of scoredChunks) {
      if (chunk.keywordScore > 0) {
        const document = await ctx.db.get(chunk.documentId);
        if (document) {
          results.push({
            chunkId: chunk._id,
            content: chunk.content,
            keywordScore: chunk.keywordScore,
            chunkIndex: chunk.chunkIndex,
            document: {
              id: document._id,
              title: document.title,
              sourceType: document.sourceType,
              sourceUrl: document.sourceUrl,
              metadata: document.metadata,
            },
          });
        }
      }
    }

    return results
      .sort((a, b) => b.keywordScore - a.keywordScore)
      .slice(0, args.limit);
  },
});

// Helper function to extract entities from text (names, companies, technologies, etc.)
export const extractEntities = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Implement entity extraction
    return {
      companies: [],
      technologies: [],
      locations: [],
      names: [],
    };
  },
});