import { v } from "convex/values";
import { query } from "./_generated/server";
import { authComponent } from "./auth";
import { Id } from "./_generated/dataModel";

export const getAllProfilesForAgent = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    const userId = user?._id as any;
    if (!userId) throw new Error("Not authenticated");

    // Get all active profiles except the current user's
    const profiles = await ctx.db
      .query("profiles")
      .filter((q) => q.and(
        q.eq(q.field("isActive"), true),
        q.neq(q.field("userId"), userId),
        q.eq(q.field("isComplete"), true)
      ))
      .collect();

    // Get current user's profile for comparison
    const currentProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return {
      profiles: profiles.map(profile => ({
        id: profile._id,
        userId: profile.userId,
        name: profile.name,
        bio: profile.bio,
        skills: profile.skills,
        interests: profile.interests,
        lookingFor: profile.lookingFor,
        location: profile.location,
        experience: profile.experience,
        twitter: profile.twitter,
        linkedin: profile.linkedin,
        portfolio: profile.portfolio,
      })),
      currentUser: currentProfile ? {
        name: currentProfile.name,
        bio: currentProfile.bio,
        skills: currentProfile.skills,
        interests: currentProfile.interests,
        lookingFor: currentProfile.lookingFor,
        location: currentProfile.location,
        experience: currentProfile.experience,
      } : null
    };
  },
});