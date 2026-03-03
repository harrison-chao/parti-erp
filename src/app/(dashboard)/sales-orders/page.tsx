"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Plus,
  Search,
  Eye,
  Truck,
  CheckCircle,
  X,
} from "lucide-react";
import { formatCurrency, SO_STATUS_MAP, PAYMENT_STATUS_MAP } from "@/lib/utils";

const DEMO_ORDERS = [
  {
    id: "1",
    orderNo: "SO-20240301-0001",
    dealerName: "深圳创客空间科技有限公司",
    orderDate: "2024-03-01",
    targetDeliveryDate: "2024-03-08",
    actualDeliveryDate: null,
    paymentStatus: "credit",
    status: "pending",
    totalAmount: 15800,
    paidAmount: 0,
    trackingNo: null,
    items: [
      { sku: "C-MR-2525-8-A-SV-L600MM-DE", name: "25×25功能管 太空银 600mm 钻孔预埋", qty: 100, unitPrice: 68, lineAmount: 6800 },
      { sku: "C-OL-2525-A-SV", name: "25×25六通 太空银", qty: 200, unitPrice: 45, lineAmount: 9000 },
    ],
  },
  {
    id: "2",
    orderNo: "SO-20240228-0003",
    dealerName: "广州铝材贸易有限公司",
    orderDate: "2024-02-28",
    targetDeliveryDate: "2024-03-05",
    actualDeliveryDate: null,
    paymentStatus: "paid",
    status: "producing",
    totalAmount: 28500,
    paidAmount: 28500,
    items: [
      { sku: "C-MR-5050-A-BK-L1200MM-D", name: "50×50功能管 曜石黑 1200mm 钻孔", qty: 50, unitPrice: 280, lineAmount: 14000 },
      { sku: "C-OL-5050/C-A-BK", name: "50×50六通异形 曜石黑", qty: 100, unitPrice: 145, lineAmount: 14500 },
    ],
  },
  {
    id: "3",
    orderNo: "SO-20240228-0002",
    dealerName: "东莞DIY工坊",
    orderDate: "2024-02-28",
    targetDeliveryDate: "2024-03-04",
    actualDeliveryDate: null,
    paymentStatus: "paid",
    status: "ready",
    totalAmount: 9200,
    paidAmount: 9200,
    items: [
      { sku: "H-MR-2020-A-SV-L400MM", name: "20×20功能管 太空银 400mm", qty: 80, unitPrice: 35, lineAmount: 2800 },
      { sku: "H-OL-2020-A-SV", name: "20×20六通 太空银", qty: 160, unitPrice: 40, lineAmount: 6400 },
    ],
  },
  {
    id: "4",
    orderNo: "SO-20240227-0005",
    dealerName: "佛山五金城批发部",
    orderDate: "2024-02-27",
    targetDeliveryDate: "2024-03-03",
    actualDeliveryDate: "2024-03-02",
    paymentStatus: "credit",
    status: "shipped",
    totalAmount: 45000,
    paidAmount: 0,
    trackingNo: "SF1234567890",
    items: [
      { sku: "C-MR-2525-8-A-GY-L800MM-DE", name: "25×25功能管 太空灰 800mm 钻孔预埋", qty: 300, unitPrice: 85, lineAmount: 25500 },
      { sku: "C-OL-2525-A-GY", name: "25×25六通 太空灰", qty: 200, unitPrice: 45, lineAmount: 9000 },
      { sku: "C-Q2525-A-GY-L600MM", name: "25×25方管 太空灰 600mm", qty: 150, unitPrice: 70, lineAmount: 10500 },
    ],
  },
  {
    id: "5",
    orderNo: "SO-20240227-0004",
    dealerName: "上海家居定制中心",
    orderDate: "2024-02-27",
    targetDeliveryDate: "2024-03-06",
    actualDeliveryDate: "2024-03-05",
    paymentStatus: "paid",
    status: "completed",
    totalAmount: 32100,
    paidAmount: 32100,
    items: [
      { sku: "C-MR-2525-9-A-RG-L500MM-D", name: "25×25功能管-9 玫瑰金 500mm 钻孔", qty: 100, unitPrice: 92, lineAmount: 9200 },
      { sku: "C-OL-7575/C-A-RG", name: "75×75六通异形C 玫瑰金", qty: 40, unitPrice: 320, lineAmount: 12800 },
      { sku: "LY15/MR2525/9-A-RG", name: "层板托 玫瑰金", qty: 200, unitPrice: 50.5, lineAmount: 10100 },
    ],
  },
];

type Order = (typeof DEMO_ORDERS)[number];

export default function SalesOrdersPage() {
  const [orders] = useState(DEMO_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.orderNo.includes(search) ||
      o.dealerName.includes(search);
    const matchStatus = !statusFilter || o.status === statusFilter;
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
              placeholder="搜索订单号、经销商..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-72"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-32"
          >
            <option value="">全部状态</option>
            <option value="pending">待审核</option>
            <option value="confirmed">已确认</option>
            <option value="producing">生产中</option>
            <option value="ready">待发货</option>
            <option value="shipped">已发货</option>
            <option value="completed">已完成</option>
          </Select>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新建订单
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: "待审核", count: orders.filter((o) => o.status === "pending").length, color: "text-amber-600" },
          { label: "生产中", count: orders.filter((o) => o.status === "producing").length, color: "text-blue-600" },
          { label: "待发货", count: orders.filter((o) => o.status === "ready").length, color: "text-indigo-600" },
          { label: "已发货", count: orders.filter((o) => o.status === "shipped").length, color: "text-emerald-600" },
          { label: "本月总额", count: formatCurrency(orders.reduce((s, o) => s + o.totalAmount, 0)), color: "text-slate-900", isAmount: true },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>
                {typeof s.count === "number" ? s.count : s.count}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">销售订单（{filtered.length}）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">订单号</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">经销商</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">下单日期</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">目标交期</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">金额</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">付款</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">状态</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const soStatus = SO_STATUS_MAP[order.status];
                  const payStatus = PAYMENT_STATUS_MAP[order.paymentStatus];
                  return (
                    <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-blue-600">{order.orderNo}</td>
                      <td className="px-4 py-3 text-slate-900">{order.dealerName}</td>
                      <td className="px-4 py-3 text-slate-600">{order.orderDate}</td>
                      <td className="px-4 py-3 text-slate-600">{order.targetDeliveryDate}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={payStatus?.color as "success" | "warning" | "danger" | "info" | "default"}>
                          {payStatus?.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={soStatus?.color as "success" | "warning" | "danger" | "info" | "default"}>
                          {soStatus?.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === "pending" && (
                            <Button variant="ghost" size="icon" title="审核">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            </Button>
                          )}
                          {order.status === "ready" && (
                            <Button variant="ghost" size="icon" title="发货">
                              <Truck className="h-4 w-4 text-blue-600" />
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

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white p-6">
              <div>
                <h3 className="text-lg font-semibold">订单详情</h3>
                <p className="text-sm text-slate-500 font-mono">{selectedOrder.orderNo}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">经销商</p>
                  <p className="font-medium">{selectedOrder.dealerName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">状态</p>
                  <Badge variant={SO_STATUS_MAP[selectedOrder.status]?.color as "success" | "warning" | "danger" | "info" | "default"}>
                    {SO_STATUS_MAP[selectedOrder.status]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">下单日期</p>
                  <p>{selectedOrder.orderDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">目标交期</p>
                  <p>{selectedOrder.targetDeliveryDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">付款状态</p>
                  <Badge variant={PAYMENT_STATUS_MAP[selectedOrder.paymentStatus]?.color as "success" | "warning" | "danger" | "info" | "default"}>
                    {PAYMENT_STATUS_MAP[selectedOrder.paymentStatus]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">物流单号</p>
                  <p className="font-mono text-sm">{selectedOrder.trackingNo || "-"}</p>
                </div>
              </div>

              {/* Amount Summary */}
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">订单总额</span>
                  <span className="text-xl font-bold">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-slate-600">已付金额</span>
                  <span className="font-mono">{formatCurrency(selectedOrder.paidAmount)}</span>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">订单明细</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="rounded-lg border border-slate-100 p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-xs text-blue-600">{item.sku}</p>
                          <p className="text-sm mt-0.5">{item.name}</p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.lineAmount)}</p>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-slate-500">
                        <span>数量: {item.qty}</span>
                        <span>单价: {formatCurrency(item.unitPrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[80vh] rounded-2xl bg-white p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">新建销售订单</h3>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">经销商 *</label>
                  <Select>
                    <option value="">选择经销商</option>
                    <option value="1">深圳创客空间科技有限公司</option>
                    <option value="2">广州铝材贸易有限公司</option>
                    <option value="3">东莞DIY工坊</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">目标交期 *</label>
                  <Input type="date" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">收货信息</label>
                <div className="grid grid-cols-3 gap-4">
                  <Input placeholder="收货人" />
                  <Input placeholder="联系电话" />
                  <Input placeholder="收货地址" className="col-span-1" />
                </div>
              </div>

              {/* Product lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">订单明细</label>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-1 h-3 w-3" />
                    添加产品
                  </Button>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 text-center">
                  点击&ldquo;添加产品&rdquo;选择 SKU 和数量
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
                <textarea
                  rows={2}
                  placeholder="订单备注..."
                  className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>取消</Button>
              <Button onClick={() => setShowForm(false)}>提交订单</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
