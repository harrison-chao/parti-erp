"use server";

import { db } from "@/db";
import { 
  materialBatches, 
  batchUsageLogs, 
  materials,
  goodsReceipts,
  grItems,
  suppliers,
  purchaseOrders,
  productionOrders,
  salesOrders,
  inventory
} from "@/db/schema";
import { eq, desc, and, like } from "drizzle-orm";
import { hasPermission, PERMISSIONS } from "./rbac";

// Create batch for received goods
export async function createBatch(data: {
  materialId: string;
  supplierId?: string;
  grId?: string;
  poId?: string;
  productionDate?: string;
  expiryDate?: string;
  initialQty: number;
  unitCost?: number;
  warehouseId?: string;
  locationId?: string;
  qcReport?: any;
  notes?: string;
}) {
  try {
    if (!(await hasPermission(PERMISSIONS.GR_CREATE))) {
      return { success: false, error: "Unauthorized" };
    }

    // Generate batch number: LOT-[供应商]-[日期]-[流水]
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const supplierCode = data.supplierId ? data.supplierId.slice(0, 4) : "INT";
    
    // Get count for today
    const existingBatches = await db.select()
      .from(materialBatches)
      .where(like(materialBatches.batchNo, `LOT-${supplierCode}-${date}-%`));
    
    const seq = String(existingBatches.length + 1).padStart(3, "0");
    const batchNo = `LOT-${supplierCode}-${date}-${seq}`;

    const [batch] = await db.insert(materialBatches).values({
      batchNo,
      materialId: data.materialId,
      supplierId: data.supplierId,
      grId: data.grId,
      poId: data.poId,
      productionDate: data.productionDate,
      expiryDate: data.expiryDate,
      initialQty: data.initialQty,
      remainingQty: data.initialQty,
      unitCost: data.unitCost?.toString(),
      warehouseId: data.warehouseId,
      locationId: data.locationId,
      qcReport: data.qcReport,
      notes: data.notes,
      isActive: true,
    }).returning();

    return { success: true, data: batch };
  } catch (error) {
    console.error("Failed to create batch:", error);
    return { success: false, error };
  }
}

// Get batch by ID
export async function getBatch(id: string) {
  try {
    if (!(await hasPermission(PERMISSIONS.INVENTORY_READ))) {
      return { success: false, error: "Unauthorized" };
    }

    const [batch] = await db.select()
      .from(materialBatches)
      .where(eq(materialBatches.id, id))
      .limit(1);

    if (!batch) {
      return { success: false, error: "Batch not found" };
    }

    const material = await db.select()
      .from(materials)
      .where(eq(materials.id, batch.materialId))
      .limit(1);

    const supplier = batch.supplierId ? await db.select()
      .from(suppliers)
      .where(eq(suppliers.id, batch.supplierId))
      .limit(1) : [];

    const gr = batch.grId ? await db.select()
      .from(goodsReceipts)
      .where(eq(goodsReceipts.id, batch.grId))
      .limit(1) : [];

    return { 
      success: true, 
      data: { 
        ...batch, 
        material: material[0],
        supplier: supplier[0],
        goodsReceipt: gr[0]
      } 
    };
  } catch (error) {
    console.error("Failed to get batch:", error);
    return { success: false, error };
  }
}

// Get batches by material
export async function getBatchesByMaterial(materialId: string) {
  try {
    if (!(await hasPermission(PERMISSIONS.INVENTORY_READ))) {
      return { success: false, error: "Unauthorized" };
    }

    const batches = await db.select()
      .from(materialBatches)
      .where(eq(materialBatches.materialId, materialId))
      .orderBy(desc(materialBatches.createdAt));

    return { success: true, data: batches };
  } catch (error) {
    console.error("Failed to get batches:", error);
    return { success: false, error };
  }
}

// Trace batch usage (where was this batch used?)
export async function traceBatchUsage(batchId: string) {
  try {
    if (!(await hasPermission(PERMISSIONS.INVENTORY_READ))) {
      return { success: false, error: "Unauthorized" };
    }

    const [batch] = await db.select()
      .from(materialBatches)
      .where(eq(materialBatches.id, batchId))
      .limit(1);

    if (!batch) {
      return { success: false, error: "Batch not found" };
    }

    const usageLogs = await db.select()
      .from(batchUsageLogs)
      .where(eq(batchUsageLogs.batchId, batchId))
      .orderBy(desc(batchUsageLogs.createdAt));

    // Enrich usage logs with reference details
    const enrichedLogs = await Promise.all(usageLogs.map(async (log) => {
      let reference = null;
      
      if (log.referenceType === "WO" && log.referenceId) {
        const [wo] = await db.select()
          .from(productionOrders)
          .where(eq(productionOrders.id, log.referenceId))
          .limit(1);
        reference = wo;
      } else if (log.referenceType === "SO" && log.referenceId) {
        const [so] = await db.select()
          .from(salesOrders)
          .where(eq(salesOrders.id, log.referenceId))
          .limit(1);
        reference = so;
      }

      return { ...log, reference };
    }));

    return { 
      success: true, 
      data: {
        batch,
        usageLogs: enrichedLogs,
        totalUsed: usageLogs.reduce((sum, l) => sum + l.quantity, 0),
      }
    };
  } catch (error) {
    console.error("Failed to trace batch:", error);
    return { success: false, error };
  }
}

// Trace product batch chain (追溯产品的所有原料批次)
export async function traceProductBatches(workOrderId: string) {
  try {
    if (!(await hasPermission(PERMISSIONS.INVENTORY_READ))) {
      return { success: false, error: "Unauthorized" };
    }

    const [wo] = await db.select()
      .from(productionOrders)
      .where(eq(productionOrders.id, workOrderId))
      .limit(1);

    if (!wo) {
      return { success: false, error: "Work order not found" };
    }

    // Get all batch usage for this work order
    const usageLogs = await db.select()
      .from(batchUsageLogs)
      .where(
        and(
          eq(batchUsageLogs.referenceId, workOrderId),
          eq(batchUsageLogs.referenceType, "WO")
        )
      );

    const batchDetails = await Promise.all(usageLogs.map(async (log) => {
      const [batch] = await db.select()
        .from(materialBatches)
        .where(eq(materialBatches.id, log.batchId))
        .limit(1);

      const [material] = await db.select()
        .from(materials)
        .where(eq(materials.id, log.materialId))
        .limit(1);

      const [supplier] = batch?.supplierId ? await db.select()
        .from(suppliers)
        .where(eq(suppliers.id, batch.supplierId))
        .limit(1) : [null];

      return {
        usage: log,
        batch,
        material,
        supplier,
      };
    }));

    return {
      success: true,
      data: {
        workOrder: wo,
        batches: batchDetails,
      }
    };
  } catch (error) {
    console.error("Failed to trace product batches:", error);
    return { success: false, error };
  }
}

// Record batch usage
export async function recordBatchUsage(data: {
  batchId: string;
  materialId: string;
  usageType: string;
  referenceType: string;
  referenceNo: string;
  referenceId?: string;
  quantity: number;
  unitCost?: number;
}) {
  try {
    if (!(await hasPermission(PERMISSIONS.INVENTORY_UPDATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const [log] = await db.insert(batchUsageLogs).values(data).returning();

    // Update batch remaining quantity
    await db.update(materialBatches)
      .set({
        remainingQty: db.raw(`remaining_qty - ${data.quantity}`),
        updatedAt: new Date(),
      })
      .where(eq(materialBatches.id, data.batchId));

    return { success: true, data: log };
  } catch (error) {
    console.error("Failed to record batch usage:", error);
    return { success: false, error };
  }
}

// Get batch statistics
export async function getBatchStats() {
  try {
    if (!(await hasPermission(PERMISSIONS.INVENTORY_READ))) {
      return { success: false, error: "Unauthorized" };
    }

    const batches = await db.select().from(materialBatches);
    
    const stats = {
      total: batches.length,
      active: batches.filter(b => b.isActive).length,
      lowStock: batches.filter(b => b.remainingQty < 10).length,
      expired: batches.filter(b => {
        if (!b.expiryDate) return false;
        return new Date(b.expiryDate) < new Date();
      }).length,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("Failed to get batch stats:", error);
    return { success: false, error };
  }
}
