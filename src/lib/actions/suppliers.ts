"use server";

import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { eq, desc, and, like } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "./rbac";
import { revalidatePath } from "next/cache";

// Get all suppliers
export async function getSuppliers(params?: {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { isActive, search, page = 1, limit = 50 } = params || {};

    const conditions: any[] = [];
    
    if (isActive !== undefined) {
      conditions.push(eq(suppliers.isActive, isActive));
    }
    
    if (search) {
      conditions.push(
        like(suppliers.companyName, `%${search}%`)
      );
    }

    const query = conditions.length > 0
      ? db.select().from(suppliers).where(and(...conditions))
      : db.select().from(suppliers);

    const data = await query
      .orderBy(desc(suppliers.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { success: true, data };
  } catch (error) {
    console.error("Failed to get suppliers:", error);
    return { success: false, error };
  }
}

// Get supplier by ID
export async function getSupplier(id: string) {
  try {
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (!supplier) {
      return { success: false, error: "Supplier not found" };
    }

    return { success: true, data: supplier };
  } catch (error) {
    console.error("Failed to get supplier:", error);
    return { success: false, error };
  }
}

// Create supplier
export async function createSupplier(data: {
  supplierId: string;
  companyName: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  paymentTerms?: "prepaid" | "on_delivery" | "monthly";
  taxId?: string;
  bankName?: string;
  bankAccount?: string;
  notes?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!(await hasPermission(PERMISSIONS.PURCHASE_CREATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const [supplier] = await db
      .insert(suppliers)
      .values({
        ...data,
        isActive: true,
      })
      .returning();

    revalidatePath("/purchase/suppliers");
    return { success: true, data: supplier };
  } catch (error) {
    console.error("Failed to create supplier:", error);
    return { success: false, error };
  }
}

// Update supplier
export async function updateSupplier(
  id: string,
  data: Partial<{
    companyName: string;
    contactPerson: string;
    contactPhone: string;
    contactEmail: string;
    address: string;
    paymentTerms: "prepaid" | "on_delivery" | "monthly";
    taxId: string;
    bankName: string;
    bankAccount: string;
    notes: string;
    isActive: boolean;
  }>
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!(await hasPermission(PERMISSIONS.PURCHASE_UPDATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const [supplier] = await db
      .update(suppliers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id))
      .returning();

    revalidatePath("/purchase/suppliers");
    return { success: true, data: supplier };
  } catch (error) {
    console.error("Failed to update supplier:", error);
    return { success: false, error };
  }
}
