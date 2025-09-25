import { v } from "convex/values";
import { action } from "../_generated/server";

// TODO: Re-enable when internal API exports are properly configured
// Temporarily disabled to allow build to pass

export const processPdfFile = action({
  args: {
    fileId: v.id("_storage"),
    title: v.string(),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // TODO: Implement PDF processing with pdf-parse
    return {
      success: false,
      message: "TODO: Implement PDF processing",
      documentId: null,
      stats: { pages: 0, characters: 0 }
    };
  },
});

export const validatePdfFile = action({
  args: {
    fileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // TODO: Implement PDF validation
    return { valid: true, size: 0, type: "application/pdf" };
  },
});

export const extractPdfMetadata = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Implement metadata extraction
    return {
      emails: [],
      phones: [],
      urls: [],
      skills: [],
      companies: [],
      education: [],
      certifications: [],
    };
  },
});