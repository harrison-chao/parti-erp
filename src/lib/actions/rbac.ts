"use server";

import { db } from "@/db";
import { roles, permissions, users, userRoleEnum } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";

// Permission definitions
export const PERMISSIONS = {
  // Dealers
  DEALERS_READ: "dealers:read",
  DEALERS_CREATE: "dealers:create",
  DEALERS_UPDATE: "dealers:update",
  DEALERS_DELETE: "dealers:delete",
  DEALERS_APPROVE: "dealers:approve",
  
  // Sales Orders
  SALES_ORDERS_READ: "sales_orders:read",
  SALES_ORDERS_CREATE: "sales_orders:create",
  SALES_ORDERS_UPDATE: "sales_orders:update",
  SALES_ORDERS_DELETE: "sales_orders:delete",
  SALES_ORDERS_APPROVE: "sales_orders:approve",
  
  // Production
  PRODUCTION_READ: "production:read",
  PRODUCTION_CREATE: "production:create",
  PRODUCTION_UPDATE: "production:update",
  PRODUCTION_DELETE: "production:delete",
  PRODUCTION_CONFIRM: "production:confirm",
  
// Purchase
PURCHASE_READ: "purchase:read",
PURCHASE_CREATE: "purchase:create",
PURCHASE_UPDATE: "purchase:update",
PURCHASE_DELETE: "purchase:delete",
  PURCHASE_APPROVE: "purchase:approve",
  
  // Suppliers
  SUPPLIERS_READ: "suppliers:read",
  SUPPLIERS_CREATE: "suppliers:create",
  SUPPLIERS_UPDATE: "suppliers:update",
  SUPPLIERS_DELETE: "suppliers:delete",
  
  // Inventory
  INVENTORY_READ: "inventory:read",
  INVENTORY_CREATE: "inventory:create",
  INVENTORY_UPDATE: "inventory:update",
  INVENTORY_DELETE: "inventory:delete",
  INVENTORY_ADJUST: "inventory:adjust",
  
  // Goods Receipt
  GR_READ: "gr:read",
  GR_CREATE: "gr:create",
  GR_UPDATE: "gr:update",
  GR_QC: "gr:qc",
  
  // Products
  PRODUCTS_READ: "products:read",
  PRODUCTS_CREATE: "products:create",
  PRODUCTS_UPDATE: "products:update",
  PRODUCTS_DELETE: "products:delete",
  
  // Admin
  USERS_MANAGE: "users:manage",
  ROLES_MANAGE: "roles:manage",
  SETTINGS_MANAGE: "settings:manage",
  REPORTS_VIEW: "reports:view",
} as const;

// Role-based permission mappings
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: Object.values(PERMISSIONS),
  manager: [
    PERMISSIONS.DEALERS_READ,
    PERMISSIONS.DEALERS_CREATE,
    PERMISSIONS.DEALERS_UPDATE,
    PERMISSIONS.DEALERS_APPROVE,
    PERMISSIONS.SALES_ORDERS_READ,
    PERMISSIONS.SALES_ORDERS_CREATE,
    PERMISSIONS.SALES_ORDERS_UPDATE,
    PERMISSIONS.SALES_ORDERS_APPROVE,
    PERMISSIONS.PRODUCTION_READ,
    PERMISSIONS.PRODUCTION_CREATE,
    PERMISSIONS.PRODUCTION_UPDATE,
    PERMISSIONS.PRODUCTION_CONFIRM,
    PERMISSIONS.PURCHASE_READ,
    PERMISSIONS.PURCHASE_CREATE,
    PERMISSIONS.PURCHASE_UPDATE,
    PERMISSIONS.PURCHASE_APPROVE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.GR_READ,
    PERMISSIONS.GR_CREATE,
    PERMISSIONS.GR_QC,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  operator: [
    PERMISSIONS.DEALERS_READ,
    PERMISSIONS.DEALERS_CREATE,
    PERMISSIONS.SALES_ORDERS_READ,
    PERMISSIONS.SALES_ORDERS_CREATE,
    PERMISSIONS.SALES_ORDERS_UPDATE,
    PERMISSIONS.PRODUCTION_READ,
    PERMISSIONS.PRODUCTION_UPDATE,
    PERMISSIONS.PURCHASE_READ,
    PERMISSIONS.PURCHASE_CREATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.GR_READ,
    PERMISSIONS.GR_CREATE,
    PERMISSIONS.PRODUCTS_READ,
  ],
  purchaser: [
    PERMISSIONS.PURCHASE_READ,
    PERMISSIONS.PURCHASE_CREATE,
    PERMISSIONS.PURCHASE_UPDATE,
    PERMISSIONS.SUPPLIERS_READ,
    PERMISSIONS.SUPPLIERS_CREATE,
    PERMISSIONS.SUPPLIERS_UPDATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.GR_READ,
    PERMISSIONS.GR_CREATE,
  ],
  warehouse: [
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.GR_READ,
    PERMISSIONS.GR_CREATE,
    PERMISSIONS.GR_QC,
    PERMISSIONS.GR_UPDATE,
    PERMISSIONS.PRODUCTION_READ,
    PERMISSIONS.PRODUCTION_UPDATE,
  ],
  finance: [
    PERMISSIONS.SALES_ORDERS_READ,
    PERMISSIONS.PURCHASE_READ,
    PERMISSIONS.PURCHASE_APPROVE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.DEALERS_READ,
  ],
  factory: [
    PERMISSIONS.PRODUCTION_READ,
    PERMISSIONS.PRODUCTION_CREATE,
    PERMISSIONS.PRODUCTION_UPDATE,
    PERMISSIONS.PRODUCTION_CONFIRM,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.GR_READ,
  ],
};

// Check if user has permission
export async function hasPermission(permission: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  
  const userRole = session.user.role;
  const rolePerms = ROLE_PERMISSIONS[userRole] || [];
  return rolePerms.includes(permission);
}

// Check multiple permissions (AND logic)
export async function hasPermissions(permissions: string[]): Promise<boolean> {
  const checks = await Promise.all(permissions.map(p => hasPermission(p)));
  return checks.every(Boolean);
}

// Check any permission (OR logic)
export async function hasAnyPermission(permissions: string[]): Promise<boolean> {
  const checks = await Promise.all(permissions.map(p => hasPermission(p)));
  return checks.some(Boolean);
}

// Get user permissions
export async function getUserPermissions(): Promise<string[]> {
  const session = await auth();
  if (!session?.user) return [];
  
  return ROLE_PERMISSIONS[session.user.role] || [];
}

// Initialize default roles and permissions
export async function initializeRoles() {
  try {
    // Check if roles already exist
    const existingRoles = await db.select().from(roles);
    if (existingRoles.length > 0) {
      return { success: true, message: "Roles already initialized" };
    }

    // Create permissions
    const permissionValues = Object.values(PERMISSIONS);
    for (const permCode of permissionValues) {
      const [module, action] = permCode.split(":");
      await db.insert(permissions).values({
        code: permCode,
        name: `${module}.${action}`,
        module,
        description: `${action} ${module}`,
      }).onConflictDoNothing();
    }

    // Create roles with permissions
    const roleEntries = Object.entries(ROLE_PERMISSIONS);
    for (const [roleName, rolePermissions] of roleEntries) {
      await db.insert(roles).values({
        name: roleName,
        description: `${roleName} role`,
        permissions: rolePermissions,
        isSystem: true,
      }).onConflictDoNothing();
    }

    return { success: true, message: "Roles initialized successfully" };
  } catch (error) {
    console.error("Failed to initialize roles:", error);
    return { success: false, error };
  }
}

// Get all roles
export async function getAllRoles() {
  try {
    const allRoles = await db.select().from(roles);
    return { success: true, data: allRoles };
  } catch (error) {
    console.error("Failed to get roles:", error);
    return { success: false, error };
  }
}

// Get all permissions
export async function getAllPermissions() {
  try {
    const allPermissions = await db.select().from(permissions);
    return { success: true, data: allPermissions };
  } catch (error) {
    console.error("Failed to get permissions:", error);
    return { success: false, error };
  }
}

// Update role permissions
export async function updateRolePermissions(roleId: string, newPermissions: string[]) {
  try {
    await db.update(roles)
      .set({ permissions: newPermissions, updatedAt: new Date() })
      .where(eq(roles.id, roleId));
    return { success: true };
  } catch (error) {
    console.error("Failed to update role permissions:", error);
    return { success: false, error };
  }
}

// Assign role to user
export async function assignRoleToUser(userId: string, roleId: string) {
  try {
    const role = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    if (!role.length) {
      return { success: false, error: "Role not found" };
    }

    await db.update(users)
      .set({ 
        roleId: roleId,
        role: role[0].name as any,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
    
    return { success: true };
  } catch (error) {
    console.error("Failed to assign role:", error);
    return { success: false, error };
  }
}
