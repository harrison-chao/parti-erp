"use server";

import { db } from "@/db";
import { purchaseOrders, poItems, suppliers, purchaseRequisitions, prItems, materials } from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { generateDocNo } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "./rbac";
import { revalidatePath } from "next/cache";

// Create purchase order
export async function createPurchaseOrder(data: {
  supplierId: string;
  purchaseDate: string;
  deliveryDate?: string;
  paymentTerms?: string;
  notes?: string;
  terms?: string;
  items: Array<{
    materialId: string;
    materialCode: string;
    materialName: string;
    specification?: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    relatedPrId?: string;
    relatedPrNo?: string;
    deliveryDate?: string;
  }>;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!(await hasPermission(PERMISSIONS.PURCHASE_CREATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const poNo = await generateDocNo("PO");
    
    // Calculate totals
    let totalAmount = 0;
    let totalTax = 0;
    
    data.items.forEach(item => {
      const lineAmount = item.quantity * item.unitPrice;
      const taxRate = item.taxRate || 13;
      const lineTax = lineAmount * (taxRate / 100);
      totalAmount += lineAmount;
      totalTax += lineTax;
    });

    const [po] = await db.insert(purchaseOrders).values({
      poNo,
      supplierId: data.supplierId,
      purchaseDate: data.purchaseDate,
      deliveryDate: data.deliveryDate,
      paymentTerms: data.paymentTerms as any,
      notes: data.notes,
      terms: data.terms,
      totalAmount: totalAmount.toFixed(2),
      taxAmount: totalTax.toFixed(2),
      totalWithTax: (totalAmount + totalTax).toFixed(2),
      purchaserId: session.user.id,
      status: "draft",
    }).returning();

    // Insert PO items
    for (const item of data.items) {
      const lineAmount = item.quantity * item.unitPrice;
      const taxRate = item.taxRate || 13;
      const lineTax = lineAmount * (taxRate / 100);

      await db.insert(poItems).values({
        poId: po.id,
        materialId: item.materialId,
        materialCode: item.materialCode,
        materialName: item.materialName,
        specification: item.specification,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        taxRate: taxRate.toFixed(2),
        lineAmount: lineAmount.toFixed(2),
        lineTaxAmount: lineTax.toFixed(2),
        relatedPrId: item.relatedPrId,
        relatedPrNo: item.relatedPrNo,
        deliveryDate: item.deliveryDate,
        pendingQty: item.quantity,
      });

      // Update PR status if linked
      if (item.relatedPrId) {
        await db.update(purchaseRequisitions)
          .set({ status: "converted", updatedAt: new Date() })
          .where(eq(purchaseRequisitions.id, item.relatedPrId));
      }
    }

    revalidatePath("/purchase/orders");
    return { success: true, data: po };
  } catch (error) {
    console.error("Failed to create purchase order:", error);
    return { success: false, error };
  }
}

// Get all purchase orders
export async function getPurchaseOrders(params?: {
  status?: string;
  supplierId?: string;
  page?: number;
  limit?: number;
}) {
  try {
    if (!(await hasPermission(PERMISSIONS.PURCHASE_READ))) {
      return { success: false, error: "Unauthorized" };
    }

    const { status, supplierId, page = 1, limit = 20 } = params || {};

    const conditions = [];
    if (status) {
      conditions.push(eq(purchaseOrders.status, status as any));
    }
    if (supplierId) {
      conditions.push(eq(purchaseOrders.supplierId, supplierId));
    }

    const results = await db
      .select({
        po: purchaseOrders,
        supplier: suppliers,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { success: true, data: results };
  } catch (error) {
    console.error("Failed to get purchase orders:", error);
    return { success: false, error };
  }
}

// Get single purchase order with items
export async function getPurchaseOrder(id: string) {
  try {
    if (!(await hasPermission(PERMISSIONS.PURCHASE_READ))) {
      return { success: false, error: "Unauthorized" };
    }

    const [po] = await db.select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id))
      .limit(1);

    if (!po) {
      return { success: false, error: "Purchase order not found" };
    }

    const items = await db.select()
      .from(poItems)
      .where(eq(poItems.poId, id));

    const supplier = await db.select()
      .from(suppliers)
      .where(eq(suppliers.id, po.supplierId))
      .limit(1);

    return { 
      success: true, 
      data: { ...po, items, supplier: supplier[0] } 
    };
  } catch (error) {
    console.error("Failed to get purchase order:", error);
    return { success: false, error };
  }
}

// Update purchase order status
export async function updatePurchaseOrderStatus(
  id: string,
  status: string,
  notes?: string
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const [po] = await db.select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id))
      .limit(1);

    if (!po) {
      return { success: false, error: "Purchase order not found" };
    }

    // Check permissions based on action
    if (status === "confirmed" && !(await hasPermission(PERMISSIONS.PURCHASE_APPROVE))) {
      return { success: false, error: "Unauthorized" };
    }

    const updateData: any = { status: status as any, updatedAt: new Date() };
    
    if (status === "confirmed") {
      updateData.approvedBy = session.user.id;
      updateData.approvedAt = new Date();
    }

    await db.update(purchaseOrders)
      .set(updateData)
      .where(eq(purchaseOrders.id, id));

    revalidatePath("/purchase/orders");
    return { success: true };
  } catch (error) {
    console.error("Failed to update purchase order status:", error);
    return { success: false, error };
  }
}

// Get purchase order statistics
export async function getPurchaseOrderStats() {
  try {
    if (!(await hasPermission(PERMISSIONS.PURCHASE_READ))) {
      return { success: false, error: "Unauthorized" };
    }

    const allPOs = await db.select().from(purchaseOrders);
    
    const stats = {
      draft: allPOs.filter(p => p.status === "draft").length,
      sent: allPOs.filter(p => p.status === "sent").length,
      confirmed: allPOs.filter(p => p.status === "confirmed").length,
      partial_received: allPOs.filter(p => p.status === "partial_received").length,
      fully_received: allPOs.filter(p => p.status === "fully_received").length,
      total: allPOs.length,
      totalAmount: allPOs.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0),
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("Failed to get PO stats:", error);
    return { success: false, error };
  }
}

// Convert PR to PO
export async function convertPRToPO(prId: string, supplierId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!(await hasPermission(PERMISSIONS.PURCHASE_CREATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const [pr] = await db.select()
      .from(purchaseRequisitions)
      .where(eq(purchaseRequisitions.id, prId))
      .limit(1);

    if (!pr) {
      return { success: false, error: "PR not found" };
    }

    const items = await db.select()
      .from(prItems)
      .where(eq(prItems.prId, prId));

    // Get supplier's prices for materials
    const materialIds = items.map(i => i.materialId).filter(Boolean);
    
    // Create PO with PR items
    const poData = {
      supplierId,
      purchaseDate: new Date().toISOString().split("T")[0],
      deliveryDate: pr.requiredDate || undefined,
      items: items.map(item => ({
        materialId: item.materialId!,
        materialCode: item.materialCode,
        materialName: item.materialName,
        specification: item.specification || undefined,
        quantity: item.suggestedQty,
        unitPrice: Number(item.unitPrice || 0),
        relatedPrId: prId,
        relatedPrNo: pr.prNo,
      })),
    };

    return createPurchaseOrder(poData);
  } catch (error) {
    console.error("Failed to convert PR to PO:", error);
    return { success: false, error };
  }
}
