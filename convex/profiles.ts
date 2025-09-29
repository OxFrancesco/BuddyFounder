import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
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
    twitter: v.optional(v.string()),
    discord: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    portfolio: v.optional(v.string()),
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
      twitter: args.twitter,
      discord: args.discord,
      linkedin: args.linkedin,
      portfolio: args.portfolio,
      isActive: true,
      isComplete: true, // Mark as complete when created with all required fields
    });
  },
});

// Create incomplete profile during setup process
export const createIncompleteProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    lookingFor: v.optional(v.string()),
    location: v.optional(v.string()),
    experience: v.optional(v.string()),
    twitter: v.optional(v.string()),
    discord: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    portfolio: v.optional(v.string()),
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
      name: args.name || "",
      bio: args.bio || "",
      skills: args.skills || [],
      interests: args.interests || [],
      lookingFor: args.lookingFor || "",
      photos: [],
      location: args.location,
      experience: args.experience || "",
      twitter: args.twitter,
      discord: args.discord,
      linkedin: args.linkedin,
      portfolio: args.portfolio,
      isActive: true,
      isComplete: false, // Mark as incomplete during setup
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
    twitter: v.optional(v.string()),
    discord: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    portfolio: v.optional(v.string()),
    isComplete: v.optional(v.boolean()),
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
    if (args.twitter !== undefined) updates.twitter = args.twitter;
    if (args.discord !== undefined) updates.discord = args.discord;
    if (args.linkedin !== undefined) updates.linkedin = args.linkedin;
    if (args.portfolio !== undefined) updates.portfolio = args.portfolio;
    if (args.isComplete !== undefined) updates.isComplete = args.isComplete;

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
      console.error("[profiles:addPhoto] Profile not found. Cannot add photo without profile.");
      throw new Error("Profile must be created before adding photos");
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

export const deleteProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (profile) {
      await ctx.db.delete(profile._id);
    }
  },
});

// Internal query for Vapi webhook integration
export const getProfileForVapi = internalQuery({
  args: {
    userId: v.id("users"),
    infoType: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();

    if (!profile) return null;

    // Return different information based on the requested type
    return {
      name: profile.name,
      bio: profile.bio,
      skills: profile.skills,
      interests: profile.interests,
      experience: profile.experience,
      lookingFor: profile.lookingFor,
      location: profile.location
    };
  },
});

// Public query to get profile by username (for shareable links)
export const getProfileByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();

    if (!profile) return null;

    // Get photo URLs
    const photos = await Promise.all(
      profile.photos.map(async (photoId) => {
        const url = await ctx.storage.getUrl(photoId);
        return { id: photoId, url };
      })
    );

    // Return public profile data (no sensitive info)
    return {
      _id: profile._id,
      userId: profile.userId,
      name: profile.name,
      bio: profile.bio,
      skills: profile.skills,
      interests: profile.interests,
      lookingFor: profile.lookingFor,
      photos,
      location: profile.location,
      experience: profile.experience,
      username: profile.username,
      twitter: profile.twitter,
      linkedin: profile.linkedin,
      portfolio: profile.portfolio,
    };
  },
});

// Check if username is available
export const checkUsernameAvailability = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    return { available: !existingProfile };
  },
});

// Generate a unique username from a name
function generateUsername(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 30); // Limit length
}

// Update username for current user
export const updateUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate username format
    const username = args.username.trim().toLowerCase();
    if (username.length < 3 || username.length > 30) {
      throw new Error("Username must be between 3 and 30 characters");
    }
    if (!/^[a-z0-9-]+$/.test(username)) {
      throw new Error("Username can only contain letters, numbers, and hyphens");
    }
    if (username.startsWith('-') || username.endsWith('-')) {
      throw new Error("Username cannot start or end with a hyphen");
    }

    // Check if username is taken
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    if (existingProfile && existingProfile.userId !== userId) {
      throw new Error("Username is already taken");
    }

    // Update user's profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, { username });

    return { username };
  },
});

// Auto-generate username when profile is created/updated
export const generateUniqueUsername = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let baseUsername = generateUsername(args.name);
    let username = baseUsername;
    let counter = 1;

    // Keep checking until we find an available username
    while (true) {
      const existing = await ctx.db
        .query("profiles")
        .withIndex("by_username", (q) => q.eq("username", username))
        .unique();

      if (!existing) break;

      counter++;
      username = `${baseUsername}-${counter}`;
    }

    return { username };
  },
});
