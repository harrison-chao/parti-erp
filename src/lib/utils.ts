import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in CNY
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(num);
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

/**
 * Generate document number: PREFIX-YYYYMMDD-XXXX
 */
export function generateDocNo(prefix: string, seq: number): string {
  const today = new Date();
  const dateStr =
    today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, "0") +
    today.getDate().toString().padStart(2, "0");
  return `${prefix}-${dateStr}-${seq.toString().padStart(4, "0")}`;
}

/**
 * Status label mappings
 */
export const SO_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "待审核", color: "warning" },
  confirmed: { label: "已确认", color: "info" },
  producing: { label: "生产中", color: "info" },
  ready: { label: "待发货", color: "success" },
  shipped: { label: "已发货", color: "success" },
  completed: { label: "已完成", color: "success" },
  cancelled: { label: "已取消", color: "danger" },
};

export const WO_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_confirm: { label: "待确认", color: "warning" },
  scheduled: { label: "已排产", color: "info" },
  cutting: { label: "切割中", color: "info" },
  drilling: { label: "钻孔中", color: "info" },
  surface_treat: { label: "表面处理", color: "info" },
  assembling: { label: "组装中", color: "info" },
  qc: { label: "质检中", color: "warning" },
  finished: { label: "已完成", color: "success" },
  cancelled: { label: "已取消", color: "danger" },
};

export const PR_STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "default" },
  pending: { label: "待审批", color: "warning" },
  approved: { label: "已审批", color: "success" },
  rejected: { label: "已拒绝", color: "danger" },
  converted: { label: "已转单", color: "info" },
};

export const PO_STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "default" },
  sent: { label: "已发送", color: "info" },
  confirmed: { label: "已确认", color: "info" },
  partial_received: { label: "部分到货", color: "warning" },
  fully_received: { label: "全部到货", color: "success" },
  closed: { label: "已关闭", color: "default" },
};

export const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  unpaid: { label: "未付", color: "danger" },
  partial: { label: "部分付", color: "warning" },
  paid: { label: "已付", color: "success" },
  credit: { label: "账期", color: "info" },
};
