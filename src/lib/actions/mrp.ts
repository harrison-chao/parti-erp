"use server";

import { db } from "@/db";
import { 
  mrpRuns, 
  mrpDemands, 
  mrpSupplies, 
  mrpSuggestions,
  purchaseRequisitions,
  prItems,
  materials,
  inventory,
  salesOrders,
  salesOrderItems,
  productionOrders,
  boms,
  bomItems,
  purchaseOrders,
  poItems,
  productSkus,
} from "@/db/schema";
import { eq, and, gte, lte, inArray, desc, sql, gt } from "drizzle-orm";
import { generateDocNo } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "./rbac";

// ============================================================
// MRP 运算 - PRD V2.0 版本
// 基于BOM展开计算物料需求
// ============================================================

interface MRPParams {
  horizonDays?: number;
  materialIds?: string[];
  woId?: string; // 指定生产订单进行MRP运算
}

interface MRPDemand {
  materialId: string;
  demandDate: string;
  demandQty: number;
  demandType: string;
  referenceType: string;
  referenceNo: string;
  referenceId: string;
}

interface MRPSupply {
  materialId: string;
  supplyDate: string;
  supplyQty: number;
  supplyType: string;
  referenceType: string;
  referenceNo: string;
  referenceId: string;
}

interface MRPSuggestion {
  materialId: string;
  suggestedQty: number;
  suggestedDate: string;
  suggestionType: "purchase" | "transfer" | "production";
  priority: "high" | "medium" | "low";
  reason: string;
}

// Calculate material demands - V2
async function calculateDemandsV2(params: {
  horizonDays: number;
  materialIds?: string[];
  woId?: string;
}): Promise<MRPDemand[]> {
  const { horizonDays, materialIds, woId } = params;
  const demands: MRPDemand[] = [];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + horizonDays);

  // 1. 生产订单需求（基于BOM展开）
  const woConditions: any[] = [
    eq(productionOrders.status, "pending_confirm"),
    lte(productionOrders.estCompletionDate, endDate.toISOString().split("T")[0]),
  ];
  
  if (woId) {
    woConditions.push(eq(productionOrders.id, woId));
  }

  const productionOrdersData = await db
    .select({
      wo: productionOrders,
      sku: productSkus,
    })
    .from(productionOrders)
    .leftJoin(productSkus, eq(productionOrders.sku, productSkus.sku))
    .where(and(...woConditions));

  for (const { wo, sku } of productionOrdersData) {
    if (!sku?.bomId) {
      console.warn(`SKU ${wo.sku} has no BOM defined`);
      continue;
    }

    // Get BOM items
    const bomItemsData = await db
      .select({
        item: bomItems,
        material: materials,
      })
      .from(bomItems)
      .leftJoin(materials, eq(bomItems.materialId, materials.id))
      .where(eq(bomItems.bomId, sku.bomId));

    for (const { item, material } of bomItemsData) {
      if (!material || (materialIds && !materialIds.includes(material.id))) {
        continue;
      }

      // 计算考虑损耗的需求数量
      const baseQty = Number(item.quantity) * wo.quantity;
      const wastageRate = Number(item.wastageRate || 0) / 100;
      const totalQty = Math.ceil(baseQty * (1 + wastageRate));

      demands.push({
        materialId: material.id,
        demandDate: wo.estCompletionDate || new Date().toISOString().split("T")[0],
        demandQty: totalQty,
        demandType: "production_order",
        referenceType: "WO",
        referenceNo: wo.workOrderNo,
        referenceId: wo.id,
      });
    }
  }

  // 2. 安全库存需求
  const inventoryData = await db
    .select()
    .from(inventory)
    .where(gte(inventory.safetyStock, 0));

  for (const inv of inventoryData) {
    if (materialIds && !materialIds.includes(inv.materialId!)) continue;

    const availableQty = Number(inv.qtyAvailable || 0);
    const safetyStock = Number(inv.safetyStock || 0);

    if (availableQty < safetyStock) {
      demands.push({
        materialId: inv.materialId!,
        demandDate: new Date().toISOString().split("T")[0],
        demandQty: Math.ceil(safetyStock * 1.2 - availableQty), // 20% buffer
        demandType: "safety_stock",
        referenceType: "INV",
        referenceNo: inv.batchNo || "",
        referenceId: inv.id,
      });
    }
  }

  return demands;
}

// Calculate material supplies - V2
async function calculateSuppliesV2(params: {
  horizonDays: number;
  materialIds?: string[];
}): Promise<MRPSupply[]> {
  const { horizonDays, materialIds } = params;
  const supplies: MRPSupply[] = [];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + horizonDays);

  // 1. 当前库存
  const materialsConditions = [];
  if (materialIds) {
    materialsConditions.push(inArray(materials.id, materialIds));
  }
  
  const inventoryData = await db
    .select({
      inv: inventory,
      material: materials,
    })
    .from(inventory)
    .leftJoin(materials, eq(inventory.materialId, materials.id))
    .where(
      materialsConditions.length > 0 
        ? and(...materialsConditions) 
        : undefined
    );

  for (const { inv, material } of inventoryData) {
    if (!material) continue;

    supplies.push({
      materialId: material.id,
      supplyDate: new Date().toISOString().split("T")[0],
      supplyQty: Number(inv.qtyOnHand || 0),
      supplyType: "inventory",
      referenceType: "INV",
      referenceNo: inv.batchNo || "",
      referenceId: inv.id,
    });
  }

  // 2. 在途采购订单
  const purchaseOrdersData = await db
    .select({
      po: purchaseOrders,
      item: poItems,
    })
    .from(purchaseOrders)
    .innerJoin(poItems, eq(purchaseOrders.id, poItems.poId))
    .where(
      and(
        inArray(purchaseOrders.status, ["sent", "confirmed", "partial_received"]),
        lte(purchaseOrders.deliveryDate, endDate.toISOString().split("T")[0]),
        gt(poItems.pendingQty, 0)
      )
    );

  for (const { po, item } of purchaseOrdersData) {
    if (materialIds && !materialIds.includes(item.materialId!)) continue;

    supplies.push({
      materialId: item.materialId!,
      supplyDate: po.deliveryDate || new Date().toISOString().split("T")[0],
      supplyQty: Number(item.pendingQty || 0),
      supplyType: "purchase_order",
      referenceType: "PO",
      referenceNo: po.poNo,
      referenceId: po.id,
    });
  }

  return supplies;
}

// Generate MRP suggestions - V2
async function generateSuggestionsV2(params: {
  demands: MRPDemand[];
  supplies: MRPSupply[];
  materialIds?: string[];
}): Promise<MRPSuggestion[]> {
  const { demands, supplies } = params;
  const suggestions: MRPSuggestion[] = [];

  // 获取所有物料信息
  const materialsData = await db
    .select()
    .from(materials)
    .where(eq(materials.isActive, true));

  for (const material of materialsData) {
    const materialDemands = demands.filter(d => d.materialId === material.id);
    const materialSupplies = supplies.filter(s => s.materialId === material.id);

    const totalDemand = materialDemands.reduce((sum, d) => sum + d.demandQty, 0);
    const totalSupply = materialSupplies.reduce((sum, s) => sum + s.supplyQty, 0);
    const netRequirement = totalDemand - totalSupply;

    if (netRequirement > 0) {
      // 计算优先级
      let priority: "high" | "medium" | "low" = "medium";
      
      const earliestDemand = materialDemands.length > 0 
        ? materialDemands.sort((a, b) => a.demandDate.localeCompare(b.demandDate))[0]
        : null;

      if (earliestDemand) {
        const daysUntilDemand = Math.ceil(
          (new Date(earliestDemand.demandDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilDemand <= 3) {
          priority = "high";
        } else if (daysUntilDemand <= 7) {
          priority = "medium";
        } else {
          priority = "low";
        }
      }

      suggestions.push({
        materialId: material.id,
        suggestedQty: Math.ceil(netRequirement * 1.05), // 5% buffer
        suggestedDate: earliestDemand?.demandDate || new Date().toISOString().split("T")[0],
        suggestionType: "purchase",
        priority,
        reason: `净需求: ${netRequirement} (${totalDemand}需求 - ${totalSupply}供应)`,
      });
    }
  }

  return suggestions;
}

// Create PR from MRP suggestion
async function createPRFromSuggestion(
  mrpSuggestion: any,
  suggestion: MRPSuggestion
) {
  try {
    const session = await auth();
    
    // Get material info
    const [material] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, suggestion.materialId))
      .limit(1);

    if (!material) {
      return { success: false, error: "Material not found" };
    }

    const prNo = await generateDocNo("PR");

    const [pr] = await db.insert(purchaseRequisitions).values({
      prNo,
      prType: "mrp",
      requestedBy: session?.user?.id || "",
      requestDate: new Date().toISOString().split("T")[0],
      requiredDate: suggestion.suggestedDate,
      status: "draft",
      totalAmount: "0",
    }).returning();

    await db.insert(prItems).values({
      prId: pr.id,
      lineNo: 1,
      materialId: material.id,
      materialCode: material.code || material.id.slice(0, 8),
      materialName: material.name,
      specification: material.specification || "",
      requiredQty: suggestion.suggestedQty,
      suggestedQty: suggestion.suggestedQty,
      purpose: `MRP自动产生: ${suggestion.reason}`,
    });

    // Update suggestion with converted PR
    await db.update(mrpSuggestions)
      .set({
        convertedPrId: pr.id,
        isConverted: true,
      })
      .where(eq(mrpSuggestions.id, mrpSuggestion.id));

    return { success: true, data: pr };
  } catch (error) {
    console.error("Failed to create PR from suggestion:", error);
    return { success: false, error };
  }
}

// Run MRP calculation
export async function runMRP(params: MRPParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!(await hasPermission(PERMISSIONS.PURCHASE_CREATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const { horizonDays = 30, materialIds, woId } = params;
    
    const runNo = await generateDocNo("MRP");
    
    // Create MRP run record
    const [mrpRun] = await db.insert(mrpRuns).values({
      runNo,
      runBy: session.user.id,
      horizonDays,
      status: "running",
      parameters: { materialIds, horizonDays, woId },
    }).returning();

    try {
      // 1. Calculate demands based on production orders
      const demands = await calculateDemandsV2({ horizonDays, materialIds, woId });
      
      // 2. Calculate supplies
      const supplies = await calculateSuppliesV2({ horizonDays, materialIds });
      
      // 3. Generate suggestions
      const suggestions = await generateSuggestionsV2({
        demands, 
        supplies, 
        materialIds,
      });

      // 4. Save MRP results
      for (const demand of demands) {
        await db.insert(mrpDemands).values({
          mrpRunId: mrpRun.id,
          ...demand,
        });
      }

      for (const supply of supplies) {
        await db.insert(mrpSupplies).values({
          mrpRunId: mrpRun.id,
          ...supply,
        });
      }

      let createdPrCount = 0;

      for (const suggestion of suggestions) {
        const [mrpSugg] = await db.insert(mrpSuggestions).values({
          mrpRunId: mrpRun.id,
          ...suggestion,
        }).returning();

        // Auto-create PR for high priority suggestions
        if (suggestion.priority === "high" && suggestion.suggestionType === "purchase") {
          const pr = await createPRFromSuggestion(mrpSugg, suggestion);
          if (pr.success) {
            createdPrCount++;
          }
        }
      }

      // Update MRP run status
      await db.update(mrpRuns)
        .set({
          status: "completed",
          results: {
            demandCount: demands.length,
            supplyCount: supplies.length,
            suggestionCount: suggestions.length,
          },
          createdPrs: createdPrCount,
          completedAt: new Date(),
        })
        .where(eq(mrpRuns.id, mrpRun.id));

      return { 
        success: true, 
        data: {
          runId: mrpRun.id,
          runNo,
          demands: demands.length,
          supplies: supplies.length,
          suggestions: suggestions.length,
          createdPrs: createdPrCount,
        }
      };
    } catch (error) {
      await db.update(mrpRuns)
        .set({
          status: "failed",
          errorMessage: String(error),
          completedAt: new Date(),
        })
        .where(eq(mrpRuns.id, mrpRun.id));
      throw error;
    }
  } catch (error) {
    console.error("MRP run failed:", error);
    return { success: false, error };
  }
}

// Get MRP run results
export async function getMRPResults(runId: string) {
  try {
    const [run] = await db
      .select()
      .from(mrpRuns)
      .where(eq(mrpRuns.id, runId))
      .limit(1);

    if (!run) {
      return { success: false, error: "MRP run not found" };
    }

    const demands = await db
      .select()
      .from(mrpDemands)
      .where(eq(mrpDemands.mrpRunId, runId));

    const supplies = await db
      .select()
      .from(mrpSupplies)
      .where(eq(mrpSupplies.mrpRunId, runId));

    const suggestions = await db
      .select({
        suggestion: mrpSuggestions,
        material: materials,
      })
      .from(mrpSuggestions)
      .leftJoin(materials, eq(mrpSuggestions.materialId, materials.id))
      .where(eq(mrpSuggestions.mrpRunId, runId));

    return {
      success: true,
      data: {
        run,
        demands,
        supplies,
        suggestions,
      },
    };
  } catch (error) {
    console.error("Failed to get MRP results:", error);
    return { success: false, error };
  }
}

// Get MRP run history
export async function getMRPRuns(params?: {
  page?: number;
  limit?: number;
}) {
  try {
    const { page = 1, limit = 20 } = params || {};

    const runs = await db
      .select()
      .from(mrpRuns)
      .orderBy(desc(mrpRuns.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { success: true, data: runs };
  } catch (error) {
    console.error("Failed to get MRP runs:", error);
    return { success: false, error };
  }
}

// Trigger MRP for a specific work order
export async function triggerMRPForWorkOrder(workOrderId: string) {
  try {
    const [wo] = await db
      .select()
      .from(productionOrders)
      .where(eq(productionOrders.id, workOrderId))
      .limit(1);

    if (!wo) {
      return { success: false, error: "Work order not found" };
    }

    // Run MRP specifically for this work order
    const result = await runMRP({
      woId: workOrderId,
      horizonDays: 30,
    });

    return result;
  } catch (error) {
    console.error("Failed to trigger MRP for work order:", error);
    return { success: false, error };
  }
}
