"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Create a new notification
export async function createNotification(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const notification = await db.notification.create({
      data: {
        userId: user.id,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || "medium",
        actionUrl: data.actionUrl,
        metadata: data.metadata,
        expiresAt: data.expiresAt,
      },
    });

    revalidatePath("/dashboard");
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }
}

// Get user notifications
export async function getNotifications(limit = 20, offset = 0) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const notifications = await db.notification.findMany({
      where: {
        userId: user.id,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Failed to fetch notifications");
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const notification = await db.notification.update({
      where: {
        id: notificationId,
        userId: user.id,
      },
      data: { isRead: true },
    });

    revalidatePath("/dashboard");
    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw new Error("Failed to mark notification as read");
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    await db.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw new Error("Failed to mark all notifications as read");
  }
}

// Delete notification
export async function deleteNotification(notificationId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    await db.notification.delete({
      where: {
        id: notificationId,
        userId: user.id,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw new Error("Failed to delete notification");
  }
}

// Get unread notification count
export async function getUnreadNotificationCount() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const count = await db.notification.count({
      where: {
        userId: user.id,
        isRead: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
    });

    return count;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    throw new Error("Failed to get unread notification count");
  }
}

// Smart notification generation based on user activity
export async function generateSmartNotifications() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      assessments: true,
      resume: true,
      coverLetter: true,
      careerGoals: true,
    },
  });

  if (!user) throw new Error("User not found");

  const notifications = [];

  try {
    // Check for resume completion
    if (!user.resume) {
      notifications.push({
        title: "Complete Your Resume",
        message: "Create your professional resume to start your job search journey.",
        type: "general",
        priority: "high",
        actionUrl: "/resume",
      });
    }

    // Check for interview practice
    const recentAssessments = user.assessments.filter(
      (assessment) => new Date(assessment.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    if (recentAssessments.length === 0) {
      notifications.push({
        title: "Practice Interview Skills",
        message: "Keep your interview skills sharp with regular practice sessions.",
        type: "skill_suggestion",
        priority: "medium",
        actionUrl: "/interview",
      });
    }

    // Check for career goals progress
    const incompleteGoals = user.careerGoals.filter(goal => !goal.isCompleted);
    if (incompleteGoals.length > 0) {
      notifications.push({
        title: "Update Your Career Goals",
        message: "Track your progress and stay motivated with your career objectives.",
        type: "general",
        priority: "medium",
        actionUrl: "/dashboard",
      });
    }

    // Create notifications
    for (const notificationData of notifications) {
      await createNotification(notificationData);
    }

    return { success: true, notificationsCreated: notifications.length };
  } catch (error) {
    console.error("Error generating smart notifications:", error);
    throw new Error("Failed to generate smart notifications");
  }
}
