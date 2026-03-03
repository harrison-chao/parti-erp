"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Plus, Search, Eye, X, CheckCircle } from "lucide-react";

const GR_TYPE_MAP: Record<string, { label: string; color: "success" | "info" | "warning" | "default" }> = {
  purchase: { label: "采购入库", color: "success" },
  return: { label: "退货入库", color: "warning" },
  transfer: { label: "调拨入库", color: "info" },
  wo_finish: { label: "生产完工", color: "default" },
};

const QC_MAP: Record<string, { label: string; color: "success" | "danger" | "warning" }> = {
  pass: { label: "合格", color: "success" },
  reject: { label: "不合格", color: "danger" },
  inspect: { label: "待检", color: "warning" },
};

const PUTAWAY_MAP: Record<string, string> = {
  pending: "待上架",
  putaway: "上架中",
  completed: "已完成",
};

const DEMO_GR = [
  {
    id: "1",
    grNo: "GR-20240301-0001",
    grType: "purchase",
    relatedDocNo: "PO-20240225-0003",
    supplier: "东莞精密五金有限公司",
    receiptDate: "2024-03-01",
    warehouse: "五金仓",
    receivedBy: "仓管 张姐",
    qcResult: "pass",
    putawayStatus: "completed",
    items: [
      { materialCode: "HW-CONN-M6", name: "M6预埋连接件", batchNo: "LOT-HW-20240301-001", qty: 500, unit: "件" },
      { materialCode: "HW-SCREW-M6x15", name: "M6×15不锈钢螺丝", batchNo: "LOT-HW-20240301-002", qty: 1000, unit: "件" },
    ],
  },
  {
    id: "2",
    grNo: "GR-20240228-0002",
    grType: "wo_finish",
    relatedDocNo: "WO-20240226-0006-01",
    supplier: null,
    receiptDate: "2024-02-28",
    warehouse: "成品仓",
    receivedBy: "仓管 王哥",
    qcResult: "pass",
    putawayStatus: "completed",
    items: [
      { materialCode: "C-MR-2525-8-A-SV-L600MM-DE", name: "25×25功能管 太空银 600mm 钻孔预埋", batchNo: null, qty: 45, unit: "件" },
    ],
  },
  {
    id: "3",
    grNo: "GR-20240228-0003",
    grType: "purchase",
    relatedDocNo: "PO-20240220-0001",
    supplier: "佛山铝业集团",
    receiptDate: "2024-02-28",
    warehouse: "原料仓",
    receivedBy: "仓管 张姐",
    qcResult: "pass",
    putawayStatus: "completed",
    items: [
      { materialCode: "RAW-AL6063-25-6M", name: "6063铝型材 25×25 6米/支", batchNo: "LOT-AL6063-20240228-010", qty: 100, unit: "支" },
    ],
  },
  {
    id: "4",
    grNo: "GR-20240227-0004",
    grType: "return",
    relatedDocNo: "SO-20240215-0012",
    supplier: null,
    receiptDate: "2024-02-27",
    warehouse: "成品仓",
    receivedBy: "仓管 王哥",
    qcResult: "inspect",
    putawayStatus: "pending",
    items: [
      { materialCode: "H-OL-2020-A-SV", name: "20×20六通 太空银", batchNo: null, qty: 10, unit: "件" },
    ],
  },
  {
    id: "5",
    grNo: "GR-20240226-0005",
    grType: "wo_finish",
    relatedDocNo: "WO-20240224-0004-01",
    supplier: null,
    receiptDate: "2024-02-26",
    warehouse: "成品仓",
    receivedBy: "仓管 王哥",
    qcResult: "pass",
    putawayStatus: "completed",
    items: [
      { materialCode: "C-OL-2525-A-GY", name: "25×25六通 太空灰", batchNo: null, qty: 200, unit: "件" },
      { materialCode: "C-MR-2525-8-A-GY-L800MM-DE", name: "25×25功能管 太空灰 800mm 钻孔预埋", batchNo: null, qty: 300, unit: "件" },
    ],
  },
];

type GR = (typeof DEMO_GR)[number];

export default function GoodsReceiptPage() {
  const [receipts] = useState(DEMO_GR);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedGR, setSelectedGR] = useState<GR | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = receipts.filter((gr) => {
    const matchSearch =
      !search ||
      gr.grNo.includes(search) ||
      gr.relatedDocNo.includes(search);
    const matchType = !typeFilter || gr.grType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜索入库单号、关联单号..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-72"
            />
          </div>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-36">
            <option value="">全部类型</option>
            <option value="purchase">采购入库</option>
            <option value="wo_finish">生产完工</option>
            <option value="return">退货入库</option>
            <option value="transfer">调拨入库</option>
          </Select>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新建入库单
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">今日入库</p>
            <p className="text-2xl font-bold">1</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">待上架</p>
            <p className="text-2xl font-bold text-amber-600">
              {receipts.filter((r) => r.putawayStatus === "pending").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">待质检</p>
            <p className="text-2xl font-bold text-indigo-600">
              {receipts.filter((r) => r.qcResult === "inspect").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">本月入库单</p>
            <p className="text-2xl font-bold">{receipts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* GR Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">入库单（{filtered.length}）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">入库单号</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">类型</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">关联单号</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">供应商/来源</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">入库日期</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">仓库</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">质检</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">上架</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((gr) => {
                  const typeInfo = GR_TYPE_MAP[gr.grType];
                  const qcInfo = QC_MAP[gr.qcResult];
                  return (
                    <tr key={gr.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-blue-600">{gr.grNo}</td>
                      <td className="px-4 py-3"><Badge variant={typeInfo.color}>{typeInfo.label}</Badge></td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{gr.relatedDocNo}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{gr.supplier || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{gr.receiptDate}</td>
                      <td className="px-4 py-3 text-slate-600">{gr.warehouse}</td>
                      <td className="px-4 py-3"><Badge variant={qcInfo.color}>{qcInfo.label}</Badge></td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{PUTAWAY_MAP[gr.putawayStatus]}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedGR(gr)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {gr.qcResult === "inspect" && (
                            <Button variant="ghost" size="icon" title="质检">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
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
      {selectedGR && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white p-6">
              <div>
                <h3 className="text-lg font-semibold">入库单详情</h3>
                <p className="text-sm text-slate-500 font-mono">{selectedGR.grNo}</p>
              </div>
              <button onClick={() => setSelectedGR(null)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">入库类型</p>
                  <Badge variant={GR_TYPE_MAP[selectedGR.grType].color}>{GR_TYPE_MAP[selectedGR.grType].label}</Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">质检结果</p>
                  <Badge variant={QC_MAP[selectedGR.qcResult].color}>{QC_MAP[selectedGR.qcResult].label}</Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">关联单号</p>
                  <p className="font-mono text-sm text-blue-600">{selectedGR.relatedDocNo}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">入库日期</p>
                  <p>{selectedGR.receiptDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">目标仓库</p>
                  <p>{selectedGR.warehouse}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">经办人</p>
                  <p>{selectedGR.receivedBy}</p>
                </div>
              </div>
              {selectedGR.supplier && (
                <div>
                  <p className="text-xs text-slate-500">供应商</p>
                  <p>{selectedGR.supplier}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">入库明细</h4>
                <div className="space-y-3">
                  {selectedGR.items.map((item, i) => (
                    <div key={i} className="rounded-lg border border-slate-100 p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-xs text-slate-600">{item.materialCode}</p>
                          <p className="text-sm mt-0.5">{item.name}</p>
                        </div>
                        <p className="font-medium">{item.qty} {item.unit}</p>
                      </div>
                      {item.batchNo && (
                        <p className="text-xs text-slate-400 mt-1 font-mono">批次: {item.batchNo}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New GR Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">新建入库单</h3>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">入库类型 *</label>
                  <Select>
                    <option value="purchase">采购入库</option>
                    <option value="wo_finish">生产完工</option>
                    <option value="return">退货入库</option>
                    <option value="transfer">调拨入库</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">关联单号 *</label>
                  <Input placeholder="PO / WO 单号" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">入库仓库</label>
                  <Select>
                    <option value="">选择仓库</option>
                    <option value="raw">原料仓</option>
                    <option value="parts">五金仓</option>
                    <option value="finished">成品仓</option>
                    <option value="pkg">包材仓</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">入库日期</label>
                  <Input type="date" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">入库明细</label>
                  <Button variant="outline" size="sm"><Plus className="mr-1 h-3 w-3" />添加物料</Button>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 text-center">
                  点击&ldquo;添加物料&rdquo;填写入库物料信息
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>取消</Button>
              <Button onClick={() => setShowForm(false)}>确认入库</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
