"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Plus, Search, Eye, CheckCircle, XCircle, ArrowRight, X, RotateCcw } from "lucide-react";
import { formatCurrency, PR_STATUS_MAP } from "@/lib/utils";
import { 
  getPurchaseRequisitions, 
  getPurchaseRequisition,
  approvePR,
  rejectPR,
  convertPRToPO,
  getPRStats
} from "@/lib/actions/purchase-orders";
import { getSuppliers } from "@/lib/actions/suppliers";

const PR_TYPE_MAP = {
  safety_stock: { label: "安全库存", variant: "info" as const },
  mrp: { label: "MRP需求", variant: "warning" as const },
  manual: { label: "手工申请", variant: "default" as const },
};

interface PRItem {
  id: string;
  prId: string;
  materialId: string | null;
  materialCode: string;
  materialName: string;
  specification: string | null;
  requiredQty: number;
  currentStock: number | null;
  suggestedQty: number;
  unitPrice: string | null;
  lineAmount: string | null;
}

interface PurchaseRequisition {
  id: string;
  prNo: string;
  prType: string;
  requestedBy: string;
  requestDate: string;
  requiredDate: string | null;
  status: string;
  totalAmount: string;
  relatedWoNo: string | null;
  items?: PRItem[];
}

export default function PurchasePage() {
  const [prs, setPRs] = useState<PurchaseRequisition[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPR, setSelectedPR] = useState<PurchaseRequisition | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [prsResult, statsResult] = await Promise.all([
        getPurchaseRequisitions({ limit: 100 }),
        getPRStats(),
      ]);
      
      if (prsResult.success) {
        setPRs(prsResult.data || []);
      }
      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPRDetails(id: string) {
    try {
      const result = await getPurchaseRequisition(id);
      if (result.success) {
        setSelectedPR(result.data || null);
      }
    } catch (error) {
      console.error("Failed to load PR details:", error);
    }
  }

  async function handleApprove(id: string) {
    try {
      setActionLoading(true);
      const result = await approvePR(id);
      if (result.success) {
        console.log("PR approved");
        loadData();
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error("Failed to approve PR:", error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(id: string) {
    try {
      setActionLoading(true);
      const result = await rejectPR(id, "审批拒绝");
      if (result.success) {
        console.log("PR rejected");
        loadData();
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error("Failed to reject PR:", error);
    } finally {
      setActionLoading(false);
    }
  }

  async function openConvertModal(pr: PurchaseRequisition) {
    setSelectedPR(pr);
    setShowConvertModal(true);
    // Load suppliers
    const result = await getSuppliers();
    if (result.success) {
      setSuppliers(result.data || []);
    }
  }

  async function handleConvert() {
    if (!selectedPR || !selectedSupplier) return;
    
    try {
      setActionLoading(true);
      const result = await convertPRToPO(selectedPR.id, selectedSupplier);
      if (result.success) {
        console.log("PR converted to PO");
        setShowConvertModal(false);
        setSelectedSupplier("");
        loadData();
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error("Failed to convert PR:", error);
    } finally {
      setActionLoading(false);
    }
  }

  const filtered = prs.filter((pr) => {
    const matchSearch =
      !search || pr.prNo?.includes(search) || (pr.relatedWoNo && pr.relatedWoNo.includes(search));
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
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
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
            <p className="text-2xl font-bold text-amber-600">{stats?.pending || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">已审批待转单</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.approved || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">待审批金额</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(stats?.totalAmount || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">MRP触发</p>
            <p className="text-2xl font-bold text-indigo-600">
              {prs.filter((p) => p.prType === "mrp").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PR Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">采购申请（{filtered.length}）</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-slate-400">加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">暂无采购申请</div>
          ) : (
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
                    const typeInfo = PR_TYPE_MAP[pr.prType as keyof typeof PR_TYPE_MAP] || PR_TYPE_MAP.manual;
                    return (
                      <tr key={pr.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-blue-600">{pr.prNo}</td>
                        <td className="px-4 py-3"><Badge variant={typeInfo.variant}>{typeInfo.label}</Badge></td>
                        <td className="px-4 py-3 text-slate-600">{pr.requestedBy}</td>
                        <td className="px-4 py-3 text-slate-600">{pr.requestDate}</td>
                        <td className="px-4 py-3 text-slate-600">{pr.requiredDate || "-"}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium">{formatCurrency(Number(pr.totalAmount))}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{pr.relatedWoNo || "-"}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusInfo?.color as "success" | "warning" | "danger" | "info" | "default"}>
                            {statusInfo?.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => loadPRDetails(pr.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {pr.status === "pending" && (
                              <>
                                <Button variant="ghost" size="icon" title="审批通过" onClick={() => handleApprove(pr.id)} disabled={actionLoading}>
                                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                                </Button>
                                <Button variant="ghost" size="icon" title="拒绝" onClick={() => handleReject(pr.id)} disabled={actionLoading}>
                                  <XCircle className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                            {pr.status === "approved" && (
                              <Button variant="ghost" size="icon" title="转采购订单" onClick={() => openConvertModal(pr)} disabled={actionLoading}>
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
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      {selectedPR && !showConvertModal && (
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
                  <Badge variant={PR_TYPE_MAP[selectedPR.prType as keyof typeof PR_TYPE_MAP]?.variant || "default"}>
                    {PR_TYPE_MAP[selectedPR.prType as keyof typeof PR_TYPE_MAP]?.label || selectedPR.prType}
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
                  <p>{selectedPR.requiredDate || "-"}</p>
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
                  <span className="text-xl font-bold">{formatCurrency(Number(selectedPR.totalAmount))}</span>
                </div>
              </div>

              {selectedPR.items && selectedPR.items.length > 0 && (
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
                          <p className="font-medium">{formatCurrency(Number(item.lineAmount) || 0)}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                          <span>需求: {item.requiredQty}</span>
                          <span>现有: {item.currentStock ?? "-"}</span>
                          <span>建议采购: {item.suggestedQty}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Convert to PO Modal */}
      {showConvertModal && selectedPR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">转采购订单</h3>
              <button onClick={() => { setShowConvertModal(false); setSelectedSupplier(""); }} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">选择供应商</label>
                <Select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
                  <option value="">请选择供应商</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} - {s.code}</option>
                  ))}
                </Select>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  将采购申请 <span className="font-mono font-medium">{selectedPR.prNo}</span> 转换为采购订单
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  总金额: {formatCurrency(Number(selectedPR.totalAmount))}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => { setShowConvertModal(false); setSelectedSupplier(""); }}>取消</Button>
              <Button onClick={handleConvert} disabled={!selectedSupplier || actionLoading}>
                {actionLoading ? "处理中..." : "确认转换"}
              </Button>
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
                  点击"添加物料"选择需要采购的物料
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
