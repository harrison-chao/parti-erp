"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Search,
  AlertTriangle,
  History,
} from "lucide-react";

const DEMO_INVENTORY = [
  {
    id: "1",
    itemCode: "RAW-AL6063-25-6M",
    name: "6063铝型材 25×25 6米/支",
    materialType: "raw",
    warehouse: "原料仓",
    location: "A-01-01",
    batchNo: "LOT-AL6063-20240225-001",
    qtyOnHand: 120,
    qtyAvailable: 85,
    qtyReserved: 35,
    qtyInTransit: 50,
    qtyWip: 0,
    safetyStock: 100,
    maxStock: 500,
    unit: "支",
    lastMovement: "2024-03-01",
    alert: null as string | null,
  },
  {
    id: "2",
    itemCode: "RAW-AL6063-50-6M",
    name: "6063铝型材 50×50 6米/支",
    materialType: "raw",
    warehouse: "原料仓",
    location: "A-02-01",
    batchNo: "LOT-AL6063-50-20240220-003",
    qtyOnHand: 8,
    qtyAvailable: 3,
    qtyReserved: 5,
    qtyInTransit: 100,
    qtyWip: 0,
    safetyStock: 30,
    maxStock: 200,
    unit: "支",
    lastMovement: "2024-02-28",
    alert: "low_stock",
  },
  {
    id: "3",
    itemCode: "C-MR-2525-8-A-SV-L600MM-DE",
    name: "25×25功能管 太空银 600mm 钻孔预埋",
    materialType: "finished",
    warehouse: "成品仓",
    location: "C-01-03",
    batchNo: null,
    qtyOnHand: 45,
    qtyAvailable: 45,
    qtyReserved: 0,
    qtyInTransit: 0,
    qtyWip: 100,
    safetyStock: 50,
    maxStock: 300,
    unit: "件",
    lastMovement: "2024-02-27",
    alert: "low_stock",
  },
  {
    id: "4",
    itemCode: "C-OL-2525-A-SV",
    name: "25×25六通 太空银",
    materialType: "finished",
    warehouse: "成品仓",
    location: "C-02-01",
    batchNo: null,
    qtyOnHand: 380,
    qtyAvailable: 180,
    qtyReserved: 200,
    qtyInTransit: 0,
    qtyWip: 200,
    safetyStock: 100,
    maxStock: 600,
    unit: "件",
    lastMovement: "2024-03-01",
    alert: null,
  },
  {
    id: "5",
    itemCode: "HW-CONN-M6",
    name: "M6预埋连接件",
    materialType: "raw",
    warehouse: "五金仓",
    location: "B-01-02",
    batchNo: "LOT-HW-20240210-008",
    qtyOnHand: 1200,
    qtyAvailable: 1000,
    qtyReserved: 200,
    qtyInTransit: 0,
    qtyWip: 0,
    safetyStock: 500,
    maxStock: 3000,
    unit: "件",
    lastMovement: "2024-02-25",
    alert: null,
  },
  {
    id: "6",
    itemCode: "RAW-AL6063-20-6M",
    name: "6063铝型材 20×20 6米/支",
    materialType: "raw",
    warehouse: "原料仓",
    location: "A-03-01",
    batchNo: "LOT-AL6063-20-20240222-002",
    qtyOnHand: 15,
    qtyAvailable: 10,
    qtyReserved: 5,
    qtyInTransit: 80,
    qtyWip: 0,
    safetyStock: 50,
    maxStock: 300,
    unit: "支",
    lastMovement: "2024-02-28",
    alert: "low_stock",
  },
  {
    id: "7",
    itemCode: "C-MR-5050-A-BK-L1200MM-D",
    name: "50×50功能管 曜石黑 1200mm 钻孔",
    materialType: "finished",
    warehouse: "成品仓",
    location: "C-03-02",
    batchNo: null,
    qtyOnHand: 0,
    qtyAvailable: 0,
    qtyReserved: 0,
    qtyInTransit: 0,
    qtyWip: 50,
    safetyStock: 20,
    maxStock: 100,
    unit: "件",
    lastMovement: "2024-02-20",
    alert: "out_of_stock",
  },
  {
    id: "8",
    itemCode: "PKG-BOX-60",
    name: "纸箱 60×30×15cm",
    materialType: "packaging",
    warehouse: "包材仓",
    location: "D-01-01",
    batchNo: null,
    qtyOnHand: 30,
    qtyAvailable: 30,
    qtyReserved: 0,
    qtyInTransit: 200,
    qtyWip: 0,
    safetyStock: 100,
    maxStock: 500,
    unit: "个",
    lastMovement: "2024-02-27",
    alert: "low_stock",
  },
];

const TX_LOG = [
  { id: "1", date: "2024-03-01 14:30", type: "production_issue", itemCode: "RAW-AL6063-25-6M", qty: -35, ref: "WO-20240301-0001-01", operator: "李工" },
  { id: "2", date: "2024-03-01 10:00", type: "purchase_in", itemCode: "HW-CONN-M6", qty: 500, ref: "PO-20240225-0003", operator: "仓管 张姐" },
  { id: "3", date: "2024-02-28 16:45", type: "sales_out", itemCode: "C-OL-2525-A-SV", qty: -200, ref: "SO-20240227-0005", operator: "仓管 张姐" },
  { id: "4", date: "2024-02-28 11:20", type: "production_receipt", itemCode: "C-MR-2525-8-A-SV-L600MM-DE", qty: 45, ref: "WO-20240226-0006-01", operator: "仓管 王哥" },
  { id: "5", date: "2024-02-27 09:30", type: "purchase_in", itemCode: "RAW-AL6063-25-6M", qty: 100, ref: "PO-20240220-0001", operator: "仓管 张姐" },
];

const TX_TYPE_MAP: Record<string, { label: string; color: "success" | "danger" | "info" | "warning" | "default" }> = {
  sales_out: { label: "销售出库", color: "danger" },
  purchase_in: { label: "采购入库", color: "success" },
  production_issue: { label: "生产领料", color: "warning" },
  production_receipt: { label: "生产入库", color: "info" },
  adjustment: { label: "盘点调整", color: "default" },
  transfer: { label: "调拨", color: "default" },
};

const MAT_TYPE_MAP: Record<string, { label: string; color: "success" | "info" | "warning" | "default" }> = {
  raw: { label: "原料", color: "default" },
  semi_finished: { label: "半成品", color: "warning" },
  finished: { label: "成品", color: "success" },
  packaging: { label: "包材", color: "info" },
};

export default function InventoryPage() {
  const [inventory] = useState(DEMO_INVENTORY);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [alertOnly, setAlertOnly] = useState(false);
  const [showTxLog, setShowTxLog] = useState(false);

  const filtered = inventory.filter((item) => {
    const matchSearch =
      !search ||
      item.itemCode.toLowerCase().includes(search.toLowerCase()) ||
      item.name.includes(search);
    const matchType = !typeFilter || item.materialType === typeFilter;
    const matchAlert = !alertOnly || item.alert !== null;
    return matchSearch && matchType && matchAlert;
  });

  const alertCount = inventory.filter((i) => i.alert).length;
  const outOfStockCount = inventory.filter((i) => i.alert === "out_of_stock").length;

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜索物料编码、名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-72"
            />
          </div>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-32">
            <option value="">全部类型</option>
            <option value="raw">原料</option>
            <option value="semi_finished">半成品</option>
            <option value="finished">成品</option>
            <option value="packaging">包材</option>
          </Select>
          <Button
            variant={alertOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setAlertOnly(!alertOnly)}
          >
            <AlertTriangle className="mr-1 h-3.5 w-3.5" />
            预警 ({alertCount})
          </Button>
        </div>
        <Button variant="outline" onClick={() => setShowTxLog(!showTxLog)}>
          <History className="mr-2 h-4 w-4" />
          {showTxLog ? "返回库存" : "事务日志"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">SKU 总数</p>
            <p className="text-2xl font-bold">{inventory.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">原料品种</p>
            <p className="text-2xl font-bold">{inventory.filter((i) => i.materialType === "raw").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">成品品种</p>
            <p className="text-2xl font-bold">{inventory.filter((i) => i.materialType === "finished").length}</p>
          </CardContent>
        </Card>
        <Card className={alertCount > 0 ? "border-amber-200 bg-amber-50/50" : ""}>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">库存预警</p>
            <p className="text-2xl font-bold text-amber-600">{alertCount}</p>
          </CardContent>
        </Card>
        <Card className={outOfStockCount > 0 ? "border-red-200 bg-red-50/50" : ""}>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">缺货</p>
            <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
          </CardContent>
        </Card>
      </div>

      {showTxLog ? (
        /* Transaction Log */
        <Card>
          <CardHeader>
            <CardTitle className="text-base">库存事务日志</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-left font-medium text-slate-500">时间</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">类型</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">物料编码</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">数量</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">关联单号</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">操作人</th>
                  </tr>
                </thead>
                <tbody>
                  {TX_LOG.map((tx) => {
                    const txInfo = TX_TYPE_MAP[tx.type];
                    return (
                      <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600 text-xs">{tx.date}</td>
                        <td className="px-4 py-3"><Badge variant={txInfo?.color}>{txInfo?.label}</Badge></td>
                        <td className="px-4 py-3 font-mono text-xs">{tx.itemCode}</td>
                        <td className={`px-4 py-3 text-right font-mono font-medium ${tx.qty > 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {tx.qty > 0 ? `+${tx.qty}` : tx.qty}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-blue-600">{tx.ref}</td>
                        <td className="px-4 py-3 text-slate-600">{tx.operator}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Inventory Table */
        <Card>
          <CardHeader>
            <CardTitle className="text-base">库存总览（{filtered.length}）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-3 py-3 text-left font-medium text-slate-500">物料编码</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-500">名称</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-500">类型</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-500">仓库/库位</th>
                    <th className="px-3 py-3 text-right font-medium text-slate-500">在库</th>
                    <th className="px-3 py-3 text-right font-medium text-slate-500">可用</th>
                    <th className="px-3 py-3 text-right font-medium text-slate-500">预留</th>
                    <th className="px-3 py-3 text-right font-medium text-slate-500">在途</th>
                    <th className="px-3 py-3 text-right font-medium text-slate-500">在制</th>
                    <th className="px-3 py-3 text-right font-medium text-slate-500">安全库存</th>
                    <th className="px-3 py-3 text-left font-medium text-slate-500">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const matInfo = MAT_TYPE_MAP[item.materialType];
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                          item.alert === "out_of_stock"
                            ? "bg-red-50/50"
                            : item.alert === "low_stock"
                            ? "bg-amber-50/30"
                            : ""
                        }`}
                      >
                        <td className="px-3 py-3 font-mono text-xs text-slate-700">{item.itemCode}</td>
                        <td className="px-3 py-3 text-slate-900 max-w-[200px] truncate">{item.name}</td>
                        <td className="px-3 py-3"><Badge variant={matInfo.color}>{matInfo.label}</Badge></td>
                        <td className="px-3 py-3 text-xs text-slate-600">
                          {item.warehouse}<br />
                          <span className="font-mono text-slate-400">{item.location}</span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono">{item.qtyOnHand}</td>
                        <td className="px-3 py-3 text-right font-mono font-medium">{item.qtyAvailable}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-500">{item.qtyReserved || "-"}</td>
                        <td className="px-3 py-3 text-right font-mono text-blue-600">{item.qtyInTransit || "-"}</td>
                        <td className="px-3 py-3 text-right font-mono text-indigo-600">{item.qtyWip || "-"}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-400">{item.safetyStock}</td>
                        <td className="px-3 py-3">
                          {item.alert === "out_of_stock" && (
                            <Badge variant="danger">缺货</Badge>
                          )}
                          {item.alert === "low_stock" && (
                            <Badge variant="warning">低于安全库存</Badge>
                          )}
                          {!item.alert && (
                            <Badge variant="success">正常</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
