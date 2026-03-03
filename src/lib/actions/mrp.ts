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
  billOfMaterials,
  bomItems,
  purchaseOrders,
  poItems
} from "@/db/schema";
import { eq, and, gte, lte, inArray, desc } from "drizzle-orm";
import { generateDocNo } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "./rbac";

// Run MRP calculation
export async function runMRP(params: {
  horizonDays?: number;
  materialIds?: string[];
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!(await hasPermission(PERMISSIONS.PURCHASE_CREATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const { horizonDays = 30, materialIds } = params;
    
    const runNo = await generateDocNo("MRP");
    
    // Create MRP run record
    const [mrpRun] = await db.insert(mrpRuns).values({
      runNo,
      runBy: session.user.id,
      horizonDays,
      status: "running",
      parameters: { materialIds, horizonDays },
    }).returning();

    try {
      // 1. Calculate demands
      const demands = await calculateDemands(horizonDays, materialIds);
      
      // 2. Calculate supplies
      const supplies = await calculateSupplies(horizonDays, materialIds);
      
      // 3. Generate suggestions
      const suggestions = await generateSuggestions(
        demands, 
        supplies, 
        materialIds
      );

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

// Calculate material demands
async function calculateDemands(horizonDays: number, materialIds?: string[]) {
  const demands: any[] = [];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + horizonDays);

  // 1. Sales order demands
  const salesOrdersData = await db.select({
    so: salesOrders,
    item: salesOrderItems,
  })
  .from(salesOrders)
  .innerJoin(salesOrderItems, eq(salesOrders.id, salesOrderItems.salesOrderId))
  .where(
    and(
      eq(salesOrders.status, "confirmed"),
      lte(salesOrders.targetDeliveryDate, endDate.toISOString().split("T")[0])
    )
  );

  for (const { so, item } of salesOrdersData) {
    // Get BOM for the product
    const boms = await db.select()
      .from(billOfMaterials)
      .where(eq(billOfMaterials.variantId, item.variantId!));

    if (boms.length > 0) {
      const bomItemsData = await db.select()
        .from(bomItems)
        .where(eq(bomItems.bomId, boms[0].id));

      for (const bomItem of bomItemsData) {
        if (materialIds && !materialIds.includes(bomItem.materialId!)) continue;

        demands.push({
          materialId: bomItem.materialId,
          demandDate: so.targetDeliveryDate,
          demandQty: Math.ceil(item.quantity * Number(bomItem.quantity)),
          demandType: "sales_order",
          referenceType: "SO",
          referenceNo: so.orderNo,
          referenceId: so.id,
        });
      }
    }
  }

  // 2. Production order demands
  const productionOrdersData = await db.select()
    .from(productionOrders)
    .where(
      and(
        eq(productionOrders.status, "pending_confirm"),
        lte(productionOrders.estCompletionDate, endDate.toISOString().split("T")[0])
      )
    );

  for (const po of productionOrdersData) {
    const boms = await db.select()
      .from(billOfMaterials)
      .where(eq(billOfMaterials.variantId, po.variantId!));

    if (boms.length > 0) {
      const bomItemsData = await db.select()
        .from(bomItems)
        .where(eq(bomItems.bomId, boms[0].id));

      for (const bomItem of bomItemsData) {
        if (materialIds && !materialIds.includes(bomItem.materialId!)) continue;

        demands.push({
          materialId: bomItem.materialId,
          demandDate: po.estCompletionDate,
          demandQty: Math.ceil(po.quantity * Number(bomItem.quantity)),
          demandType: "production",
          referenceType: "WO",
          referenceNo: po.workOrderNo,
          referenceId: po.id,
        });
      }
    }
  }

  // 3. Safety stock demands (for materials below safety stock)
  const inventoryData = await db.select()
    .from(inventory)
    .where(gte(inventory.safetyStock, 0));

  for (const inv of inventoryData) {
    if (materialIds && !materialIds.includes(inv.materialId!)) continue;

    if (inv.qtyAvailable < inv.safetyStock) {
      demands.push({
        materialId: inv.materialId,
        demandDate: new Date().toISOString().split("T")[0],
        demandQty: Math.ceil(inv.safetyStock * 1.2 - inv.qtyAvailable), // 20% buffer
        demandType: "safety_stock",
        referenceType: null,
        referenceNo: null,
        referenceId: null,
      });
    }
  }

  return demands;
}

// Calculate material supplies
async function calculateSupplies(horizonDays: number, materialIds?: string[]) {
  const supplies: any[] = [];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + horizonDays);

  // 1. Current inventory
  let inventoryQuery = db.select().from(inventory);
  if (materialIds) {
    inventoryQuery = inventoryQuery.where(inArray(inventory.materialId, materialIds));
  }
  const inventoryData = await inventoryQuery;

  for (const inv of inventoryData) {
    supplies.push({
      materialId: inv.materialId,
      supplyDate: new Date().toISOString().split("T")[0],
      supplyQty: inv.qtyOnHand,
      supplyType: "inventory",
      referenceType: "INV",
      referenceNo: inv.batchNo,
      referenceId: inv.id,
    });
  }

  // 2. Incoming purchase orders
  const purchaseOrdersData = await db.select({
    po: purchaseOrders,
    item: poItems,
  })
  .from(purchaseOrders)
  .innerJoin(poItems, eq(purchaseOrders.id, poItems.poId))
  .where(
    and(
      inArray(purchaseOrders.status, ["confirmed", "partial_received"]),
      gte(poItems.pendingQty, 0),
      lte(purchaseOrders.deliveryDate, endDate.toISOString().split("T")[0])
    )
  );

  for (const { po, item } of purchaseOrdersData) {
    if (materialIds && item.materialId && !materialIds.includes(item.materialId)) continue;

    supplies.push({
      materialId: item.materialId,
      supplyDate: po.deliveryDate,
      supplyQty: item.pendingQty,
      supplyType: "po",
      referenceType: "PO",
      referenceNo: po.poNo,
      referenceId: po.id,
    });
  }

  return supplies;
}

// Generate MRP suggestions
async function generateSuggestions(
  demands: any[],
  supplies: any[],
  materialIds?: string[]
) {
  const suggestions: any[] = [];

  // Get all materials
  let materialsQuery = db.select().from(materials);
  if (materialIds) {
    materialsQuery = materialsQuery.where(inArray(materials.id, materialIds));
  }
  const materialsData = await materialsQuery;

  for (const material of materialsData) {
    const materialDemands = demands.filter(d => d.materialId === material.id);
    const materialSupplies = supplies.filter(s => s.materialId === material.id);

    const totalDemand = materialDemands.reduce((sum, d) => sum + d.demandQty, 0);
    const totalSupply = materialSupplies.reduce((sum, s) => sum + s.supplyQty, 0);
    const netRequirement = totalDemand - totalSupply;

    if (netRequirement > 0) {
      // Sort demands by date
      const sortedDemands = materialDemands.sort((a, b) => 
        new Date(a.demandDate).getTime() - new Date(b.demandDate).getTime()
      );

      const requiredDate = sortedDemands[0]?.demandDate || new Date().toISOString().split("T")[0];
      
      // Determine priority based on urgency
      const daysUntilRequired = Math.ceil(
        (new Date(requiredDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      let priority = "normal";
      if (daysUntilRequired <= 3) priority = "high";
      else if (daysUntilRequired > 14) priority = "low";

      suggestions.push({
        materialId: material.id,
        suggestionType: "purchase",
        suggestedQty: Math.ceil(netRequirement * 1.1), // 10% buffer
        suggestedDate: requiredDate,
        reason: `Net requirement: ${netRequirement} (${totalDemand} demand - ${totalSupply} supply)`,
        priority,
      });
    }
  }

  return suggestions;
}

// Create PR from MRP suggestion
async function createPRFromSuggestion(suggestion: any, data: any) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const material = await db.select()
      .from(materials)
      .where(eq(materials.id, data.materialId))
      .limit(1);

    if (!material.length) {
      return { success: false, error: "Material not found" };
    }

    const prNo = await generateDocNo("PR");
    
    const [pr] = await db.insert(purchaseRequisitions).values({
      prNo,
      prType: "mrp",
      requestedBy: session.user.id,
      requestDate: new Date().toISOString().split("T")[0],
      requiredDate: data.suggestedDate,
      status: "pending",
      mrpRunId: suggestion.mrpRunId,
      notes: `Auto-generated from MRP: ${data.reason}`,
    }).returning();

    await db.insert(prItems).values({
      prId: pr.id,
      lineNo: 1,
      materialId: data.materialId,
      materialCode: material[0].code,
      materialName: material[0].name,
      specification: material[0].specification,
      requiredQty: data.suggestedQty,
      suggestedQty: data.suggestedQty,
    });

    await db.update(mrpSuggestions)
      .set({ 
        isConverted: true, 
        convertedPrId: pr.id 
      })
      .where(eq(mrpSuggestions.id, suggestion.id));

    return { success: true, data: pr };
  } catch (error) {
    console.error("Failed to create PR from suggestion:", error);
    return { success: false, error };
  }
}

// Get MRP runs
export async function getMRPRuns(page = 1, limit = 20) {
  try {
    if (!(await hasPermission(PERMISSIONS.PURCHASE_READ))) {
      return { success: false, error: "Unauthorized" };
    }

    const runs = await db.select()
      .from(mrpRuns)
      .orderBy(desc(mrpRuns.runDate))
      .limit(limit)
      .offset((page - 1) * limit);

    return { success: true, data: runs };
  } catch (error) {
    console.error("Failed to get MRP runs:", error);
    return { success: false, error };
  }
}

// Get MRP run details
export async function getMRPRunDetails(runId: string) {
  try {
    if (!(await hasPermission(PERMISSIONS.PURCHASE_READ))) {
      return { success: false, error: "Unauthorized" };
    }

    const [run] = await db.select()
      .from(mrpRuns)
      .where(eq(mrpRuns.id, runId))
      .limit(1);

    if (!run) {
      return { success: false, error: "MRP run not found" };
    }

    const demands = await db.select()
      .from(mrpDemands)
      .where(eq(mrpDemands.mrpRunId, runId));

    const supplies = await db.select()
      .from(mrpSupplies)
      .where(eq(mrpSupplies.mrpRunId, runId));

    const suggestions = await db.select()
      .from(mrpSuggestions)
      .where(eq(mrpSuggestions.mrpRunId, runId));

    return { 
      success: true, 
      data: { run, demands, supplies, suggestions } 
    };
  } catch (error) {
    console.error("Failed to get MRP run details:", error);
    return { success: false, error };
  }
}
