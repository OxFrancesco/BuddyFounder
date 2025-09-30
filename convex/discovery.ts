import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const getDiscoveryProfiles = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    const userId = user?._id as any;
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
    swipedUserId: v.string(), // Auth subject ID
    direction: v.union(v.literal("left"), v.literal("right")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const userId = user?._id as any;
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

export const getLikedProfiles = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    const userId = user?._id as any;
    if (!userId) return [];

    // Get all right swipes by current user
    const rightSwipes = await ctx.db
      .query("swipes")
      .withIndex("by_swiper", (q) => q.eq("swiperId", userId))
      .filter((q) => q.eq(q.field("direction"), "right"))
      .collect();

    const likedUserIds = rightSwipes.map(s => s.swipedId);

    if (likedUserIds.length === 0) return [];

    // Get profiles for liked users
    const likedProfiles = await Promise.all(
      likedUserIds.map(async (likedUserId) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", likedUserId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .unique();

        if (!profile) return null;

        // Get photos for the profile
        const photos = await Promise.all(
          profile.photos.map(async (photoId) => {
            const url = await ctx.storage.getUrl(photoId);
            return { id: photoId, url };
          })
        );

        // Check if it's a match (they liked us back)
        const isMatch = await ctx.db
          .query("matches")
          .filter((q) =>
            q.or(
              q.and(q.eq(q.field("user1Id"), userId), q.eq(q.field("user2Id"), likedUserId)),
              q.and(q.eq(q.field("user1Id"), likedUserId), q.eq(q.field("user2Id"), userId))
            )
          )
          .first();

        // Get the swipe info for ordering
        const swipeInfo = rightSwipes.find(s => s.swipedId === likedUserId);

        return {
          ...profile,
          photos,
          isMatch: !!isMatch,
          likedAt: swipeInfo?._creationTime || 0
        };
      })
    );

    return likedProfiles
      .filter(Boolean)
      .sort((a, b) => b!.likedAt - a!.likedAt); // Sort by most recently liked
  },
});
