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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// ENUMS
// ============================================================

// Dealer
export const priceTierEnum = pgEnum("price_tier", ["A", "B", "C"]);
export const settlementMethodEnum = pgEnum("settlement_method", [
  "prepaid",
  "deposit",
  "credit",
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

// ============================================================
// USERS (for auth)
// ============================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("operator"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// DEALERS (经销商)
// ============================================================

export const dealers = pgTable("dealers", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealerId: varchar("dealer_id", { length: 20 }).notNull().unique(), // PARTI-D-XXXX
  companyName: varchar("company_name", { length: 200 }).notNull(),
  contactPerson: varchar("contact_person", { length: 100 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 30 }),
  contactEmail: varchar("contact_email", { length: 255 }),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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
    trackingNo: varchar("tracking_no", { length: 100 }),
    shippingName: varchar("shipping_name", { length: 100 }),
    shippingPhone: varchar("shipping_phone", { length: 30 }),
    shippingAddress: text("shipping_address"),
    notes: text("notes"),
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
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    paidAmount: decimal("paid_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    notes: text("notes"),
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
  relatedPrNo: varchar("related_pr_no", { length: 30 }),
  materialId: uuid("material_id").references(() => materials.id),
  materialCode: varchar("material_code", { length: 50 }).notNull(),
  materialName: varchar("material_name", { length: 200 }),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  deliveryDate: date("delivery_date"),
  receivedQty: integer("received_qty").notNull().default(0),
  pendingQty: integer("pending_qty").notNull().default(0),
});

// ============================================================
// GOODS RECEIPTS (入库单)
// ============================================================

export const goodsReceipts = pgTable(
  "goods_receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    grNo: varchar("gr_no", { length: 30 }).notNull().unique(), // GR-YYYYMMDD-XXXX
    grType: grTypeEnum("gr_type").notNull(),
    relatedDocNo: varchar("related_doc_no", { length: 30 }), // PO / WO / transfer doc
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
});

// ============================================================
// WAREHOUSES & INVENTORY (库存)
// ============================================================

export const warehouses = pgTable("warehouses", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  address: text("address"),
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
// APPROVAL RULES & LOGS (审批)
// ============================================================

export const approvalRules = pgTable("approval_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: varchar("entity_type", { length: 10 }).notNull(), // PR / PO
  minAmount: decimal("min_amount", { precision: 12, scale: 2 }).notNull(),
  maxAmount: decimal("max_amount", { precision: 12, scale: 2 }).notNull(),
  approverRole: varchar("approver_role", { length: 50 }).notNull(), // manager / finance / ceo
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
// SEQUENCE COUNTERS (单号生成)
// ============================================================

export const sequenceCounters = pgTable("sequence_counters", {
  id: serial("id").primaryKey(),
  prefix: varchar("prefix", { length: 10 }).notNull(), // SO / WO / PR / PO / GR
  dateKey: varchar("date_key", { length: 8 }).notNull(), // YYYYMMDD
  currentSeq: integer("current_seq").notNull().default(0),
});

// ============================================================
// RELATIONS
// ============================================================

export const dealersRelations = relations(dealers, ({ many }) => ({
  addresses: many(dealerAddresses),
  salesOrders: many(salesOrders),
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
    variant: one(productVariants, {
      fields: [productionOrders.variantId],
      references: [productVariants.id],
    }),
    confirmer: one(users, {
      fields: [productionOrders.confirmedBy],
      references: [users.id],
    }),
    processLogs: many(woProcessLogs),
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
  ({ one }) => ({
    template: one(productTemplates, {
      fields: [productVariants.templateId],
      references: [productTemplates.id],
    }),
    surfaceTreatment: one(surfaceTreatments, {
      fields: [productVariants.surfaceTreatmentId],
      references: [surfaceTreatments.id],
    }),
  })
);
