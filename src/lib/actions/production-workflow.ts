"use server";

import { db } from "@/db";
import {
  productionOrders,
  productionProcesses,
  woStatusEnum,
} from "@/db/schema";
import { eq, and, desc, asc, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "./rbac";
import { generateDocNo } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// ============================================================
// 生产工序流转管理 - PRD V2.0
// 8步工序：组装 → 截断 → 钻孔 → 预埋 → 质检 → 分拣 → 包装 → 发货
// ============================================================

// 工序状态定义（与数据库枚举对应）
const PROCESS_SEQUENCE = [
  { code: "assembling", name: "连接件组装", next: "cutting" },
  { code: "cutting", name: "型材截断", next: "drilling" },
  { code: "drilling", name: "型材钻孔", next: "preloading" },
  { code: "preloading", name: "预埋连接件", next: "qc" },
  { code: "qc", name: "质量检验", next: "sorting" },
  { code: "sorting", name: "五金配套分拣", next: "packing" },
  { code: "packing", name: "包装", next: "shipping" },
  { code: "shipping", name: "发货", next: "finished" },
] as const;

// 获取所有生产工序定义
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

// 创建生产工序
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
    if (!(await hasPermission(PERMISSIONS.PRODUCTION_CREATE))) {
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

// 初始化标准生产工序（8步）
export async function initializeProductionProcesses() {
  try {
    // 检查是否已有数据
    const existing = await db
      .select()
      .from(productionProcesses)
      .limit(1);
    
    if (existing.length > 0) {
      return { success: true, message: "Production processes already initialized" };
    }

    const processes = [
      {
        code: "assembling",
        name: "连接件组装",
        sequence: 1,
        description: "将螺杆、齿轮组、外壳组装到位",
        qcRequired: true,
        qcPoints: "旋转顺畅度，扭矩测试",
        standardTime: 5,
      },
      {
        code: "cutting",
        name: "型材截断",
        sequence: 2,
        description: "按订单要求长度切割",
        qcRequired: true,
        qcPoints: "长度公差 ±1mm，切口平整度",
        standardTime: 3,
      },
      {
        code: "drilling",
        name: "型材钻孔",
        sequence: 3,
        description: "钻定位销子孔",
        qcRequired: true,
        qcPoints: "孔径公差 ±0.2mm，孔位精度",
        standardTime: 4,
      },
      {
        code: "preloading",
        name: "预埋连接件",
        sequence: 4,
        description: "将连接件置入型材预留位置",
        qcRequired: true,
        qcPoints: "嵌入深度，稳固性测试",
        standardTime: 6,
      },
      {
        code: "qc",
        name: "质量检验",
        sequence: 5,
        description: "全面检验成品质量",
        qcRequired: true,
        qcPoints: "长度尺寸、表面划痕、连接件旋转顺畅性",
        standardTime: 10,
      },
      {
        code: "sorting",
        name: "五金配套分拣",
        sequence: 6,
        description: "配套六通、蝶形螺母、脚轮等",
        qcRequired: false,
        qcPoints: "配件规格核对，数量清点",
        standardTime: 4,
      },
      {
        code: "packing",
        name: "包装",
        sequence: 7,
        description: "纸箱+珍珠棉防护，贴标",
        qcRequired: true,
        qcPoints: "包装完整性，标签准确性",
        standardTime: 5,
      },
      {
        code: "shipping",
        name: "发货",
        sequence: 8,
        description: "快递/物流/货拉拉配送",
        qcRequired: false,
        qcPoints: "物流时效，货物完整性",
        standardTime: 10,
      },
    ];

    for (const proc of processes) {
      await db.insert(productionProcesses).values({
        ...proc,
        isActive: true,
      });
    }

    return { success: true, message: "Production processes initialized" };
  } catch (error) {
    console.error("Failed to initialize production processes:", error);
    return { success: false, error };
  }
}

// 扫码报工 - 开始工序
export async function startProcess(data: {
  workOrderId: string;
  processCode: string;
  operator?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!(await hasPermission(PERMISSIONS.PRODUCTION_UPDATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const { workOrderId, processCode, operator } = data;

    // 获取生产订单
    const [wo] = await db
      .select()
      .from(productionOrders)
      .where(eq(productionOrders.id, workOrderId))
      .limit(1);

    if (!wo) {
      return { success: false, error: "Work order not found" };
    }

    // 检查是否可以开始此工序
    const expectedStatus = processCode as string;
    if (wo.status !== expectedStatus && wo.status !== "scheduled") {
      return { 
        success: false, 
        error: `Cannot start ${processCode}. Current status: ${wo.status}` 
      };
    }

    // 更新生产订单状态
    await db
      .update(productionOrders)
      .set({
        status: processCode as any,
        updatedAt: new Date(),
      })
      .where(eq(productionOrders.id, workOrderId));

    revalidatePath("/production");
    
    return { 
      success: true, 
      data: {
        workOrderId,
        processCode,
        startedAt: new Date(),
      }
    };
  } catch (error) {
    console.error("Failed to start process:", error);
    return { success: false, error };
  }
}

// 扫码报工 - 完成工序
export async function completeProcess(data: {
  workOrderId: string;
  processCode: string;
  qcResult?: "pass" | "fail";
  qcRemark?: string;
  completedQty?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!(await hasPermission(PERMISSIONS.PRODUCTION_CONFIRM))) {
      return { success: false, error: "Unauthorized" };
    }

    const { workOrderId, processCode, qcResult, qcRemark, completedQty } = data;

    // 获取生产订单
    const [wo] = await db
      .select()
      .from(productionOrders)
      .where(eq(productionOrders.id, workOrderId))
      .limit(1);

    if (!wo) {
      return { success: false, error: "Work order not found" };
    }

    // 质检失败处理
    if (qcResult === "fail") {
      await db
        .update(productionOrders)
        .set({
          status: "cancelled",
          notes: `QC Failed at ${processCode}: ${qcRemark}`,
          updatedAt: new Date(),
        })
        .where(eq(productionOrders.id, workOrderId));

      return { success: true, data: { status: "cancelled", reason: qcRemark } };
    }

    // 找到下一工序
    const currentProcess = PROCESS_SEQUENCE.find(p => p.code === processCode);
    const nextStatus = currentProcess?.next || "finished";

    // 更新生产订单状态
    const updateData: any = {
      status: nextStatus as any,
      updatedAt: new Date(),
    };

    // 如果是最后一道工序，记录完成时间
    if (nextStatus === "finished") {
      updateData.actCompletion = new Date().toISOString().split("T")[0];
    }

    await db
      .update(productionOrders)
      .set(updateData)
      .where(eq(productionOrders.id, workOrderId));

    revalidatePath("/production");

    return { 
      success: true, 
      data: {
        workOrderId,
        processCode,
        nextStatus,
        completedAt: new Date(),
      }
    };
  } catch (error) {
    console.error("Failed to complete process:", error);
    return { success: false, error };
  }
}

// 获取工序流转状态
export async function getWorkOrderProcessStatus(workOrderId: string) {
  try {
    const [wo] = await db
      .select()
      .from(productionOrders)
      .where(eq(productionOrders.id, workOrderId))
      .limit(1);

    if (!wo) {
      return { success: false, error: "Work order not found" };
    }

    // 获取所有工序定义
    const processes = await db
      .select()
      .from(productionProcesses)
      .where(eq(productionProcesses.isActive, true))
      .orderBy(asc(productionProcesses.sequence));

    // 构建工序流转状态
    const currentStatus = wo.status;
    let currentFound = false;

    const processFlow = processes.map((proc) => {
      let status: "pending" | "current" | "completed" | "cancelled" = "pending";
      
      if (proc.code === currentStatus) {
        status = "current";
        currentFound = true;
      } else if (currentStatus === "finished" || currentStatus === "cancelled") {
        status = currentStatus === "finished" ? "completed" : "cancelled";
      } else if (currentFound) {
        status = "pending";
      } else if (currentStatus !== "pending_confirm" && currentStatus !== "scheduled") {
        status = "completed";
      }

      return {
        ...proc,
        status,
      };
    });

    return {
      success: true,
      data: {
        workOrder: wo,
        processFlow,
        currentStatus,
      },
    };
  } catch (error) {
    console.error("Failed to get work order process status:", error);
    return { success: false, error };
  }
}

// 批量更新生产订单状态
export async function batchUpdateWorkOrderStatus(data: {
  workOrderIds: string[];
  status: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!(await hasPermission(PERMISSIONS.PRODUCTION_UPDATE))) {
      return { success: false, error: "Unauthorized" };
    }

    const { workOrderIds, status } = data;

    await db
      .update(productionOrders)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(inArray(productionOrders.id, workOrderIds));

    revalidatePath("/production");

    return { 
      success: true, 
      data: { updatedCount: workOrderIds.length }
    };
  } catch (error) {
    console.error("Failed to batch update work orders:", error);
    return { success: false, error };
  }
}

// 获取生产订单列表
export async function getWorkOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  try {
    const { page = 1, limit = 20, status } = params || {};

    const conditions: any[] = [];
    if (status) {
      conditions.push(eq(productionOrders.status, status as any));
    }

const query = conditions.length > 0
      ? db.select().from(productionOrders).where(and(...conditions))
      : db.select().from(productionOrders);

    const orders = await query
      .orderBy(desc(productionOrders.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { success: true, data: orders };
  } catch (error) {
    console.error("Failed to get work orders:", error);
    return { success: false, error };
  }
}

// 确认生产订单
export async function confirmWorkOrder(workOrderId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!(await hasPermission(PERMISSIONS.PRODUCTION_CONFIRM))) {
      return { success: false, error: "Unauthorized" };
    }

    const [wo] = await db
      .select()
      .from(productionOrders)
      .where(eq(productionOrders.id, workOrderId))
      .limit(1);

    if (!wo) {
      return { success: false, error: "Work order not found" };
    }

    if (wo.status !== "pending_confirm") {
      return { success: false, error: "Work order is not pending confirmation" };
    }

    await db
      .update(productionOrders)
      .set({
        status: "scheduled",
        confirmedBy: session.user.id,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(productionOrders.id, workOrderId));

    revalidatePath("/production");
    return { success: true };
  } catch (error) {
    console.error("Failed to confirm work order:", error);
    return { success: false, error };
  }
}
