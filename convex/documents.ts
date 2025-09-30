import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";
import { Id } from "./_generated/dataModel";

export const getUserDocuments = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    const userId = user?._id as any;
    if (!userId) return [];

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return documents;
  },
});

export const getPublicDocuments = query({
  args: {
    userId: v.string(), // Auth subject ID
  },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user_and_public", (q) => 
        q.eq("userId", args.userId).eq("isPublic", true)
      )
      .order("desc")
      .collect();

    return documents;
  },
});

export const uploadDocument = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    fileId: v.optional(v.id("_storage")),
    fileType: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const userId = user?._id as any;
    if (!userId) throw new Error("Not authenticated");

    const documentId = await ctx.db.insert("documents", {
      userId,
      title: args.title,
      content: args.content,
      sourceType: "manual",
      fileId: args.fileId,
      fileType: args.fileType,
      uploadedAt: Date.now(),
      isPublic: args.isPublic,
      isProcessed: false,
    });

    // Create chunks for better retrieval
    await createDocumentChunks(ctx, documentId, userId, args.content);

    return documentId;
  },
});

export const updateDocument = mutation({
  args: {
    documentId: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const userId = user?._id as any;
    if (!userId) throw new Error("Not authenticated");

    const document = await ctx.db.get(args.documentId);
    if (!document || document.userId !== userId) {
      throw new Error("Document not found or not authorized");
    }

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;

    await ctx.db.patch(args.documentId, updates);

    // If content was updated, recreate chunks
    if (args.content !== undefined) {
      // Delete existing chunks
      const existingChunks = await ctx.db
        .query("documentChunks")
        .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
        .collect();
      
      for (const chunk of existingChunks) {
        await ctx.db.delete(chunk._id);
      }

      // Create new chunks
      await createDocumentChunks(ctx, args.documentId, userId, args.content);
    }
  },
});

export const deleteDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const userId = user?._id as any;
    if (!userId) throw new Error("Not authenticated");

    const document = await ctx.db.get(args.documentId);
    if (!document || document.userId !== userId) {
      throw new Error("Document not found or not authorized");
    }

    // Delete associated chunks
    const chunks = await ctx.db
      .query("documentChunks")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();
    
    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }

    await ctx.db.delete(args.documentId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    const userId = user?._id as any;
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.storage.generateUploadUrl();
  },
});

// Helper function to create document chunks
async function createDocumentChunks(
  ctx: any,
  documentId: any,
  userId: any,
  content: string
) {
  // Simple chunking strategy: split by paragraphs and limit chunk size
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  const chunks: Array<{ content: string; startIndex: number; endIndex: number }> = [];
  let currentChunk = '';
  let currentStartIndex = 0;
  let currentPosition = 0;
  const maxChunkSize = 1000; // characters

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        startIndex: currentStartIndex,
        endIndex: currentPosition
      });
      currentStartIndex = currentPosition + 2; // +2 for the paragraph separator
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
    currentPosition += paragraph.length + 2; // +2 for '\n\n'
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      startIndex: currentStartIndex,
      endIndex: content.length
    });
  }

  // Insert chunks
  for (let i = 0; i < chunks.length; i++) {
    await ctx.db.insert("documentChunks", {
      documentId,
      userId,
      content: chunks[i].content,
      chunkIndex: i,
      startIndex: chunks[i].startIndex,
      endIndex: chunks[i].endIndex,
    });
  }
}
