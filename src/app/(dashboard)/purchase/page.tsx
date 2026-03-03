"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Plus, Search, Eye, CheckCircle, XCircle, ArrowRight, X } from "lucide-react";
import { formatCurrency, PR_STATUS_MAP } from "@/lib/utils";

const DEMO_PRS = [
  {
    id: "1",
    prNo: "PR-20240301-0001",
    prType: "mrp",
    requestedBy: "系统自动",
    requestDate: "2024-03-01",
    requiredDate: "2024-03-05",
    status: "pending",
    totalAmount: 12600,
    relatedWoNo: "WO-20240301-0001-01",
    items: [
      { materialCode: "RAW-AL6063-25-6M", materialName: "6063铝型材 25×25 6米/支", requiredQty: 50, currentStock: 12, suggestedQty: 50, unitPrice: 180, lineAmount: 9000 },
      { materialCode: "HW-CONN-M6", materialName: "M6预埋连接件", requiredQty: 200, currentStock: 45, suggestedQty: 200, unitPrice: 18, lineAmount: 3600 },
    ],
  },
  {
    id: "2",
    prNo: "PR-20240228-0002",
    prType: "safety_stock",
    requestedBy: "系统自动",
    requestDate: "2024-02-28",
    requiredDate: "2024-03-10",
    status: "approved",
    totalAmount: 45000,
    relatedWoNo: null,
    items: [
      { materialCode: "RAW-AL6063-50-6M", materialName: "6063铝型材 50×50 6米/支", requiredQty: 100, currentStock: 8, suggestedQty: 100, unitPrice: 350, lineAmount: 35000 },
      { materialCode: "RAW-AL6063-20-6M", materialName: "6063铝型材 20×20 6米/支", requiredQty: 80, currentStock: 15, suggestedQty: 80, unitPrice: 125, lineAmount: 10000 },
    ],
  },
  {
    id: "3",
    prNo: "PR-20240227-0003",
    prType: "manual",
    requestedBy: "采购员 王明",
    requestDate: "2024-02-27",
    requiredDate: "2024-03-08",
    status: "converted",
    totalAmount: 8400,
    relatedWoNo: null,
    items: [
      { materialCode: "PKG-BOX-60", materialName: "纸箱 60×30×15cm", requiredQty: 200, currentStock: 30, suggestedQty: 200, unitPrice: 12, lineAmount: 2400 },
      { materialCode: "PKG-FOAM-25", materialName: "珍珠棉 25mm卷材", requiredQty: 50, currentStock: 5, suggestedQty: 50, unitPrice: 85, lineAmount: 4250 },
      { materialCode: "PKG-LABEL-PARTI", materialName: "Parti品牌标签", requiredQty: 1000, currentStock: 200, suggestedQty: 1000, unitPrice: 1.75, lineAmount: 1750 },
    ],
  },
  {
    id: "4",
    prNo: "PR-20240226-0004",
    prType: "mrp",
    requestedBy: "系统自动",
    requestDate: "2024-02-26",
    requiredDate: "2024-03-03",
    status: "rejected",
    totalAmount: 52000,
    relatedWoNo: "WO-20240226-0008-01",
    items: [
      { materialCode: "RAW-AL6063-75-6M", materialName: "6063铝型材 75×75 6米/支", requiredQty: 80, currentStock: 22, suggestedQty: 80, unitPrice: 650, lineAmount: 52000 },
    ],
  },
];

const PR_TYPE_MAP = {
  safety_stock: { label: "安全库存", variant: "info" as const },
  mrp: { label: "MRP需求", variant: "warning" as const },
  manual: { label: "手工申请", variant: "default" as const },
};

type PR = (typeof DEMO_PRS)[number];

export default function PurchasePage() {
  const [prs] = useState(DEMO_PRS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPR, setSelectedPR] = useState<PR | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = prs.filter((pr) => {
    const matchSearch =
      !search || pr.prNo.includes(search) || (pr.relatedWoNo && pr.relatedWoNo.includes(search));
    const matchStatus = !statusFilter || pr.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="搜索申请号、关联WO..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-72" />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-32">
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="pending">待审批</option>
            <option value="approved">已审批</option>
            <option value="rejected">已拒绝</option>
            <option value="converted">已转单</option>
          </Select>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新建采购申请
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">待审批</p>
            <p className="text-2xl font-bold text-amber-600">{prs.filter((p) => p.status === "pending").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">已审批待转单</p>
            <p className="text-2xl font-bold text-blue-600">{prs.filter((p) => p.status === "approved").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">待审批金额</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(prs.filter((p) => p.status === "pending").reduce((s, p) => s + p.totalAmount, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">MRP触发</p>
            <p className="text-2xl font-bold text-indigo-600">{prs.filter((p) => p.prType === "mrp").length}</p>
          </CardContent>
        </Card>
      </div>

      {/* PR Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">采购申请（{filtered.length}）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">申请号</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">类型</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">申请人</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">申请日期</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">需求日期</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">金额</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">关联WO</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">状态</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pr) => {
                  const statusInfo = PR_STATUS_MAP[pr.status];
                  const typeInfo = PR_TYPE_MAP[pr.prType as keyof typeof PR_TYPE_MAP];
                  return (
                    <tr key={pr.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-blue-600">{pr.prNo}</td>
                      <td className="px-4 py-3"><Badge variant={typeInfo.variant}>{typeInfo.label}</Badge></td>
                      <td className="px-4 py-3 text-slate-600">{pr.requestedBy}</td>
                      <td className="px-4 py-3 text-slate-600">{pr.requestDate}</td>
                      <td className="px-4 py-3 text-slate-600">{pr.requiredDate}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{formatCurrency(pr.totalAmount)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{pr.relatedWoNo || "-"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusInfo?.color as "success" | "warning" | "danger" | "info" | "default"}>
                          {statusInfo?.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedPR(pr)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {pr.status === "pending" && (
                            <>
                              <Button variant="ghost" size="icon" title="审批通过">
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                              </Button>
                              <Button variant="ghost" size="icon" title="拒绝">
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                          {pr.status === "approved" && (
                            <Button variant="ghost" size="icon" title="转采购订单">
                              <ArrowRight className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      {selectedPR && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white p-6">
              <div>
                <h3 className="text-lg font-semibold">采购申请详情</h3>
                <p className="text-sm text-slate-500 font-mono">{selectedPR.prNo}</p>
              </div>
              <button onClick={() => setSelectedPR(null)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">类型</p>
                  <Badge variant={PR_TYPE_MAP[selectedPR.prType as keyof typeof PR_TYPE_MAP].variant}>
                    {PR_TYPE_MAP[selectedPR.prType as keyof typeof PR_TYPE_MAP].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">状态</p>
                  <Badge variant={PR_STATUS_MAP[selectedPR.status]?.color as "success" | "warning" | "danger" | "info" | "default"}>
                    {PR_STATUS_MAP[selectedPR.status]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">申请人</p>
                  <p>{selectedPR.requestedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">需求日期</p>
                  <p>{selectedPR.requiredDate}</p>
                </div>
              </div>

              {selectedPR.relatedWoNo && (
                <div>
                  <p className="text-xs text-slate-500">关联生产工单</p>
                  <p className="font-mono text-sm text-blue-600">{selectedPR.relatedWoNo}</p>
                </div>
              )}

              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">申请总额</span>
                  <span className="text-xl font-bold">{formatCurrency(selectedPR.totalAmount)}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {selectedPR.totalAmount < 5000
                    ? "审批流：部门主管"
                    : selectedPR.totalAmount < 50000
                    ? "审批流：部门主管 → 财务"
                    : "审批流：部门主管 → 财务 → 总经理"}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">物料明细</h4>
                <div className="space-y-3">
                  {selectedPR.items.map((item, i) => (
                    <div key={i} className="rounded-lg border border-slate-100 p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-xs text-slate-600">{item.materialCode}</p>
                          <p className="text-sm">{item.materialName}</p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.lineAmount)}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                        <span>需求: {item.requiredQty}</span>
                        <span>现有: {item.currentStock}</span>
                        <span>建议采购: {item.suggestedQty}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New PR Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">新建采购申请</h3>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">申请类型</label>
                  <Select defaultValue="manual">
                    <option value="manual">手工申请</option>
                    <option value="safety_stock">安全库存</option>
                    <option value="mrp">MRP需求</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">需求日期</label>
                  <Input type="date" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">物料明细</label>
                  <Button variant="outline" size="sm"><Plus className="mr-1 h-3 w-3" />添加物料</Button>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 text-center">
                  点击&ldquo;添加物料&rdquo;选择需要采购的物料
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
                <textarea rows={2} placeholder="采购原因说明..." className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>取消</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>保存草稿</Button>
              <Button onClick={() => setShowForm(false)}>提交审批</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
