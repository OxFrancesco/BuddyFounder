import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return null;

    // Get photo URLs
    const photos = await Promise.all(
      profile.photos.map(async (photoId) => {
        const url = await ctx.storage.getUrl(photoId);
        return { id: photoId, url };
      })
    );

    return { ...profile, photos };
  },
});

export const createProfile = mutation({
  args: {
    name: v.string(),
    bio: v.string(),
    skills: v.array(v.string()),
    interests: v.array(v.string()),
    lookingFor: v.string(),
    location: v.optional(v.string()),
    experience: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      throw new Error("Profile already exists");
    }

    return await ctx.db.insert("profiles", {
      userId,
      name: args.name,
      bio: args.bio,
      skills: args.skills,
      interests: args.interests,
      lookingFor: args.lookingFor,
      photos: [],
      location: args.location,
      experience: args.experience,
      isActive: true,
    });
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    lookingFor: v.optional(v.string()),
    location: v.optional(v.string()),
    experience: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.skills !== undefined) updates.skills = args.skills;
    if (args.interests !== undefined) updates.interests = args.interests;
    if (args.lookingFor !== undefined) updates.lookingFor = args.lookingFor;
    if (args.location !== undefined) updates.location = args.location;
    if (args.experience !== undefined) updates.experience = args.experience;

    await ctx.db.patch(profile._id, updates);
  },
});

export const addPhoto = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    console.log("[profiles:addPhoto] start", { userId, storageId: args.storageId });
    if (!userId) {
      console.error("[profiles:addPhoto] Not authenticated");
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      console.warn("[profiles:addPhoto] Profile not found. Creating placeholder profile.", { userId });
      await ctx.db.insert("profiles", {
        userId,
        name: "",
        bio: "",
        skills: [],
        interests: [],
        lookingFor: "",
        photos: [args.storageId],
        experience: "",
        isActive: true,
      });
      console.log("[profiles:addPhoto] Placeholder profile created and photo added.");
      return null;
    }

    const updatedPhotos = [...profile.photos, args.storageId];
    await ctx.db.patch(profile._id, { photos: updatedPhotos });
    console.log("[profiles:addPhoto] Photo added to existing profile", { profileId: profile._id, photosCount: updatedPhotos.length });
    return null;
  },
});

export const removePhoto = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const updatedPhotos = profile.photos.filter(id => id !== args.storageId);
    await ctx.db.patch(profile._id, { photos: updatedPhotos });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.storage.generateUploadUrl();
  },
});
