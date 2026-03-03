"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Search, Eye, X, CheckCircle } from "lucide-react";
import { WO_STATUS_MAP } from "@/lib/utils";

const WO_STEPS = [
  { key: "cutting", label: "切割" },
  { key: "drilling", label: "钻孔" },
  { key: "surface_treat", label: "表面处理" },
  { key: "assembling", label: "组装" },
  { key: "qc", label: "质检" },
];

const DEMO_WO = [
  {
    id: "1",
    workOrderNo: "WO-20240301-0001-01",
    salesOrderNo: "SO-20240301-0001",
    sku: "C-MR-2525-8-A-SV-L600MM-DE",
    productName: "25×25功能管 太空银 600mm 钻孔预埋",
    quantity: 100,
    status: "cutting",
    estCompletionDate: "2024-03-06",
    actCompletionDate: null,
    rawLotNo: "LOT-AL6063-20240225-001",
    currentStep: 0,
  },
  {
    id: "2",
    workOrderNo: "WO-20240301-0001-02",
    salesOrderNo: "SO-20240301-0001",
    sku: "C-OL-2525-A-SV",
    productName: "25×25六通 太空银",
    quantity: 200,
    status: "pending_confirm",
    estCompletionDate: "2024-03-07",
    actCompletionDate: null,
    rawLotNo: null,
    currentStep: -1,
  },
  {
    id: "3",
    workOrderNo: "WO-20240228-0003-01",
    salesOrderNo: "SO-20240228-0003",
    sku: "C-MR-5050-A-BK-L1200MM-D",
    productName: "50×50功能管 曜石黑 1200mm 钻孔",
    quantity: 50,
    status: "surface_treat",
    estCompletionDate: "2024-03-04",
    actCompletionDate: null,
    rawLotNo: "LOT-AL6063-50-20240220-003",
    currentStep: 2,
  },
  {
    id: "4",
    workOrderNo: "WO-20240228-0002-01",
    salesOrderNo: "SO-20240228-0002",
    sku: "H-MR-2020-A-SV-L400MM",
    productName: "20×20功能管 太空银 400mm",
    quantity: 80,
    status: "qc",
    estCompletionDate: "2024-03-03",
    actCompletionDate: null,
    rawLotNo: "LOT-AL6063-20-20240222-002",
    currentStep: 4,
  },
  {
    id: "5",
    workOrderNo: "WO-20240227-0005-01",
    salesOrderNo: "SO-20240227-0005",
    sku: "C-MR-2525-8-A-GY-L800MM-DE",
    productName: "25×25功能管 太空灰 800mm 钻孔预埋",
    quantity: 300,
    status: "finished",
    estCompletionDate: "2024-03-01",
    actCompletionDate: "2024-03-01",
    rawLotNo: "LOT-AL6063-20240218-005",
    currentStep: 5,
  },
];

type WO = (typeof DEMO_WO)[number];

export default function ProductionPage() {
  const [workOrders] = useState(DEMO_WO);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedWO, setSelectedWO] = useState<WO | null>(null);

  const filtered = workOrders.filter((wo) => {
    const matchSearch =
      !search ||
      wo.workOrderNo.includes(search) ||
      wo.sku.includes(search) ||
      wo.salesOrderNo.includes(search);
    const matchStatus = !statusFilter || wo.status === statusFilter;
    return matchSearch && matchStatus;
  });


  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜索工单号、SKU、关联SO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-80"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="">全部状态</option>
            <option value="pending_confirm">待确认</option>
            <option value="scheduled">已排产</option>
            <option value="cutting">切割中</option>
            <option value="drilling">钻孔中</option>
            <option value="surface_treat">表面处理</option>
            <option value="assembling">组装中</option>
            <option value="qc">质检中</option>
            <option value="finished">已完成</option>
          </Select>
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
              {workOrders.filter((w) => !["pending_confirm", "finished", "cancelled"].includes(w.status)).length}
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
        {filtered.map((wo) => {
          const statusInfo = WO_STATUS_MAP[wo.status];
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
                      <span>关联: {wo.salesOrderNo}</span>
                      <span>SKU: <span className="font-mono">{wo.sku}</span></span>
                      <span>数量: {wo.quantity}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {wo.status === "pending_confirm" && (
                      <Button variant="outline" size="sm">
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
                {wo.currentStep >= 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-1 mb-2">
                      {WO_STEPS.map((step, i) => (
                        <div key={step.key} className="flex-1 flex flex-col items-center">
                          <div
                            className={`h-2 w-full rounded-full ${
                              i <= wo.currentStep ? "bg-blue-500" : "bg-slate-100"
                            } ${i === wo.currentStep ? "bg-blue-600 animate-pulse" : ""}`}
                          />
                          <span className={`text-[10px] mt-1 ${i <= wo.currentStep ? "text-blue-600 font-medium" : "text-slate-400"}`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 mt-3 text-xs text-slate-500">
                  <span>预计完成: {wo.estCompletionDate}</span>
                  {wo.actCompletionDate && (
                    <span className="text-emerald-600">实际完成: {wo.actCompletionDate}</span>
                  )}
                  {wo.rawLotNo && <span>批次: <span className="font-mono">{wo.rawLotNo}</span></span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail Drawer */}
      {selectedWO && (
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
                  <p className="text-xs text-slate-500">关联销售订单</p>
                  <p className="font-mono text-sm text-blue-600">{selectedWO.salesOrderNo}</p>
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
                  <p>{selectedWO.estCompletionDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">实际完成</p>
                  <p>{selectedWO.actCompletionDate || "-"}</p>
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
                  {WO_STEPS.map((step, i) => (
                    <div key={step.key} className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                          i < selectedWO.currentStep
                            ? "bg-emerald-100 text-emerald-600"
                            : i === selectedWO.currentStep
                            ? "bg-blue-100 text-blue-600 ring-2 ring-blue-200"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {i < selectedWO.currentStep ? "✓" : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${i <= selectedWO.currentStep ? "font-medium text-slate-900" : "text-slate-400"}`}>
                          {step.label}
                        </p>
                      </div>
                      {i === selectedWO.currentStep && selectedWO.status !== "finished" && (
                        <Badge variant="info">进行中</Badge>
                      )}
                      {i < selectedWO.currentStep && (
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
