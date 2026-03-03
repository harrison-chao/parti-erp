"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Search, Eye, X, CheckCircle, Play, RotateCcw } from "lucide-react";
import { WO_STATUS_MAP } from "@/lib/utils";
import { 
  getWorkOrders, 
  confirmWorkOrder,
  startProcess,
  completeProcess,
  getWorkOrderProcessStatus
} from "@/lib/actions/production-workflow";

const WO_STEPS = [
  { key: "assembling", label: "组装" },
  { key: "cutting", label: "截断" },
  { key: "drilling", label: "钻孔" },
  { key: "preloading", label: "预埋" },
  { key: "qc", label: "质检" },
  { key: "sorting", label: "分拣" },
  { key: "packing", label: "包装" },
  { key: "shipping", label: "发货" },
];

interface WorkOrder {
  id: string;
  workOrderNo: string;
  salesOrderId: string | null;
  sku: string;
  productName: string;
  quantity: number;
  status: string;
  estCompletionDate: string | null;
  actCompletionDate: string | null;
  rawLotNo: string | null;
  createdAt: Date;
}

export default function ProductionPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [processStatus, setProcessStatus] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadWorkOrders();
  }, []);

  useEffect(() => {
    if (selectedWO) {
      loadProcessStatus(selectedWO.id);
    }
  }, [selectedWO]);

  async function loadWorkOrders() {
    try {
      setLoading(true);
      const result = await getWorkOrders({ limit: 100 });
      if (result.success) {
        setWorkOrders(result.data || []);
      } else {
        console.error("加载工单失败");
      }
    } catch (error) {
      console.error("加载工单失败", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadProcessStatus(workOrderId: string) {
    try {
      const result = await getWorkOrderProcessStatus(workOrderId);
      if (result.success) {
        setProcessStatus(result.data);
      }
    } catch (error) {
      console.error("Failed to load process status:", error);
    }
  }

  async function handleConfirmWO(woId: string) {
    try {
      setActionLoading(true);
      const result = await confirmWorkOrder(woId);
      if (result.success) {
        console.log("工单已确认");
        loadWorkOrders();
      } else {
        console.error(result.error || "确认失败");
      }
    } catch (error) {
      console.error("确认失败");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStartProcess(woId: string, processCode: string) {
    try {
      setActionLoading(true);
      const result = await startProcess({ workOrderId: woId, processCode });
      if (result.success) {
        console.log("工序已开始");
        loadWorkOrders();
        if (selectedWO) {
          loadProcessStatus(woId);
        }
      } else {
        console.error(result.error || "开始失败");
      }
    } catch (error) {
      console.error("开始失败");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCompleteProcess(woId: string, processCode: string) {
    try {
      setActionLoading(true);
      const result = await completeProcess({ workOrderId: woId, processCode, qcResult: "pass" });
      if (result.success) {
        console.log("工序已完成");
        loadWorkOrders();
        if (selectedWO) {
          loadProcessStatus(woId);
        }
      } else {
        console.error(result.error || "完成失败");
      }
    } catch (error) {
      console.error("完成失败");
    } finally {
      setActionLoading(false);
    }
  }

  const filtered = workOrders.filter((wo) => {
    const matchSearch =
      !search ||
      wo.workOrderNo?.includes(search) ||
      wo.sku?.includes(search) ||
      wo.productName?.includes(search);
    const matchStatus = !statusFilter || wo.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getCurrentStep = (status: string) => {
    const stepIndex = WO_STEPS.findIndex(s => s.key === status);
    return stepIndex >= 0 ? stepIndex : -1;
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜索工单号、SKU、产品名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-80"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="">全部状态</option>
            <option value="pending_confirm">待确认</option>
            <option value="scheduled">已排产</option>
            <option value="assembling">组装中</option>
            <option value="cutting">截断中</option>
            <option value="drilling">钻孔中</option>
            <option value="preloading">预埋中</option>
            <option value="qc">质检中</option>
            <option value="sorting">分拣中</option>
            <option value="packing">包装中</option>
            <option value="shipping">发货中</option>
            <option value="finished">已完成</option>
          </Select>
          <Button variant="outline" size="sm" onClick={loadWorkOrders} disabled={loading}>
            <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">待确认</p>
            <p className="text-2xl font-bold text-amber-600">
              {workOrders.filter((w) => w.status === "pending_confirm").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">生产中</p>
            <p className="text-2xl font-bold text-blue-600">
              {workOrders.filter((w) => 
                !["pending_confirm", "finished", "cancelled", "scheduled"].includes(w.status)
              ).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">质检中</p>
            <p className="text-2xl font-bold text-indigo-600">
              {workOrders.filter((w) => w.status === "qc").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">已完成</p>
            <p className="text-2xl font-bold text-emerald-600">
              {workOrders.filter((w) => w.status === "finished").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* WO Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-400">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">暂无工单</div>
        ) : (
          filtered.map((wo) => {
            const statusInfo = WO_STATUS_MAP[wo.status];
            const currentStep = getCurrentStep(wo.status);
            return (
              <Card key={wo.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium text-slate-900">
                          {wo.workOrderNo}
                        </span>
                        <Badge variant={statusInfo?.color as "success" | "warning" | "danger" | "info" | "default"}>
                          {statusInfo?.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{wo.productName}</p>
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span>SKU: <span className="font-mono">{wo.sku}</span></span>
                        <span>数量: {wo.quantity}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {wo.status === "pending_confirm" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleConfirmWO(wo.id)}
                          disabled={actionLoading}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          确认
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setSelectedWO(wo)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {currentStep >= 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-1 mb-2">
                        {WO_STEPS.map((step, i) => (
                          <div key={step.key} className="flex-1 flex flex-col items-center">
                            <div
                              className={`h-2 w-full rounded-full ${
                                i <= currentStep ? "bg-blue-500" : "bg-slate-100"
                              } ${i === currentStep ? "bg-blue-600 animate-pulse" : ""}`}
                            />
                            <span className={`text-[10px] mt-1 ${i <= currentStep ? "text-blue-600 font-medium" : "text-slate-400"}`}>
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 mt-3 text-xs text-slate-500">
                    <span>预计完成: {wo.estCompletionDate || "-"}</span>
                    {wo.actCompletionDate && (
                      <span className="text-emerald-600">实际完成: {wo.actCompletionDate}</span>
                    )}
                    {wo.rawLotNo && <span>批次: <span className="font-mono">{wo.rawLotNo}</span></span>}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail Drawer */}
      {selectedWO && processStatus && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white p-6">
              <div>
                <h3 className="text-lg font-semibold">生产委托详情</h3>
                <p className="text-sm text-slate-500 font-mono">{selectedWO.workOrderNo}</p>
              </div>
              <button onClick={() => setSelectedWO(null)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">状态</p>
                  <Badge variant={WO_STATUS_MAP[selectedWO.status]?.color as "success" | "warning" | "danger" | "info" | "default"}>
                    {WO_STATUS_MAP[selectedWO.status]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">产品 SKU</p>
                  <p className="font-mono text-xs">{selectedWO.sku}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">生产数量</p>
                  <p className="font-medium">{selectedWO.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">预计完成</p>
                  <p>{selectedWO.estCompletionDate || "-"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">原料批次</p>
                <p className="font-mono text-sm">{selectedWO.rawLotNo || "未分配"}</p>
              </div>

              {/* Process Steps */}
              <div>
                <h4 className="text-sm font-medium mb-3">工序进度</h4>
                <div className="space-y-3">
                  {processStatus?.processFlow?.map((proc: any, i: number) => (
                    <div key={proc.code} className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                          proc.status === "completed"
                            ? "bg-emerald-100 text-emerald-600"
                            : proc.status === "current"
                            ? "bg-blue-100 text-blue-600 ring-2 ring-blue-200"
                            : proc.status === "cancelled"
                            ? "bg-red-100 text-red-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {proc.status === "completed" ? "✓" : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${proc.status !== "pending" ? "font-medium text-slate-900" : "text-slate-400"}`}>
                          {proc.name}
                        </p>
                        {proc.qcRequired && (
                          <p className="text-xs text-slate-400">需要质检</p>
                        )}
                      </div>
                      {proc.status === "current" && selectedWO.status !== "finished" && (
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStartProcess(selectedWO.id, proc.code)}
                            disabled={actionLoading}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleCompleteProcess(selectedWO.id, proc.code)}
                            disabled={actionLoading}
                          >
                            完成
                          </Button>
                        </div>
                      )}
                      {proc.status === "completed" && (
                        <Badge variant="success">完成</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
