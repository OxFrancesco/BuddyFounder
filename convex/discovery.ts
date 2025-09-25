import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const getDiscoveryProfiles = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get current user's profile to exclude them
    const currentProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!currentProfile) return [];

    // Get all swipes by current user
    const swipes = await ctx.db
      .query("swipes")
      .withIndex("by_swiper", (q) => q.eq("swiperId", userId))
      .collect();

    const swipedUserIds = new Set(swipes.map(s => s.swipedId));

    // Get all active profiles except current user and already swiped users
    const allProfiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const candidateProfiles = allProfiles.filter(
      profile => profile.userId !== userId && !swipedUserIds.has(profile.userId)
    );

    // Get photos for each profile
    const profilesWithPhotos = await Promise.all(
      candidateProfiles.map(async (profile) => {
        const photos = await Promise.all(
          profile.photos.map(async (photoId) => {
            const url = await ctx.storage.getUrl(photoId);
            return { id: photoId, url };
          })
        );
        return { ...profile, photos };
      })
    );

    // Return up to 10 profiles, shuffled
    return profilesWithPhotos
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);
  },
});

export const swipeProfile = mutation({
  args: {
    swipedUserId: v.id("users"),
    direction: v.union(v.literal("left"), v.literal("right")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already swiped
    const existingSwipe = await ctx.db
      .query("swipes")
      .withIndex("by_swiper_and_swiped", (q) => 
        q.eq("swiperId", userId).eq("swipedId", args.swipedUserId)
      )
      .unique();

    if (existingSwipe) {
      throw new Error("Already swiped on this user");
    }

    // Record the swipe
    await ctx.db.insert("swipes", {
      swiperId: userId,
      swipedId: args.swipedUserId,
      direction: args.direction,
    });

    // If it's a right swipe, check for a match
    if (args.direction === "right") {
      const reciprocalSwipe = await ctx.db
        .query("swipes")
        .withIndex("by_swiper_and_swiped", (q) => 
          q.eq("swiperId", args.swipedUserId).eq("swipedId", userId)
        )
        .unique();

      if (reciprocalSwipe && reciprocalSwipe.direction === "right") {
        // It's a match! Create match record
        const matchId = await ctx.db.insert("matches", {
          user1Id: userId < args.swipedUserId ? userId : args.swipedUserId,
          user2Id: userId < args.swipedUserId ? args.swipedUserId : userId,
          matchedAt: Date.now(),
        });

        // TODO: Add match notifications when properly exported
        // await ctx.scheduler.runAfter(0, internal.notifications.sendMatchNotification, {
        //   user1Id: userId,
        //   user2Id: args.swipedUserId,
        //   matchId,
        // });

        return { isMatch: true, matchId };
      }
    }

    return { isMatch: false };
  },
});
