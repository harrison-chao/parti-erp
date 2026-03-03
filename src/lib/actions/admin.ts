"use server";

import { db } from "@/db";
import { systemConfigs, DEFAULT_SYSTEM_CONFIGS, users, roles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "./rbac";
import bcrypt from "bcryptjs";

// Initialize system configs
export async function initializeSystemConfigs() {
  try {
    const existing = await db.select().from(systemConfigs);
    if (existing.length > 0) {
      return { success: true, message: "Configs already initialized" };
    }

    for (const [key, value] of Object.entries(DEFAULT_SYSTEM_CONFIGS)) {
      await db.insert(systemConfigs).values({
        key,
        value: String(value),
        type: "string",
        description: `Default ${key}`,
      });
    }

    return { success: true, message: "Configs initialized" };
  } catch (error) {
    console.error("Failed to initialize configs:", error);
    return { success: false, error };
  }
}

// Get all system configs
export async function getSystemConfigs() {
  try {
    if (!(await hasPermission(PERMISSIONS.SETTINGS_MANAGE))) {
      return { success: false, error: "Unauthorized" };
    }

    const configs = await db.select().from(systemConfigs);
    return { success: true, data: configs };
  } catch (error) {
    console.error("Failed to get configs:", error);
    return { success: false, error };
  }
}

// Update system config
export async function updateSystemConfig(key: string, value: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!(await hasPermission(PERMISSIONS.SETTINGS_MANAGE))) {
      return { success: false, error: "Unauthorized" };
    }

    await db.update(systemConfigs)
      .set({
        value,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(systemConfigs.key, key));

    return { success: true };
  } catch (error) {
    console.error("Failed to update config:", error);
    return { success: false, error };
  }
}

// Get system statistics
export async function getSystemStats() {
  try {
    if (!(await hasPermission(PERMISSIONS.REPORTS_VIEW))) {
      return { success: false, error: "Unauthorized" };
    }

    const userCount = await db.select().from(users);
    const roleCount = await db.select().from(roles);

    return {
      success: true,
      data: {
        users: userCount.length,
        roles: roleCount.length,
      }
    };
  } catch (error) {
    console.error("Failed to get system stats:", error);
    return { success: false, error };
  }
}

// Create user
export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  department?: string;
}) {
  try {
    if (!(await hasPermission(PERMISSIONS.USERS_MANAGE))) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if email exists
    const existing = await db.select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "Email already exists" };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const [user] = await db.insert(users).values({
      name: data.name,
      email: data.email,
      passwordHash,
      role: (data.role || "operator") as any,
      phone: data.phone,
      department: data.department,
    }).returning();

    return { success: true, data: user };
  } catch (error) {
    console.error("Failed to create user:", error);
    return { success: false, error };
  }
}

// Get all users
export async function getUsers() {
  try {
    if (!(await hasPermission(PERMISSIONS.USERS_MANAGE))) {
      return { success: false, error: "Unauthorized" };
    }

    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      department: users.department,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    }).from(users);

    return { success: true, data: allUsers };
  } catch (error) {
    console.error("Failed to get users:", error);
    return { success: false, error };
  }
}
