import { db } from "@/db";
import { users, roles, permissions, userRoleEnum, priceTierEnum, settlementMethodEnum } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const PERMISSIONS = {
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
};

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Create permissions
  console.log("Creating permissions...");
  const permissionValues = Object.values(PERMISSIONS).map((code) => ({
    code,
    name: code.replace(/_/g, " ").replace(/:/g, " - "),
    module: code.split(":")[0],
    description: `Permission to ${code.replace(/:/g, " ")}`,
  }));

  for (const perm of permissionValues) {
    const existing = await db.select().from(permissions).where(eq(permissions.code, perm.code));
    if (existing.length === 0) {
      await db.insert(permissions).values(perm);
      console.log(`  ✓ Permission: ${perm.code}`);
    }
  }

  // 2. Create roles
  console.log("Creating roles...");
  const roleDefinitions = [
    {
      code: "admin",
      name: "系统管理员",
      description: "系统管理员，拥有所有权限",
      permissionCodes: Object.values(PERMISSIONS),
    },
    {
      code: "manager",
      name: "运营经理",
      description: "运营经理，管理日常运营",
      permissionCodes: [
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
    },
    {
      code: "operator",
      name: "运营专员",
      description: "日常运营操作",
      permissionCodes: [
        PERMISSIONS.DEALERS_READ,
        PERMISSIONS.DEALERS_CREATE,
        PERMISSIONS.SALES_ORDERS_READ,
        PERMISSIONS.SALES_ORDERS_CREATE,
        PERMISSIONS.PRODUCTION_READ,
        PERMISSIONS.PURCHASE_READ,
        PERMISSIONS.INVENTORY_READ,
        PERMISSIONS.INVENTORY_CREATE,
        PERMISSIONS.GR_READ,
        PERMISSIONS.GR_CREATE,
        PERMISSIONS.PRODUCTS_READ,
      ],
    },
    {
      code: "purchaser",
      name: "采购专员",
      description: "采购部门人员",
      permissionCodes: [
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
    },
    {
      code: "warehouse",
      name: "仓库管理员",
      description: "仓库管理人员",
      permissionCodes: [
        PERMISSIONS.INVENTORY_READ,
        PERMISSIONS.INVENTORY_CREATE,
        PERMISSIONS.INVENTORY_UPDATE,
        PERMISSIONS.INVENTORY_ADJUST,
        PERMISSIONS.GR_READ,
        PERMISSIONS.GR_CREATE,
        PERMISSIONS.GR_QC,
      ],
    },
    {
      code: "viewer",
      name: "只读用户",
      description: "仅查看权限",
      permissionCodes: [
        PERMISSIONS.DEALERS_READ,
        PERMISSIONS.SALES_ORDERS_READ,
        PERMISSIONS.PRODUCTION_READ,
        PERMISSIONS.PURCHASE_READ,
        PERMISSIONS.INVENTORY_READ,
        PERMISSIONS.GR_READ,
        PERMISSIONS.PRODUCTS_READ,
      ],
    },
  ];

  for (const roleDef of roleDefinitions) {
    let [role] = await db.select().from(roles).where(eq(roles.name, roleDef.name));
    
    if (!role) {
      [role] = await db.insert(roles).values({
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
      }).returning();
      console.log(`  ✓ Role: ${roleDef.name}`);
    }

    // Get permission IDs
    const rolePermissions = await db
      .select()
      .from(permissions)
      .where(eq(permissions.code, roleDef.permissionCodes as any));

    // Update role permissions (simplified - storing as JSON in a real app you'd have a join table)
    await db
      .update(roles)
      .set({ permissions: rolePermissions.map((p) => p.code) })
      .where(eq(roles.id, role.id));
  }

  // 3. Create admin user
  console.log("Creating admin user...");
  const adminEmail = "admin@parti.com";
  const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));

  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash("parti2024", 10);
    
    await db.insert(users).values({
      email: adminEmail,
      name: "系统管理员",
      passwordHash,
      role: "admin",
      isActive: true,
    });
    
    console.log(`  ✓ Admin user: ${adminEmail} / parti2024`);
  } else {
    console.log(`  ✓ Admin user already exists: ${adminEmail}`);
  }

  console.log("\n✅ Seeding completed!");
  console.log("\nDefault login:");
  console.log("  Email: admin@parti.com");
  console.log("  Password: parti2024");
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
