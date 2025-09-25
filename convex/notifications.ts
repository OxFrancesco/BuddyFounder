import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// TODO: Re-enable when internal API exports are properly configured
// Temporarily disabled to allow build to pass

export const getUserNotifications = query({
  args: {
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = args.limit || 50;

    if (args.unreadOnly) {
      return await ctx.db
        .query("notifications")
        .withIndex("by_user_unread", (q) =>
          q.eq("userId", userId).eq("isRead", false)
        )
        .order("desc")
        .take(limit);
    } else {
      return await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(limit);
    }
  },
});

export const markNotificationAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error("Notification not found or not authorized");
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });
  },
});

export const markAllNotificationsAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", userId).eq("isRead", false)
      )
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
        readAt: Date.now(),
      });
    }

    return { marked: unreadNotifications.length };
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const count = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", userId).eq("isRead", false)
      )
      .collect();

    return count.length;
  },
});

export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error("Notification not found or not authorized");
    }

    await ctx.db.delete(args.notificationId);
  },
});