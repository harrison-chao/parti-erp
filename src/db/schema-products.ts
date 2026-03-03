import {
  pgTable,
  text,
  varchar,
  timestamp,
  decimal,
  integer,
  boolean,
  pgEnum,
  uuid,
  date,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// PRD V2.0 新增：产品主数据相关表
// ============================================================

// 产品版本：商用(C) / 家用(H)
export const productVersionEnum = pgEnum("product_version", ["C", "H"]);

// 产品系列
export const productSeriesEnum = pgEnum("product_series", [
  "MR", // 功能管
  "OL", // 六通
  "Q",  // 方管
  "R",  // 弧管
  "LY", // 层板托
  "PTB", // 塑料三角扣
  "SSTB", // 不锈钢三角扣
  "CASTER", // 脚轮
  "ADJUST", // 调节脚
]);

// 表面处理工艺
export const surfaceProcessEnum = pgEnum("surface_process", [
  "A", // 硬质阳极氧化
  "P", // 静电喷粉
  "W", // 水性漆喷涂
  "T", // 热转印
]);

// 预加工工艺
export const preprocessingTypeEnum = pgEnum("preprocessing_type", [
  "cut_inch",    // 截断（英寸）
  "cut_mm",      // 截断（毫米）
  "drill",       // 钻孔
  "embed",       // 预埋连接件
]);

// 物料类型（更详细的分类）
export const materialCategoryEnum = pgEnum("material_category", [
  "aluminum_profile", // 铝型材母料
  "connector",        // 连接件配件
  "hardware",         // 五金配件
  "chemical",         // 表面处理化学品
  "packaging",        // 包材
]);

// ============================================================
// 产品分类表
// ============================================================
export const productCategories = pgTable("product_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(), // 分类编码
  name: varchar("name", { length: 50 }).notNull(), // 分类名称
  version: productVersionEnum("version").notNull(), // C=商用, H=家用
  series: productSeriesEnum("series").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// 产品规格表（基础型号）
// ============================================================
export const productSpecs = pgTable("product_specs", {
  id: uuid("id").primaryKey().defaultRandom(),
  specCode: varchar("spec_code", { length: 20 }).notNull().unique(), // 如：2525-8, 1616
  categoryId: uuid("category_id").notNull().references(() => productCategories.id),
  name: varchar("name", { length: 100 }).notNull(), // 如：25×25功能管-8mm槽
  description: text("description"),
  // 尺寸参数
  width: decimal("width", { precision: 10, scale: 2 }), // 截面宽度(mm)
  height: decimal("height", { precision: 10, scale: 2 }), // 截面高度(mm)
  slotWidth: decimal("slot_width", { precision: 10, scale: 2 }), // 槽宽(mm)
  standardLength: integer("standard_length").default(4000), // 标准长度(mm)
  weightPerMeter: decimal("weight_per_meter", { precision: 10, scale: 3 }), // 每米重量(kg)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// 表面处理选项表
// ============================================================
export const surfaceTreatments = pgTable("surface_treatments", {
  id: uuid("id").primaryKey().defaultRandom(),
  processCode: surfaceProcessEnum("process_code").notNull(), // A, P, W, T
  colorCode: varchar("color_code", { length: 20 }).notNull(), // SV, GY, RAL9003, etc.
  colorName: varchar("color_name", { length: 50 }).notNull(), // 太空银, 太空灰
  fullCode: varchar("full_code", { length: 30 }).notNull().unique(), // A-SV, P-RAL9003
  description: text("description"),
  additionalCost: decimal("additional_cost", { precision: 10, scale: 2 }).default("0"), // 额外成本
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// 预加工选项表
// ============================================================
export const preprocessingOptions = pgTable("preprocessing_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: preprocessingTypeEnum("type").notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(), // L-24IN, L-600MM, D, E
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
  // 费用
  processingFee: decimal("processing_fee", { precision: 10, scale: 2 }).default("0"),
  // 参数
  lengthValue: integer("length_value"), // 长度值（用于截断）
  lengthUnit: varchar("length_unit", { length: 10 }), // IN, MM
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// 产品SKU表（完整产品）
// ============================================================
export const productSkus = pgTable("product_skus", {
  id: uuid("id").primaryKey().defaultRandom(),
  sku: varchar("sku", { length: 100 }).notNull().unique(), // 完整SKU编码
  // 基础信息
  categoryId: uuid("category_id").notNull().references(() => productCategories.id),
  specId: uuid("spec_id").notNull().references(() => productSpecs.id),
  surfaceTreatmentId: uuid("surface_treatment_id").references(() => surfaceTreatments.id),
  // SKU组成
  versionCode: varchar("version_code", { length: 5 }).notNull(), // C, H
  seriesCode: varchar("series_code", { length: 10 }).notNull(), // MR, OL, etc.
  specCode: varchar("spec_code", { length: 20 }).notNull(),
  surfaceCode: varchar("surface_code", { length: 30 }), // A-SV
  preprocessingChain: varchar("preprocessing_chain", { length: 100 }), // L600MM-DE
  // 产品信息
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  // 定价（基础零售价）
  basePrice: decimal("base_price", { precision: 12, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }).default("根"), // 根, 套, 件
  // 状态
  isCustomizable: boolean("is_customizable").default(true), // 是否支持定制
  isActive: boolean("is_active").notNull().default(true),
  // BOM关联
  bomId: uuid("bom_id"), // 关联BOM表
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_sku_category").on(table.categoryId),
  index("idx_sku_active").on(table.isActive),
]);

// ============================================================
// SKU与预加工选项关联表（多对多）
// ============================================================
export const skuPreprocessing = pgTable("sku_preprocessing", {
  id: uuid("id").primaryKey().defaultRandom(),
  skuId: uuid("sku_id").notNull().references(() => productSkus.id),
  preprocessingId: uuid("preprocessing_id").notNull().references(() => preprocessingOptions.id),
  isDefault: boolean("is_default").default(false),
  additionalPrice: decimal("additional_price", { precision: 10, scale: 2 }).default("0"),
});

// ============================================================
// 物料主数据表（原材料）
// ============================================================
export const materials = pgTable("materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  materialCode: varchar("material_code", { length: 30 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  category: materialCategoryEnum("category").notNull(),
  // 规格
  specification: varchar("specification", { length: 100 }), // 规格描述
  material: varchar("material", { length: 50 }), // 材质，如：6063T6
  // 库存管理
  unit: varchar("unit", { length: 20 }).notNull(), // 支, 个, kg
  safetyStock: decimal("safety_stock", { precision: 10, scale: 2 }).default("0"),
  maxStock: decimal("max_stock", { precision: 10, scale: 2 }).default("0"),
  // 采购信息
  defaultSupplierId: uuid("default_supplier_id"),
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }),
  // 状态
  isActive: boolean("is_active").notNull().default(true),
  remark: text("remark"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// BOM（物料清单）表
// ============================================================
export const boms = pgTable("boms", {
  id: uuid("id").primaryKey().defaultRandom(),
  skuId: uuid("sku_id").notNull().references(() => productSkus.id),
  version: varchar("version", { length: 10 }).default("V1.0"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// BOM明细表
// ============================================================
export const bomItems = pgTable("bom_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  bomId: uuid("bom_id").notNull().references(() => boms.id),
  materialId: uuid("material_id").notNull().references(() => materials.id),
  // 用量
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  // 损耗率
  lossRate: decimal("loss_rate", { precision: 5, scale: 2 }).default("0"), // 损耗率%
  // 排序
  sortOrder: integer("sort_order").default(0),
  remark: text("remark"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================
// 经销商价格表（各等级对应SKU的价格）
// ============================================================
export const dealerSkuPrices = pgTable("dealer_sku_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  skuId: uuid("sku_id").notNull().references(() => productSkus.id),
  priceTier: varchar("price_tier", { length: 5 }).notNull(), // A, B, C
  discountRate: decimal("discount_rate", { precision: 5, scale: 2 }).default("100.00"), // 折扣率%
  finalPrice: decimal("final_price", { precision: 12, scale: 2 }).notNull(), // 最终价格
  isActive: boolean("is_active").notNull().default(true),
  effectiveDate: date("effective_date").notNull(),
  expiryDate: date("expiry_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_dealer_price_sku_tier").on(table.skuId, table.priceTier),
]);

// ============================================================
// 生产工序定义表
// ============================================================
export const productionProcesses = pgTable("production_processes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 50 }).notNull(),
  sequence: integer("sequence").notNull(), // 工序顺序
  description: text("description"),
  // 质量控制
  qcRequired: boolean("qc_required").default(false),
  qcPoints: text("qc_points"), // 质量控制要点
  // 标准工时(分钟)
  standardTime: integer("standard_time"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// 产品工艺路线表（SKU与工序的关联）
// ============================================================
export const productRoutings = pgTable("product_routings", {
  id: uuid("id").primaryKey().defaultRandom(),
  skuId: uuid("sku_id").notNull().references(() => productSkus.id),
  processId: uuid("process_id").notNull().references(() => productionProcesses.id),
  sequence: integer("sequence").notNull(),
  isRequired: boolean("is_required").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================
// Relations
// ============================================================

export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  specs: many(productSpecs),
  skus: many(productSkus),
}));

export const productSpecsRelations = relations(productSpecs, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [productSpecs.categoryId],
    references: [productCategories.id],
  }),
  skus: many(productSkus),
}));

export const productSkusRelations = relations(productSkus, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [productSkus.categoryId],
    references: [productCategories.id],
  }),
  spec: one(productSpecs, {
    fields: [productSkus.specId],
    references: [productSpecs.id],
  }),
  surfaceTreatment: one(surfaceTreatments, {
    fields: [productSkus.surfaceTreatmentId],
    references: [surfaceTreatments.id],
  }),
  preprocessings: many(skuPreprocessing),
  boms: many(boms),
  prices: many(dealerSkuPrices),
}));

export const bomsRelations = relations(boms, ({ one, many }) => ({
  sku: one(productSkus, {
    fields: [boms.skuId],
    references: [productSkus.id],
  }),
  items: many(bomItems),
}));

export const bomItemsRelations = relations(bomItems, ({ one }) => ({
  bom: one(boms, {
    fields: [bomItems.bomId],
    references: [boms.id],
  }),
  material: one(materials, {
    fields: [bomItems.materialId],
    references: [materials.id],
  }),
}));
