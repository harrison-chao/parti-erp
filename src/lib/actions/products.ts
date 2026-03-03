"use server";

import { db } from "@/db";
import {
  productCategories,
  productSpecs,
  surfaceTreatments,
  preprocessingOptions,
  productSkus,
  skuPreprocessing,
  materials,
  boms,
  bomItems,
  dealerSkuPrices,
  productionProcesses,
  productRoutings,
} from "@/db/schema";
import { eq, and, desc, asc, like, inArray, sql } from "drizzle-orm";
import { generateDocNo } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "./rbac";

// ============================================================
// 产品分类管理
// ============================================================

export async function getProductCategories() {
  try {
    const categories = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.isActive, true))
      .orderBy(asc(productCategories.sortOrder));
    return { success: true, data: categories };
  } catch (error) {
    console.error("Failed to get product categories:", error);
    return { success: false, error };
  }
}

export async function createProductCategory(data: {
  code: string;
  name: string;
  version: "C" | "H";
  series: "MR" | "OL" | "Q" | "R" | "LY" | "PTB" | "SSTB" | "CASTER" | "ADJUST";
  description?: string;
}) {
  try {
    if (!(await hasPermission(PERMISSIONS.PRODUCTS_CREATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const [category] = await db
      .insert(productCategories)
      .values({
        ...data,
        isActive: true,
      })
      .returning();

    return { success: true, data: category };
  } catch (error) {
    console.error("Failed to create product category:", error);
    return { success: false, error };
  }
}

// ============================================================
// 产品规格管理
// ============================================================

export async function getProductSpecs(categoryId?: string) {
  try {
    const conditions = [eq(productSpecs.isActive, true)];
    
    if (categoryId) {
      conditions.push(eq(productSpecs.categoryId, categoryId));
    }
    
    const specs = await db
      .select()
      .from(productSpecs)
      .where(and(...conditions))
      .orderBy(asc(productSpecs.specCode));
    
    return { success: true, data: specs };
  } catch (error) {
    console.error("Failed to get product specs:", error);
    return { success: false, error };
  }
}

export async function createProductSpec(data: {
  specCode: string;
  categoryId: string;
  name: string;
  description?: string;
  width?: string;
  height?: string;
  slotWidth?: string;
  standardLength?: number;
  weightPerMeter?: string;
}) {
  try {
    if (!(await hasPermission(PERMISSIONS.PRODUCTS_CREATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const [spec] = await db
      .insert(productSpecs)
      .values({
        ...data,
        width: data.width ? data.width : undefined,
        height: data.height ? data.height : undefined,
        slotWidth: data.slotWidth ? data.slotWidth : undefined,
        weightPerMeter: data.weightPerMeter ? data.weightPerMeter : undefined,
        isActive: true,
      })
      .returning();

    return { success: true, data: spec };
  } catch (error) {
    console.error("Failed to create product spec:", error);
    return { success: false, error };
  }
}

// ============================================================
// 表面处理管理
// ============================================================

export async function getSurfaceTreatments() {
  try {
    const treatments = await db
      .select()
      .from(surfaceTreatments)
      .where(eq(surfaceTreatments.isActive, true))
      .orderBy(asc(surfaceTreatments.code));
    return { success: true, data: treatments };
  } catch (error) {
    console.error("Failed to get surface treatments:", error);
    return { success: false, error };
  }
}

export async function createSurfaceTreatment(data: {
  processCode: "A" | "P" | "W" | "T";
  colorCode: string;
  name: string;
  type: "anodize" | "powder" | "paint" | "transfer";
  description?: string;
  priceAdder?: string;
}) {
  try {
    if (!(await hasPermission(PERMISSIONS.PRODUCTS_CREATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const code = `${data.processCode}-${data.colorCode}`;

    const [treatment] = await db
      .insert(surfaceTreatments)
      .values({
        code,
        name: data.name,
        type: data.type,
        colorCode: data.colorCode,
        priceAdder: data.priceAdder || "0",
        isActive: true,
      })
      .returning();

    return { success: true, data: treatment };
  } catch (error) {
    console.error("Failed to create surface treatment:", error);
    return { success: false, error };
  }
}

// ============================================================
// 预加工选项管理
// ============================================================

export async function getPreprocessingOptions() {
  try {
    const options = await db
      .select()
      .from(preprocessingOptions)
      .where(eq(preprocessingOptions.isActive, true))
      .orderBy(asc(preprocessingOptions.code));
    return { success: true, data: options };
  } catch (error) {
    console.error("Failed to get preprocessing options:", error);
    return { success: false, error };
  }
}

export async function createPreprocessingOption(data: {
  type: "cut_inch" | "cut_mm" | "drill" | "embed";
  code: string;
  name: string;
  description?: string;
  processingFee?: string;
  lengthValue?: number;
  lengthUnit?: string;
}) {
  try {
    if (!(await hasPermission(PERMISSIONS.PRODUCTS_CREATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const [option] = await db
      .insert(preprocessingOptions)
      .values({
        ...data,
        processingFee: data.processingFee || "0",
        isActive: true,
      })
      .returning();

    return { success: true, data: option };
  } catch (error) {
    console.error("Failed to create preprocessing option:", error);
    return { success: false, error };
  }
}

// ============================================================
// SKU 管理
// ============================================================

export async function getProductSkus(params?: {
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { categoryId, search, page = 1, limit = 20 } = params || {};
    
    const conditions: any[] = [eq(productSkus.isActive, true)];
    
    if (categoryId) {
      conditions.push(eq(productSkus.categoryId, categoryId));
    }
    
    if (search) {
      conditions.push(
        sql`${productSkus.sku} LIKE ${`%${search}%`} OR ${productSkus.name} LIKE ${`%${search}%`}`
      );
    }
    
    const skus = await db
      .select()
      .from(productSkus)
      .where(and(...conditions))
      .orderBy(desc(productSkus.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { success: true, data: skus };
  } catch (error) {
    console.error("Failed to get product SKUs:", error);
    return { success: false, error };
  }
}

export async function getProductSku(id: string) {
  try {
    const [sku] = await db
      .select()
      .from(productSkus)
      .where(eq(productSkus.id, id))
      .limit(1);

    if (!sku) {
      return { success: false, error: "SKU not found" };
    }

    return { success: true, data: sku };
  } catch (error) {
    console.error("Failed to get product SKU:", error);
    return { success: false, error };
  }
}

export async function createProductSku(data: {
  categoryId: string;
  specId: string;
  surfaceTreatmentId?: string;
  versionCode: string;
  seriesCode: string;
  specCode: string;
  surfaceCode?: string;
  preprocessingChain?: string;
  name: string;
  description?: string;
  basePrice: string;
  unit?: string;
  isCustomizable?: boolean;
}) {
  try {
    if (!(await hasPermission(PERMISSIONS.PRODUCTS_CREATE))) {
      return { success: false, error: "Unauthorized" };
    }

    // 生成 SKU 编码
    const skuParts = [data.versionCode, data.seriesCode, data.specCode];
    if (data.surfaceCode) skuParts.push(data.surfaceCode);
    if (data.preprocessingChain) skuParts.push(data.preprocessingChain);
    const sku = skuParts.join("-");

    const [productSku] = await db
      .insert(productSkus)
      .values({
        ...data,
        sku,
        basePrice: data.basePrice,
        unit: data.unit || "根",
        isCustomizable: data.isCustomizable ?? true,
        isActive: true,
      })
      .returning();

    return { success: true, data: productSku };
  } catch (error) {
    console.error("Failed to create product SKU:", error);
    return { success: false, error };
  }
}

export async function updateProductSku(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    basePrice: string;
    unit: string;
    isCustomizable: boolean;
    isActive: boolean;
  }>
) {
  try {
    if (!(await hasPermission(PERMISSIONS.PRODUCTS_UPDATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const [sku] = await db
      .update(productSkus)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(productSkus.id, id))
      .returning();

    return { success: true, data: sku };
  } catch (error) {
    console.error("Failed to update product SKU:", error);
    return { success: false, error };
  }
}

// ============================================================
// ============================================================
// 物料管理（原材料）
// ============================================================

export async function getMaterials(params?: {
  materialType?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { materialType, search, page = 1, limit = 20 } = params || {};
    
    const conditions: any[] = [eq(materials.isActive, true)];
    
    if (materialType) {
      conditions.push(eq(materials.materialType, materialType as any));
    }
    
    if (search) {
      conditions.push(
        sql`${materials.code} LIKE ${`%${search}%`} OR ${materials.name} LIKE ${`%${search}%`}`
      );
    }
    
    const items = await db
      .select()
      .from(materials)
      .where(and(...conditions))
      .orderBy(asc(materials.code))
      .limit(limit)
      .offset((page - 1) * limit);

    return { success: true, data: items };
  } catch (error) {
    console.error("Failed to get materials:", error);
    return { success: false, error };
  }
}

export async function createMaterial(data: {
  code: string;
  name: string;
  materialType: "raw" | "semi_finished" | "finished" | "packaging";
  specification?: string;
  unit: string;
  unitCost?: string;
}) {
  try {
    if (!(await hasPermission(PERMISSIONS.PRODUCTS_CREATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const [material] = await db
      .insert(materials)
      .values({
        ...data,
        unitCost: data.unitCost || "0",
        isActive: true,
      })
      .returning();

    return { success: true, data: material };
  } catch (error) {
    console.error("Failed to create material:", error);
    return { success: false, error };
  }
}

export async function updateMaterial(
  id: string,
  data: Partial<{
    name: string;
    specification: string;
    unit: string;
    safetyStock: string;
    maxStock: string;
    purchasePrice: string;
    isActive: boolean;
  }>
) {
  try {
    if (!(await hasPermission(PERMISSIONS.PRODUCTS_UPDATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const [material] = await db
      .update(materials)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(materials.id, id))
      .returning();

    return { success: true, data: material };
  } catch (error) {
    console.error("Failed to update material:", error);
    return { success: false, error };
  }
}

// ============================================================
// BOM 管理
// ============================================================

export async function getBom(skuId: string) {
  try {
    const [bom] = await db
      .select()
      .from(boms)
      .where(and(eq(boms.skuId, skuId), eq(boms.isActive, true)))
      .limit(1);

    if (!bom) {
      return { success: false, error: "BOM not found" };
    }

    const items = await db
      .select({
        item: bomItems,
        material: materials,
      })
      .from(bomItems)
      .leftJoin(materials, eq(bomItems.materialId, materials.id))
      .where(eq(bomItems.bomId, bom.id))
      .orderBy(asc(bomItems.sortOrder));

    return { success: true, data: { ...bom, items } };
  } catch (error) {
    console.error("Failed to get BOM:", error);
    return { success: false, error };
  }
}

export async function createBom(data: {
  skuId: string;
  version?: string;
  items: Array<{
    materialId: string;
    quantity: string;
    unit: string;
    lossRate?: string;
    sortOrder?: number;
    remark?: string;
  }>;
}) {
  try {
    if (!(await hasPermission(PERMISSIONS.PRODUCTS_CREATE))) {
      return { success: false, error: "Unauthorized" };
    }

    // 创建 BOM
    const [bom] = await db
      .insert(boms)
      .values({
        skuId: data.skuId,
        version: data.version || "V1.0",
        isActive: true,
      })
      .returning();

    // 创建 BOM 明细
    if (data.items.length > 0) {
      await db.insert(bomItems).values(
        data.items.map((item) => ({
          bomId: bom.id,
          materialId: item.materialId,
          quantity: item.quantity,
          unit: item.unit,
          lossRate: item.lossRate || "0",
          sortOrder: item.sortOrder || 0,
          remark: item.remark,
        }))
      );
    }

    // 更新 SKU 的 BOM 关联
    await db
      .update(productSkus)
      .set({ bomId: bom.id })
      .where(eq(productSkus.id, data.skuId));

    return { success: true, data: bom };
  } catch (error) {
    console.error("Failed to create BOM:", error);
    return { success: false, error };
  }
}

// ============================================================
// 经销商价格管理
// ============================================================

export async function getDealerSkuPrices(skuId: string) {
  try {
    const prices = await db
      .select()
      .from(dealerSkuPrices)
      .where(eq(dealerSkuPrices.skuId, skuId))
      .orderBy(asc(dealerSkuPrices.priceTier));

    return { success: true, data: prices };
  } catch (error) {
    console.error("Failed to get dealer SKU prices:", error);
    return { success: false, error };
  }
}

export async function setDealerSkuPrice(data: {
  skuId: string;
  priceTier: "A" | "B" | "C" | "D" | "E";
  discountRate?: string;
  finalPrice: string;
  effectiveDate: string;
}) {
  try {
    if (!(await hasPermission(PERMISSIONS.PRODUCTS_UPDATE))) {
      return { success: false, error: "Unauthorized" };
    }

    // 检查是否已存在
    const existing = await db
      .select()
      .from(dealerSkuPrices)
      .where(
        and(
          eq(dealerSkuPrices.skuId, data.skuId),
          eq(dealerSkuPrices.priceTier, data.priceTier)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // 更新
      const [price] = await db
        .update(dealerSkuPrices)
        .set({
          discountRate: data.discountRate || "100.00",
          finalPrice: data.finalPrice,
          effectiveDate: data.effectiveDate,
          updatedAt: new Date(),
        })
        .where(eq(dealerSkuPrices.id, existing[0].id))
        .returning();
      return { success: true, data: price };
    } else {
      // 创建
      const [price] = await db
        .insert(dealerSkuPrices)
        .values({
          ...data,
          discountRate: data.discountRate || "100.00",
          isActive: true,
        })
        .returning();
      return { success: true, data: price };
    }
  } catch (error) {
    console.error("Failed to set dealer SKU price:", error);
    return { success: false, error };
  }
}

// ============================================================
// 生产工序管理
// ============================================================

export async function getProductionProcesses() {
  try {
    const processes = await db
      .select()
      .from(productionProcesses)
      .where(eq(productionProcesses.isActive, true))
      .orderBy(asc(productionProcesses.sequence));

    return { success: true, data: processes };
  } catch (error) {
    console.error("Failed to get production processes:", error);
    return { success: false, error };
  }
}

export async function createProductionProcess(data: {
  code: string;
  name: string;
  sequence: number;
  description?: string;
  qcRequired?: boolean;
  qcPoints?: string;
  standardTime?: number;
}) {
  try {
    if (!(await hasPermission(PERMISSIONS.PRODUCTS_CREATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const [process] = await db
      .insert(productionProcesses)
      .values({
        ...data,
        isActive: true,
      })
      .returning();

    return { success: true, data: process };
  } catch (error) {
    console.error("Failed to create production process:", error);
    return { success: false, error };
  }
}

// ============================================================
// 产品工艺路线管理
// ============================================================

export async function getProductRouting(skuId: string) {
  try {
    const routing = await db
      .select({
        routing: productRoutings,
        process: productionProcesses,
      })
      .from(productRoutings)
      .leftJoin(productionProcesses, eq(productRoutings.processId, productionProcesses.id))
      .where(eq(productRoutings.skuId, skuId))
      .orderBy(asc(productRoutings.sequence));

    return { success: true, data: routing };
  } catch (error) {
    console.error("Failed to get product routing:", error);
    return { success: false, error };
  }
}

export async function setProductRouting(
  skuId: string,
  processIds: string[]
) {
  try {
    if (!(await hasPermission(PERMISSIONS.PRODUCTS_UPDATE))) {
      return { success: false, error: "Unauthorized" };
    }

    // 删除现有工艺路线
    await db
      .delete(productRoutings)
      .where(eq(productRoutings.skuId, skuId));

    // 创建新工艺路线
    if (processIds.length > 0) {
      await db.insert(productRoutings).values(
        processIds.map((processId, index) => ({
          skuId,
          processId,
          sequence: index + 1,
        }))
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to set product routing:", error);
    return { success: false, error };
  }
}

// ============================================================
// 初始化数据
// ============================================================

export async function initializeProductData() {
  try {
    // 检查是否已有数据
    const existingCategories = await db.select().from(productCategories).limit(1);
    if (existingCategories.length > 0) {
      return { success: true, message: "Product data already initialized" };
    }

    // 1. 创建产品分类
    const categories = [
      { code: "MR_COMMERCIAL", name: "商用功能管", version: "C" as const, series: "MR" as const },
      { code: "OL_COMMERCIAL", name: "商用六通", version: "C" as const, series: "OL" as const },
      { code: "MR_HOME", name: "家用功能管", version: "H" as const, series: "MR" as const },
      { code: "OL_HOME", name: "家用六通", version: "H" as const, series: "OL" as const },
    ];

    for (const cat of categories) {
      await db.insert(productCategories).values({
        ...cat,
        description: `${cat.name}系列`,
        isActive: true,
      });
    }

    // 2. 创建表面处理
    const surfaceTreatmentData = [
      { processCode: "A" as const, colorCode: "SV", colorName: "太空银", priceAdder: "0", type: "anodize" as const },
      { processCode: "A" as const, colorCode: "GY", colorName: "太空灰", priceAdder: "0", type: "anodize" as const },
      { processCode: "A" as const, colorCode: "BK", colorName: "太空黑", priceAdder: "0", type: "anodize" as const },
      { processCode: "P" as const, colorCode: "RAL9003", colorName: "信号白", priceAdder: "5", type: "powder" as const },
    ];

    for (const st of surfaceTreatmentData) {
      await db.insert(surfaceTreatments).values({
        code: `${st.processCode}-${st.colorCode}`,
        name: st.colorName,
        type: st.type,
        colorCode: st.colorCode,
        priceAdder: st.priceAdder,
        isActive: true,
      });
    }

    // 3. 创建预加工选项
    const preprocessingData = [
      { type: "cut_mm" as const, code: "L-600MM", name: "截断600mm", processingFee: "2", lengthValue: 600, lengthUnit: "MM" },
      { type: "drill" as const, code: "D", name: "钻销子孔", processingFee: "1.5" },
      { type: "embed" as const, code: "E", name: "预埋连接件", processingFee: "3" },
    ];

    for (const po of preprocessingData) {
      await db.insert(preprocessingOptions).values({
        ...po,
        isActive: true,
      });
    }

    return { success: true, message: "Product data initialized successfully" };
  } catch (error) {
    console.error("Failed to initialize product data:", error);
    return { success: false, error };
  }
}
