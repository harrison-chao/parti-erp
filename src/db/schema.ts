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
  serial,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// ENUMS
// ============================================================

// User Roles
export const userRoleEnum = pgEnum("user_role", [
  "admin",        // 超级管理员
  "manager",      // 部门经理
  "operator",     // 运营人员
  "purchaser",    // 采购员
  "warehouse",    // 仓管
  "finance",      // 财务
  "factory",      // 工厂人员
]);

// Dealer
export const priceTierEnum = pgEnum("price_tier", ["A", "B", "C"]);
export const settlementMethodEnum = pgEnum("settlement_method", [
  "prepaid",
  "deposit",
  "credit",
]);
export const dealerApplicationStatusEnum = pgEnum("dealer_application_status", [
  "pending",
  "reviewing",
  "approved",
  "rejected",
]);

// Sales Order
export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "partial",
  "paid",
  "credit",
]);
export const soStatusEnum = pgEnum("so_status", [
  "pending",
  "confirmed",
  "producing",
  "ready",
  "shipped",
  "completed",
  "cancelled",
]);

// Production / Work Order
export const woStatusEnum = pgEnum("wo_status", [
  "pending_confirm",
  "scheduled",
  "cutting",
  "drilling",
  "surface_treat",
  "assembling",
  "qc",
  "finished",
  "cancelled",
]);

// Purchase Requisition
export const prTypeEnum = pgEnum("pr_type", [
  "safety_stock",
  "mrp",
  "manual",
]);
export const prStatusEnum = pgEnum("pr_status", [
  "draft",
  "pending",
  "approved",
  "rejected",
  "converted",
]);

// Purchase Order
export const poStatusEnum = pgEnum("po_status", [
  "draft",
  "sent",
  "confirmed",
  "partial_received",
  "fully_received",
  "closed",
]);
export const poPaymentTermsEnum = pgEnum("po_payment_terms", [
  "prepaid",
  "on_delivery",
  "monthly",
]);

// Goods Receipt
export const grTypeEnum = pgEnum("gr_type", [
  "purchase",
  "return",
  "transfer",
  "wo_finish",
]);
export const qcResultEnum = pgEnum("qc_result", [
  "pass",
  "reject",
  "inspect",
]);
export const putawayStatusEnum = pgEnum("putaway_status", [
  "pending",
  "putaway",
  "completed",
]);

// Inventory
export const materialTypeEnum = pgEnum("material_type", [
  "raw",
  "semi_finished",
  "finished",
  "packaging",
]);
export const inventoryTxTypeEnum = pgEnum("inventory_tx_type", [
  "sales_out",
  "purchase_in",
  "production_issue",
  "production_receipt",
  "adjustment",
  "transfer",
  "return_in",
]);

// Workflow
export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
]);

// System Config
export const configTypeEnum = pgEnum("config_type", [
  "string",
  "number",
  "boolean",
  "json",
]);

// ============================================================
// RBAC - 权限管理系统
// ============================================================

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  permissions: jsonb("permissions").notNull().default("[]"), // ["dealers:read", "orders:write"]
  isSystem: boolean("is_system").notNull().default(false), // 系统内置角色不可删除
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 100 }).notNull().unique(), // "dealers:create"
  name: varchar("name", { length: 100 }).notNull(), // "创建经销商"
  module: varchar("module", { length: 50 }).notNull(), // "dealers", "orders", "inventory"
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================
// USERS (for auth)
// ============================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("operator"),
  roleId: uuid("role_id").references(() => roles.id),
  avatar: varchar("avatar", { length: 500 }),
  phone: varchar("phone", { length: 30 }),
  department: varchar("department", { length: 50 }), // 所属部门
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================
// DEALER APPLICATIONS (经销商申请注册)
// ============================================================

export const dealerApplications = pgTable(
  "dealer_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // 公司信息
    companyName: varchar("company_name", { length: 200 }).notNull(),
    businessLicense: varchar("business_license", { length: 100 }), // 营业执照号
    // 联系人信息
    contactName: varchar("contact_name", { length: 100 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 30 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }).notNull(),
    contactPosition: varchar("contact_position", { length: 50 }), // 职位
    // 申请信息
    priceTierRequested: priceTierEnum("price_tier_requested").default("C"),
    settlementMethodRequested: settlementMethodEnum("settlement_method_requested").default("prepaid"),
    expectedMonthlyVolume: varchar("expected_monthly_volume", { length: 50 }), // 预期月采购量
    mainBusiness: text("main_business"), // 主营业务描述
    referralSource: varchar("referral_source", { length: 100 }), // 从哪里了解到Parti
    // 状态
    status: dealerApplicationStatusEnum("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    reviewNotes: text("review_notes"),
    // 关联
    dealerId: uuid("dealer_id").references(() => dealers.id), // 审批通过后关联的经销商
    // 时间戳
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_dealer_app_status").on(table.status),
    index("idx_dealer_app_email").on(table.contactEmail),
  ]
);

// ============================================================
// DEALERS (经销商)
// ============================================================

export const dealers = pgTable(
  "dealers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dealerId: varchar("dealer_id", { length: 20 }).notNull().unique(), // PARTI-D-XXXX
    companyName: varchar("company_name", { length: 200 }).notNull(),
    businessLicense: varchar("business_license", { length: 100 }),
    contactPerson: varchar("contact_person", { length: 100 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 30 }),
    contactEmail: varchar("contact_email", { length: 255 }),
    contactPosition: varchar("contact_position", { length: 50 }),
    priceTier: priceTierEnum("price_tier").notNull().default("C"),
    creditLimit: decimal("credit_limit", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    creditBalance: decimal("credit_balance", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    settlementMethod: settlementMethodEnum("settlement_method")
      .notNull()
      .default("prepaid"),
    isActive: boolean("is_active").notNull().default(true),
    notes: text("notes"),
    // 统计字段
    totalOrders: integer("total_orders").default(0),
    totalAmount: decimal("total_amount", { precision: 14, scale: 2 }).default("0"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("idx_dealer_id").on(table.dealerId)]
);

export const dealerAddresses = pgTable("dealer_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealerId: uuid("dealer_id")
    .notNull()
    .references(() => dealers.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 50 }).notNull(), // '办公地址' / '仓库地址'
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 30 }).notNull(),
  province: varchar("province", { length: 50 }),
  city: varchar("city", { length: 50 }),
  district: varchar("district", { length: 50 }),
  address: text("address").notNull(),
  zipCode: varchar("zip_code", { length: 20 }),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================
// PRODUCTS (产品主数据)
// ============================================================

export const productTemplates = pgTable("product_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  baseModel: varchar("base_model", { length: 30 }).notNull().unique(), // C-MR-2525-8
  name: varchar("name", { length: 200 }).notNull(),
  series: varchar("series", { length: 10 }).notNull(), // C / H
  category: varchar("category", { length: 30 }).notNull(), // 铝管功能款 / 六通标准款 etc.
  specification: varchar("specification", { length: 50 }), // 25×25
  materialType: materialTypeEnum("material_type").notNull().default("finished"),
  unit: varchar("unit", { length: 10 }).notNull().default("pcs"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  weight: decimal("weight", { precision: 8, scale: 3 }), // kg
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const surfaceTreatments = pgTable("surface_treatments", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(), // A-SV, P-RAL9003
  name: varchar("name", { length: 100 }).notNull(), // 太空银
  type: varchar("type", { length: 30 }).notNull(), // anodize / powder / paint / transfer
  colorCode: varchar("color_code", { length: 30 }),
  priceAdder: decimal("price_adder", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  isActive: boolean("is_active").notNull().default(true),
});

export const preprocessOps = pgTable("preprocess_ops", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(), // L-600MM, D, E
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 30 }).notNull(), // cut_inch / cut_mm / drill / embed
  priceAdder: decimal("price_adder", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  isActive: boolean("is_active").notNull().default(true),
});

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sku: varchar("sku", { length: 80 }).notNull().unique(), // Full SKU
    templateId: uuid("template_id")
      .notNull()
      .references(() => productTemplates.id),
    surfaceTreatmentId: uuid("surface_treatment_id").references(
      () => surfaceTreatments.id
    ),
    preprocessChain: jsonb("preprocess_chain"), // Array of preprocess op IDs
    materialType: materialTypeEnum("material_type")
      .notNull()
      .default("finished"),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("idx_variant_sku").on(table.sku)]
);

// Raw materials (原料)
export const materials = pgTable("materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  materialType: materialTypeEnum("material_type").notNull(),
  specification: varchar("specification", { length: 100 }),
  unit: varchar("unit", { length: 10 }).notNull().default("pcs"),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// BOM - 物料清单
// ============================================================

export const billOfMaterials = pgTable(
  "bill_of_materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("idx_bom_variant_version").on(table.variantId, table.version),
  ]
);

export const bomItems = pgTable("bom_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  bomId: uuid("bom_id")
    .notNull()
    .references(() => billOfMaterials.id, { onDelete: "cascade" }),
  materialId: uuid("material_id")
    .notNull()
    .references(() => materials.id),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(), // 单个产品所需数量
  unit: varchar("unit", { length: 10 }).notNull(),
  wastageRate: decimal("wastage_rate", { precision: 5, scale: 2 }).default("0"), // 损耗率
  notes: text("notes"),
  sortOrder: integer("sort_order").default(0),
});

// ============================================================
// SUPPLIERS (供应商)
// ============================================================

export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  supplierId: varchar("supplier_id", { length: 20 }).notNull().unique(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  contactPerson: varchar("contact_person", { length: 100 }),
  contactPhone: varchar("contact_phone", { length: 30 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  paymentTerms: poPaymentTermsEnum("payment_terms").default("on_delivery"),
  leadTimeDays: integer("lead_time_days").default(7),
  taxId: varchar("tax_id", { length: 50 }), // 税号
  bankName: varchar("bank_name", { length: 100 }),
  bankAccount: varchar("bank_account", { length: 50 }),
  address: text("address"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 供应商-物料关联 (供应商可以供应哪些物料)
export const supplierMaterials = pgTable(
  "supplier_materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
    moq: integer("moq").default(1), // 最小订购量
    leadTimeDays: integer("lead_time_days"),
    isPreferred: boolean("is_preferred").default(false), // 首选供应商
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("idx_supplier_material").on(table.supplierId, table.materialId),
  ]
);

// ============================================================
// SALES ORDERS (销售订单)
// ============================================================

export const salesOrders = pgTable(
  "sales_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNo: varchar("order_no", { length: 30 }).notNull().unique(), // SO-YYYYMMDD-XXXX
    dealerId: uuid("dealer_id")
      .notNull()
      .references(() => dealers.id),
    orderDate: date("order_date").notNull(),
    targetDeliveryDate: date("target_delivery_date"),
    actualDeliveryDate: date("actual_delivery_date"),
    orderedBy: varchar("ordered_by", { length: 100 }), // dealer account
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("unpaid"),
    status: soStatusEnum("status").notNull().default("pending"),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    paidAmount: decimal("paid_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
    trackingNo: varchar("tracking_no", { length: 100 }),
    shippingName: varchar("shipping_name", { length: 100 }),
    shippingPhone: varchar("shipping_phone", { length: 30 }),
    shippingAddress: text("shipping_address"),
    shippingProvince: varchar("shipping_province", { length: 50 }),
    shippingCity: varchar("shipping_city", { length: 50 }),
    notes: text("notes"),
    // 智能预测字段
    estimatedCompletionDate: date("estimated_completion_date"), // AI预测完成日期
    confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }), // 预测置信度
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_so_dealer").on(table.dealerId),
    index("idx_so_status").on(table.status),
    index("idx_so_order_date").on(table.orderDate),
  ]
);

export const salesOrderItems = pgTable("sales_order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  salesOrderId: uuid("sales_order_id")
    .notNull()
    .references(() => salesOrders.id, { onDelete: "cascade" }),
  lineNo: integer("line_no").notNull(),
  variantId: uuid("variant_id").references(() => productVariants.id),
  sku: varchar("sku", { length: 80 }).notNull(),
  productName: varchar("product_name", { length: 200 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  lineAmount: decimal("line_amount", { precision: 12, scale: 2 }).notNull(),
  workOrderNo: varchar("work_order_no", { length: 30 }), // linked WO
  notes: text("notes"),
});

// ============================================================
// PRODUCTION / WORK ORDERS (生产委托单)
// ============================================================

export const productionOrders = pgTable(
  "production_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workOrderNo: varchar("work_order_no", { length: 30 }).notNull().unique(), // WO-YYYYMMDD-XXXX-NN
    salesOrderId: uuid("sales_order_id").references(() => salesOrders.id),
    salesOrderItemId: uuid("sales_order_item_id").references(() => salesOrderItems.id),
    variantId: uuid("variant_id").references(() => productVariants.id),
    sku: varchar("sku", { length: 80 }).notNull(),
    productName: varchar("product_name", { length: 200 }).notNull(),
    quantity: integer("quantity").notNull(),
    confirmedBy: uuid("confirmed_by").references(() => users.id),
    confirmedAt: timestamp("confirmed_at"),
    status: woStatusEnum("status").notNull().default("pending_confirm"),
    estCompletionDate: date("est_completion_date"),
    actCompletionDate: date("act_completion_date"),
    rawLotNo: varchar("raw_lot_no", { length: 50 }),
    issueNoteNo: varchar("issue_note_no", { length: 30 }), // 领料单号
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_wo_status").on(table.status),
    index("idx_wo_so").on(table.salesOrderId),
  ]
);

// WO process steps log (工序报工)
export const woProcessLogs = pgTable("wo_process_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workOrderId: uuid("work_order_id")
    .notNull()
    .references(() => productionOrders.id, { onDelete: "cascade" }),
  step: varchar("step", { length: 30 }).notNull(), // cutting, drilling, surface_treat, assembling, qc
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  operatorId: uuid("operator_id").references(() => users.id),
  result: varchar("result", { length: 20 }), // pass / fail / rework
  remark: text("remark"),
});

// ============================================================
// PURCHASE REQUISITIONS (采购申请)
// ============================================================

export const purchaseRequisitions = pgTable(
  "purchase_requisitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    prNo: varchar("pr_no", { length: 30 }).notNull().unique(), // PR-YYYYMMDD-XXXX
    prType: prTypeEnum("pr_type").notNull().default("manual"),
    requestedBy: uuid("requested_by")
      .notNull()
      .references(() => users.id),
    requestDate: date("request_date").notNull(),
    requiredDate: date("required_date"),
    status: prStatusEnum("status").notNull().default("draft"),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    relatedWoNo: varchar("related_wo_no", { length: 30 }), // if MRP triggered
    relatedSoNo: varchar("related_so_no", { length: 30 }), // for urgent reference
    mrpRunId: uuid("mrp_run_id"), // MRP运行批次ID
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_pr_status").on(table.status),
    index("idx_pr_type").on(table.prType),
  ]
);

export const prItems = pgTable("pr_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  prId: uuid("pr_id")
    .notNull()
    .references(() => purchaseRequisitions.id, { onDelete: "cascade" }),
  lineNo: integer("line_no").notNull(),
  materialId: uuid("material_id").references(() => materials.id),
  materialCode: varchar("material_code", { length: 50 }).notNull(),
  materialName: varchar("material_name", { length: 200 }).notNull(),
  specification: varchar("specification", { length: 100 }),
  requiredQty: integer("required_qty").notNull(),
  currentStock: integer("current_stock").default(0),
  inTransitQty: integer("in_transit_qty").default(0),
  suggestedQty: integer("suggested_qty").notNull(),
  purpose: text("purpose"), // which WO or general
  suggestedSupplierId: uuid("suggested_supplier_id").references(
    () => suppliers.id
  ),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  lineAmount: decimal("line_amount", { precision: 12, scale: 2 }),
});

// ============================================================
// PURCHASE ORDERS (采购订单)
// ============================================================

export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    poNo: varchar("po_no", { length: 30 }).notNull().unique(), // PO-YYYYMMDD-XXXX
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    purchaseDate: date("purchase_date").notNull(),
    deliveryDate: date("delivery_date"),
    paymentTerms: poPaymentTermsEnum("payment_terms").default("on_delivery"),
    status: poStatusEnum("status").notNull().default("draft"),
    purchaserId: uuid("purchaser_id").references(() => users.id),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at"),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    paidAmount: decimal("paid_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("13"), // 税率
    taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
    totalWithTax: decimal("total_with_tax", { precision: 12, scale: 2 }).default("0"),
    currency: varchar("currency", { length: 3 }).default("CNY"),
    exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }).default("1"),
    notes: text("notes"),
    terms: text("terms"), // 采购条款
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_po_supplier").on(table.supplierId),
    index("idx_po_status").on(table.status),
  ]
);

export const poItems = pgTable("po_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  poId: uuid("po_id")
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: "cascade" }),
  relatedPrId: uuid("related_pr_id").references(() => purchaseRequisitions.id),
  relatedPrNo: varchar("related_pr_no", { length: 30 }),
  materialId: uuid("material_id").references(() => materials.id),
  materialCode: varchar("material_code", { length: 50 }).notNull(),
  materialName: varchar("material_name", { length: 200 }),
  specification: varchar("specification", { length: 100 }),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("13"),
  lineAmount: decimal("line_amount", { precision: 12, scale: 2 }).notNull(),
  lineTaxAmount: decimal("line_tax_amount", { precision: 12, scale: 2 }).default("0"),
  deliveryDate: date("delivery_date"),
  receivedQty: integer("received_qty").notNull().default(0),
  pendingQty: integer("pending_qty").notNull().default(0),
  batchNo: varchar("batch_no", { length: 50 }), // 收货批次号
  notes: text("notes"),
});

// ============================================================
// GOODS RECEIPTS (入库单) with Batch Tracking
// ============================================================

export const goodsReceipts = pgTable(
  "goods_receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    grNo: varchar("gr_no", { length: 30 }).notNull().unique(), // GR-YYYYMMDD-XXXX
    grType: grTypeEnum("gr_type").notNull(),
    relatedDocNo: varchar("related_doc_no", { length: 30 }), // PO / WO / transfer doc
    relatedDocId: uuid("related_doc_id"), // 关联单据ID
    supplierId: uuid("supplier_id").references(() => suppliers.id),
    receiptDate: date("receipt_date").notNull(),
    warehouseId: uuid("warehouse_id").references(() => warehouses.id),
    receivedBy: uuid("received_by").references(() => users.id),
    qcResult: qcResultEnum("qc_result").default("inspect"),
    qcRemark: text("qc_remark"),
    putawayStatus: putawayStatusEnum("putaway_status").default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_gr_type").on(table.grType),
    index("idx_gr_date").on(table.receiptDate),
  ]
);

export const grItems = pgTable("gr_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  grId: uuid("gr_id")
    .notNull()
    .references(() => goodsReceipts.id, { onDelete: "cascade" }),
  materialId: uuid("material_id").references(() => materials.id),
  variantId: uuid("variant_id").references(() => productVariants.id),
  materialCode: varchar("material_code", { length: 50 }).notNull(),
  batchNo: varchar("batch_no", { length: 50 }), // LOT-supplier-date-seq
  quantity: integer("quantity").notNull(),
  unit: varchar("unit", { length: 10 }).notNull().default("pcs"),
  packagingSpec: varchar("packaging_spec", { length: 50 }),
  productionDate: date("production_date"),
  expiryDate: date("expiry_date"),
  // QC 详细信息
  qcPassedQty: integer("qc_passed_qty").default(0),
  qcRejectedQty: integer("qc_rejected_qty").default(0),
  qcRemark: text("qc_remark"),
});

// ============================================================
// WAREHOUSES & INVENTORY (库存)
// ============================================================

export const warehouses = pgTable("warehouses", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 30 }).notNull().default("general"), // raw, finished, general
  address: text("address"),
  managerId: uuid("manager_id").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
});

export const warehouseLocations = pgTable("warehouse_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  code: varchar("code", { length: 30 }).notNull(), // Shelf-Row-Col
  name: varchar("name", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
});

// Current stock levels (物化视图 - cached)
export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    materialId: uuid("material_id").references(() => materials.id),
    variantId: uuid("variant_id").references(() => productVariants.id),
    itemCode: varchar("item_code", { length: 80 }).notNull(),
    warehouseId: uuid("warehouse_id").references(() => warehouses.id),
    locationId: uuid("location_id").references(() => warehouseLocations.id),
    batchNo: varchar("batch_no", { length: 50 }),
    qtyOnHand: integer("qty_on_hand").notNull().default(0),
    qtyAvailable: integer("qty_available").notNull().default(0),
    qtyReserved: integer("qty_reserved").notNull().default(0),
    qtyInTransit: integer("qty_in_transit").notNull().default(0),
    qtyWip: integer("qty_wip").notNull().default(0),
    safetyStock: integer("safety_stock").default(0),
    maxStock: integer("max_stock"),
    lastCountDate: date("last_count_date"),
    lastMovementDate: date("last_movement_date"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_inv_item").on(table.itemCode),
    index("idx_inv_warehouse").on(table.warehouseId),
    index("idx_inv_batch").on(table.batchNo),
  ]
);

// Inventory transaction log (库存事务日志 - append-only ledger)
export const inventoryTransactions = pgTable(
  "inventory_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    txType: inventoryTxTypeEnum("tx_type").notNull(),
    itemCode: varchar("item_code", { length: 80 }).notNull(),
    materialId: uuid("material_id").references(() => materials.id),
    variantId: uuid("variant_id").references(() => productVariants.id),
    warehouseId: uuid("warehouse_id").references(() => warehouses.id),
    batchNo: varchar("batch_no", { length: 50 }),
    quantity: integer("quantity").notNull(), // positive = in, negative = out
    qtyBefore: integer("qty_before").notNull(),
    qtyAfter: integer("qty_after").notNull(),
    referenceType: varchar("reference_type", { length: 10 }), // SO / WO / PO / GR
    referenceNo: varchar("reference_no", { length: 30 }),
    referenceId: uuid("reference_id"),
    operatorId: uuid("operator_id").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    remark: text("remark"),
  },
  (table) => [
    index("idx_itx_item").on(table.itemCode),
    index("idx_itx_ref").on(table.referenceType, table.referenceNo),
    index("idx_itx_date").on(table.createdAt),
  ]
);

// ============================================================
// BATCH TRACKING - 批次追溯
// ============================================================

export const materialBatches = pgTable(
  "material_batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchNo: varchar("batch_no", { length: 50 }).notNull().unique(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id),
    supplierId: uuid("supplier_id").references(() => suppliers.id),
    grId: uuid("gr_id").references(() => goodsReceipts.id), // 入库单ID
    poId: uuid("po_id").references(() => purchaseOrders.id), // 采购订单ID
    productionDate: date("production_date"),
    expiryDate: date("expiry_date"),
    initialQty: integer("initial_qty").notNull(),
    remainingQty: integer("remaining_qty").notNull(),
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
    warehouseId: uuid("warehouse_id").references(() => warehouses.id),
    locationId: uuid("location_id").references(() => warehouseLocations.id),
    qcStatus: qcResultEnum("qc_status").default("inspect"),
    qcReport: jsonb("qc_report"), // 质检报告
    // 追溯链
    parentBatchId: uuid("parent_batch_id").references((): any => materialBatches.id), // 父批次（调拨拆分）
    traceCode: varchar("trace_code", { length: 100 }), // 追溯码/二维码
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_batch_material").on(table.materialId),
    index("idx_batch_no").on(table.batchNo),
    index("idx_batch_supplier").on(table.supplierId),
  ]
);

// 批次使用记录 - 用于追溯
export const batchUsageLogs = pgTable(
  "batch_usage_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => materialBatches.id),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id),
    usageType: varchar("usage_type", { length: 20 }).notNull(), // production, sales, transfer
    referenceType: varchar("reference_type", { length: 10 }).notNull(), // WO, SO, GR
    referenceNo: varchar("reference_no", { length: 30 }).notNull(),
    referenceId: uuid("reference_id"),
    quantity: integer("quantity").notNull(), // 使用数量
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }), // 当时成本
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_batch_usage_batch").on(table.batchId),
    index("idx_batch_usage_ref").on(table.referenceType, table.referenceNo),
  ]
);

// ============================================================
// MRP - 物料需求计划
// ============================================================

export const mrpRuns = pgTable(
  "mrp_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runNo: varchar("run_no", { length: 30 }).notNull().unique(), // MRP-YYYYMMDD-XXXX
    runDate: timestamp("run_date").notNull().defaultNow(),
    runBy: uuid("run_by").references(() => users.id),
    horizonDays: integer("horizon_days").default(30), // 计划展望期
    status: varchar("status", { length: 20 }).notNull().default("running"), // running, completed, failed
    parameters: jsonb("parameters"), // 运行参数
    results: jsonb("results"), // 运行结果摘要
    createdPrs: integer("created_prs").default(0), // 生成的PR数量
    errorMessage: text("error_message"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_mrp_run_date").on(table.runDate)]
);

// MRP 需求明细
export const mrpDemands = pgTable(
  "mrp_demands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mrpRunId: uuid("mrp_run_id")
      .notNull()
      .references(() => mrpRuns.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id),
    demandDate: date("demand_date").notNull(),
    demandQty: integer("demand_qty").notNull(),
    demandType: varchar("demand_type", { length: 20 }).notNull(), // sales_order, production, safety_stock
    referenceType: varchar("reference_type", { length: 10 }), // SO, WO
    referenceNo: varchar("reference_no", { length: 30 }),
    referenceId: uuid("reference_id"),
  },
  (table) => [
    index("idx_mrp_demand_run").on(table.mrpRunId),
    index("idx_mrp_demand_material").on(table.materialId),
  ]
);

// MRP 供应明细
export const mrpSupplies = pgTable(
  "mrp_supplies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mrpRunId: uuid("mrp_run_id")
      .notNull()
      .references(() => mrpRuns.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id),
    supplyDate: date("supply_date").notNull(),
    supplyQty: integer("supply_qty").notNull(),
    supplyType: varchar("supply_type", { length: 20 }).notNull(), // inventory, po, pr
    referenceType: varchar("reference_type", { length: 10 }), // PO, PR, INV
    referenceNo: varchar("reference_no", { length: 30 }),
    referenceId: uuid("reference_id"),
  },
  (table) => [
    index("idx_mrp_supply_run").on(table.mrpRunId),
    index("idx_mrp_supply_material").on(table.materialId),
  ]
);

// MRP 建议
export const mrpSuggestions = pgTable(
  "mrp_suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mrpRunId: uuid("mrp_run_id")
      .notNull()
      .references(() => mrpRuns.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id),
    suggestionType: varchar("suggestion_type", { length: 20 }).notNull(), // purchase, expedite, cancel
    suggestedQty: integer("suggested_qty").notNull(),
    suggestedDate: date("suggested_date").notNull(),
    reason: text("reason"),
    priority: varchar("priority", { length: 10 }).default("normal"), // high, normal, low
    isConverted: boolean("is_converted").default(false),
    convertedPrId: uuid("converted_pr_id").references(() => purchaseRequisitions.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_mrp_sugg_run").on(table.mrpRunId),
    index("idx_mrp_sugg_material").on(table.materialId),
  ]
);

// ============================================================
// DELIVERY PREDICTION - 交期智能预测
// ============================================================

export const deliveryPredictions = pgTable(
  "delivery_predictions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    salesOrderId: uuid("sales_order_id").references(() => salesOrders.id),
    workOrderId: uuid("work_order_id").references(() => productionOrders.id),
    // 输入特征
    productCategory: varchar("product_category", { length: 30 }),
    sku: varchar("sku", { length: 80 }),
    quantity: integer("quantity"),
    complexity: integer("complexity").default(1), // 复杂度评分 1-5
    // 预测结果
    predictedDays: integer("predicted_days").notNull(), // 预测天数
    confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }), // 置信度 0-1
    predictionModel: varchar("prediction_model", { length: 50 }), // 使用的模型
    // 时间戳
    predictionDate: timestamp("prediction_date").notNull().defaultNow(),
    actualDays: integer("actual_days"), // 实际天数（用于反馈优化）
    isAccurate: boolean("is_accurate"), // 预测是否准确
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_pred_so").on(table.salesOrderId),
    index("idx_pred_wo").on(table.workOrderId),
  ]
);

// 历史生产数据 - 用于训练预测模型
export const productionHistory = pgTable(
  "production_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workOrderId: uuid("work_order_id").references(() => productionOrders.id),
    sku: varchar("sku", { length: 80 }).notNull(),
    productCategory: varchar("product_category", { length: 30 }),
    quantity: integer("quantity").notNull(),
    complexity: integer("complexity").default(1),
    // 各环节耗时
    cuttingHours: decimal("cutting_hours", { precision: 6, scale: 2 }),
    drillingHours: decimal("drilling_hours", { precision: 6, scale: 2 }),
    surfaceTreatHours: decimal("surface_treat_hours", { precision: 6, scale: 2 }),
    assemblingHours: decimal("assembling_hours", { precision: 6, scale: 2 }),
    qcHours: decimal("qc_hours", { precision: 6, scale: 2 }),
    totalHours: decimal("total_hours", { precision: 6, scale: 2 }),
    // 时间
    startDate: date("start_date"),
    completionDate: date("completion_date"),
    actualDays: integer("actual_days"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_prod_hist_sku").on(table.sku),
    index("idx_prod_hist_category").on(table.productCategory),
  ]
);

// ============================================================
// APPROVAL RULES & LOGS (审批)
// ============================================================

export const approvalRules = pgTable("approval_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: varchar("entity_type", { length: 10 }).notNull(), // PR / PO / SO
  minAmount: decimal("min_amount", { precision: 12, scale: 2 }).notNull(),
  maxAmount: decimal("max_amount", { precision: 12, scale: 2 }).notNull(),
  approverRole: userRoleEnum("approver_role").notNull(),
  approverUserId: uuid("approver_user_id").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
});

export const approvalLogs = pgTable("approval_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: varchar("entity_type", { length: 10 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  approverId: uuid("approver_id")
    .notNull()
    .references(() => users.id),
  status: approvalStatusEnum("status").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Workflow transition log (状态变更日志)
export const workflowLogs = pgTable(
  "workflow_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: varchar("entity_type", { length: 10 }).notNull(), // SO / WO / PR / PO
    entityId: uuid("entity_id").notNull(),
    fromStatus: varchar("from_status", { length: 30 }).notNull(),
    toStatus: varchar("to_status", { length: 30 }).notNull(),
    changedBy: uuid("changed_by").references(() => users.id),
    reason: text("reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_wflog_entity").on(table.entityType, table.entityId),
  ]
);

// ============================================================
// SYSTEM CONFIG - 系统配置
// ============================================================

export const systemConfigs = pgTable(
  "system_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar("key", { length: 100 }).notNull().unique(),
    value: text("value").notNull(),
    type: configTypeEnum("type").notNull().default("string"),
    description: text("description"),
    isEditable: boolean("is_editable").notNull().default(true),
    updatedBy: uuid("updated_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("idx_config_key").on(table.key)]
);

// 默认系统配置
export const DEFAULT_SYSTEM_CONFIGS = {
  "company.name": "边缘智造",
  "company.address": "",
  "company.phone": "",
  "company.email": "contact@parti.com",
  "order.prefix.so": "SO",
  "order.prefix.wo": "WO",
  "order.prefix.pr": "PR",
  "order.prefix.po": "PO",
  "order.prefix.gr": "GR",
  "mrp.default_horizon": "30",
  "mrp.safety_stock_multiplier": "1.2",
  "inventory.low_stock_threshold": "10",
  "prediction.confidence_threshold": "0.75",
  "auth.session_timeout": "24",
};

// ============================================================
// SEQUENCE COUNTERS (单号生成)
// ============================================================

export const sequenceCounters = pgTable(
  "sequence_counters",
  {
    id: serial("id").primaryKey(),
    prefix: varchar("prefix", { length: 10 }).notNull(), // SO / WO / PR / PO / GR
    dateKey: varchar("date_key", { length: 8 }).notNull(), // YYYYMMDD
    currentSeq: integer("current_seq").notNull().default(0),
  },
  (table) => [unique("idx_seq_prefix_date").on(table.prefix, table.dateKey)]
);

// ============================================================
// RELATIONS
// ============================================================

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  sessions: many(userSessions),
  salesOrdersReviewed: many(salesOrders),
  purchaseOrdersApproved: many(purchaseOrders),
  purchaseRequisitionsRequested: many(purchaseRequisitions),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const dealerApplicationsRelations = relations(
  dealerApplications,
  ({ one }) => ({
    reviewer: one(users, {
      fields: [dealerApplications.reviewedBy],
      references: [users.id],
    }),
    dealer: one(dealers, {
      fields: [dealerApplications.dealerId],
      references: [dealers.id],
    }),
  })
);

export const dealersRelations = relations(dealers, ({ many }) => ({
  addresses: many(dealerAddresses),
  salesOrders: many(salesOrders),
  applications: many(dealerApplications),
}));

export const dealerAddressesRelations = relations(
  dealerAddresses,
  ({ one }) => ({
    dealer: one(dealers, {
      fields: [dealerAddresses.dealerId],
      references: [dealers.id],
    }),
  })
);

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  dealer: one(dealers, {
    fields: [salesOrders.dealerId],
    references: [dealers.id],
  }),
  reviewer: one(users, {
    fields: [salesOrders.reviewedBy],
    references: [users.id],
  }),
  items: many(salesOrderItems),
  productionOrders: many(productionOrders),
  deliveryPrediction: one(deliveryPredictions),
}));

export const salesOrderItemsRelations = relations(
  salesOrderItems,
  ({ one }) => ({
    salesOrder: one(salesOrders, {
      fields: [salesOrderItems.salesOrderId],
      references: [salesOrders.id],
    }),
    variant: one(productVariants, {
      fields: [salesOrderItems.variantId],
      references: [productVariants.id],
    }),
  })
);

export const productionOrdersRelations = relations(
  productionOrders,
  ({ one, many }) => ({
    salesOrder: one(salesOrders, {
      fields: [productionOrders.salesOrderId],
      references: [salesOrders.id],
    }),
    salesOrderItem: one(salesOrderItems, {
      fields: [productionOrders.salesOrderItemId],
      references: [salesOrderItems.id],
    }),
    variant: one(productVariants, {
      fields: [productionOrders.variantId],
      references: [productVariants.id],
    }),
    confirmer: one(users, {
      fields: [productionOrders.confirmedBy],
      references: [users.id],
    }),
    processLogs: many(woProcessLogs),
    productionHistory: one(productionHistory),
  })
);

export const woProcessLogsRelations = relations(woProcessLogs, ({ one }) => ({
  workOrder: one(productionOrders, {
    fields: [woProcessLogs.workOrderId],
    references: [productionOrders.id],
  }),
  operator: one(users, {
    fields: [woProcessLogs.operatorId],
    references: [users.id],
  }),
}));

export const productionHistoryRelations = relations(
  productionHistory,
  ({ one }) => ({
    workOrder: one(productionOrders, {
      fields: [productionHistory.workOrderId],
      references: [productionOrders.id],
    }),
  })
);

export const purchaseRequisitionsRelations = relations(
  purchaseRequisitions,
  ({ one, many }) => ({
    requester: one(users, {
      fields: [purchaseRequisitions.requestedBy],
      references: [users.id],
    }),
    items: many(prItems),
  })
);

export const prItemsRelations = relations(prItems, ({ one }) => ({
  pr: one(purchaseRequisitions, {
    fields: [prItems.prId],
    references: [purchaseRequisitions.id],
  }),
  material: one(materials, {
    fields: [prItems.materialId],
    references: [materials.id],
  }),
  suggestedSupplier: one(suppliers, {
    fields: [prItems.suggestedSupplierId],
    references: [suppliers.id],
  }),
}));

export const purchaseOrdersRelations = relations(
  purchaseOrders,
  ({ one, many }) => ({
    supplier: one(suppliers, {
      fields: [purchaseOrders.supplierId],
      references: [suppliers.id],
    }),
    purchaser: one(users, {
      fields: [purchaseOrders.purchaserId],
      references: [users.id],
    }),
    approver: one(users, {
      fields: [purchaseOrders.approvedBy],
      references: [users.id],
    }),
    items: many(poItems),
  })
);

export const poItemsRelations = relations(poItems, ({ one }) => ({
  po: one(purchaseOrders, {
    fields: [poItems.poId],
    references: [purchaseOrders.id],
  }),
  material: one(materials, {
    fields: [poItems.materialId],
    references: [materials.id],
  }),
  pr: one(purchaseRequisitions, {
    fields: [poItems.relatedPrId],
    references: [purchaseRequisitions.id],
  }),
}));

export const goodsReceiptsRelations = relations(
  goodsReceipts,
  ({ one, many }) => ({
    supplier: one(suppliers, {
      fields: [goodsReceipts.supplierId],
      references: [suppliers.id],
    }),
    warehouse: one(warehouses, {
      fields: [goodsReceipts.warehouseId],
      references: [warehouses.id],
    }),
    receiver: one(users, {
      fields: [goodsReceipts.receivedBy],
      references: [users.id],
    }),
    items: many(grItems),
  })
);

export const grItemsRelations = relations(grItems, ({ one }) => ({
  gr: one(goodsReceipts, {
    fields: [grItems.grId],
    references: [goodsReceipts.id],
  }),
  material: one(materials, {
    fields: [grItems.materialId],
    references: [materials.id],
  }),
  variant: one(productVariants, {
    fields: [grItems.variantId],
    references: [productVariants.id],
  }),
}));

export const productTemplatesRelations = relations(
  productTemplates,
  ({ many }) => ({
    variants: many(productVariants),
  })
);

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    template: one(productTemplates, {
      fields: [productVariants.templateId],
      references: [productTemplates.id],
    }),
    surfaceTreatment: one(surfaceTreatments, {
      fields: [productVariants.surfaceTreatmentId],
      references: [surfaceTreatments.id],
    }),
    boms: many(billOfMaterials),
  })
);

export const billOfMaterialsRelations = relations(
  billOfMaterials,
  ({ one, many }) => ({
    variant: one(productVariants, {
      fields: [billOfMaterials.variantId],
      references: [productVariants.id],
    }),
    createdByUser: one(users, {
      fields: [billOfMaterials.createdBy],
      references: [users.id],
    }),
    items: many(bomItems),
  })
);

export const bomItemsRelations = relations(bomItems, ({ one }) => ({
  bom: one(billOfMaterials, {
    fields: [bomItems.bomId],
    references: [billOfMaterials.id],
  }),
  material: one(materials, {
    fields: [bomItems.materialId],
    references: [materials.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  materials: many(supplierMaterials),
  purchaseOrders: many(purchaseOrders),
}));

export const supplierMaterialsRelations = relations(
  supplierMaterials,
  ({ one }) => ({
    supplier: one(suppliers, {
      fields: [supplierMaterials.supplierId],
      references: [suppliers.id],
    }),
    material: one(materials, {
      fields: [supplierMaterials.materialId],
      references: [materials.id],
    }),
  })
);

export const materialsRelations = relations(materials, ({ many }) => ({
  suppliers: many(supplierMaterials),
  batches: many(materialBatches),
}));

export const materialBatchesRelations = relations(
  materialBatches,
  ({ one, many }) => ({
    material: one(materials, {
      fields: [materialBatches.materialId],
      references: [materials.id],
    }),
    supplier: one(suppliers, {
      fields: [materialBatches.supplierId],
      references: [suppliers.id],
    }),
    gr: one(goodsReceipts, {
      fields: [materialBatches.grId],
      references: [goodsReceipts.id],
    }),
    warehouse: one(warehouses, {
      fields: [materialBatches.warehouseId],
      references: [warehouses.id],
    }),
    usageLogs: many(batchUsageLogs),
    parentBatch: one(materialBatches, {
      fields: [materialBatches.parentBatchId],
      references: [materialBatches.id],
    }),
  })
);

export const batchUsageLogsRelations = relations(batchUsageLogs, ({ one }) => ({
  batch: one(materialBatches, {
    fields: [batchUsageLogs.batchId],
    references: [materialBatches.id],
  }),
  material: one(materials, {
    fields: [batchUsageLogs.materialId],
    references: [materials.id],
  }),
}));

export const warehousesRelations = relations(warehouses, ({ many, one }) => ({
  manager: one(users, {
    fields: [warehouses.managerId],
    references: [users.id],
  }),
}));

export const warehouseLocationsRelations = relations(
  warehouseLocations,
  ({ one }) => ({
    warehouse: one(warehouses, {
      fields: [warehouseLocations.warehouseId],
      references: [warehouses.id],
    }),
  })
);

export const deliveryPredictionsRelations = relations(
  deliveryPredictions,
  ({ one }) => ({
    salesOrder: one(salesOrders, {
      fields: [deliveryPredictions.salesOrderId],
      references: [salesOrders.id],
    }),
    workOrder: one(productionOrders, {
      fields: [deliveryPredictions.workOrderId],
      references: [productionOrders.id],
    }),
  })
);

export const mrpRunsRelations = relations(mrpRuns, ({ one, many }) => ({
  runByUser: one(users, {
    fields: [mrpRuns.runBy],
    references: [users.id],
  }),
  demands: many(mrpDemands),
  supplies: many(mrpSupplies),
  suggestions: many(mrpSuggestions),
}));

export const mrpDemandsRelations = relations(mrpDemands, ({ one }) => ({
  mrpRun: one(mrpRuns, {
    fields: [mrpDemands.mrpRunId],
    references: [mrpRuns.id],
  }),
  material: one(materials, {
    fields: [mrpDemands.materialId],
    references: [materials.id],
  }),
}));

export const mrpSuppliesRelations = relations(mrpSupplies, ({ one }) => ({
  mrpRun: one(mrpRuns, {
    fields: [mrpSupplies.mrpRunId],
    references: [mrpRuns.id],
  }),
  material: one(materials, {
    fields: [mrpSupplies.materialId],
    references: [materials.id],
  }),
}));

export const mrpSuggestionsRelations = relations(mrpSuggestions, ({ one }) => ({
  mrpRun: one(mrpRuns, {
    fields: [mrpSuggestions.mrpRunId],
    references: [mrpRuns.id],
  }),
  material: one(materials, {
    fields: [mrpSuggestions.materialId],
    references: [materials.id],
  }),
  convertedPr: one(purchaseRequisitions, {
    fields: [mrpSuggestions.convertedPrId],
    references: [purchaseRequisitions.id],
  }),
}));

export const systemConfigsRelations = relations(systemConfigs, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [systemConfigs.updatedBy],
    references: [users.id],
  }),
}));

// ============================================================
// PRD V2.0 产品主数据导出
// ============================================================

export * from "./schema-products";