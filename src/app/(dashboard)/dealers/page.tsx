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
  Edit,
  Eye,
  Phone,
  Mail,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Demo data
const DEMO_DEALERS = [
  {
    id: "1",
    dealerId: "PARTI-D-0001",
    companyName: "深圳创客空间科技有限公司",
    contactPerson: "张伟",
    contactPhone: "13800138001",
    contactEmail: "zhangwei@maker.com",
    priceTier: "A" as const,
    creditLimit: 100000,
    creditBalance: 35000,
    settlementMethod: "credit" as const,
    isActive: true,
  },
  {
    id: "2",
    dealerId: "PARTI-D-0002",
    companyName: "广州铝材贸易有限公司",
    contactPerson: "李娜",
    contactPhone: "13900139002",
    contactEmail: "lina@gzalu.com",
    priceTier: "B" as const,
    creditLimit: 50000,
    creditBalance: 12000,
    settlementMethod: "deposit" as const,
    isActive: true,
  },
  {
    id: "3",
    dealerId: "PARTI-D-0003",
    companyName: "东莞DIY工坊",
    contactPerson: "王强",
    contactPhone: "13700137003",
    contactEmail: "wangqiang@diyworkshop.com",
    priceTier: "B" as const,
    creditLimit: 30000,
    creditBalance: 30000,
    settlementMethod: "prepaid" as const,
    isActive: true,
  },
  {
    id: "4",
    dealerId: "PARTI-D-0004",
    companyName: "佛山五金城批发部",
    contactPerson: "陈明",
    contactPhone: "13600136004",
    contactEmail: "chenming@fshw.com",
    priceTier: "A" as const,
    creditLimit: 200000,
    creditBalance: 85000,
    settlementMethod: "credit" as const,
    isActive: true,
  },
  {
    id: "5",
    dealerId: "PARTI-D-0005",
    companyName: "上海家居定制中心",
    contactPerson: "刘芳",
    contactPhone: "13500135005",
    contactEmail: "liufang@shjj.com",
    priceTier: "C" as const,
    creditLimit: 20000,
    creditBalance: 20000,
    settlementMethod: "prepaid" as const,
    isActive: false,
  },
];

const TIER_MAP = {
  A: { label: "A级", variant: "success" as const },
  B: { label: "B级", variant: "info" as const },
  C: { label: "C级", variant: "default" as const },
};

const SETTLEMENT_MAP = {
  prepaid: "预付",
  deposit: "定金",
  credit: "账期",
};

type Dealer = (typeof DEMO_DEALERS)[number];

export default function DealersPage() {
  const [dealers] = useState(DEMO_DEALERS);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);

  const filtered = dealers.filter((d) => {
    const matchSearch =
      !search ||
      d.companyName.includes(search) ||
      d.dealerId.includes(search) ||
      d.contactPerson.includes(search);
    const matchTier = !tierFilter || d.priceTier === tierFilter;
    return matchSearch && matchTier;
  });

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜索公司名称、编号、联系人..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-72"
            />
          </div>
          <Select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="w-32"
          >
            <option value="">全部等级</option>
            <option value="A">A级</option>
            <option value="B">B级</option>
            <option value="C">C级</option>
          </Select>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新增经销商
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">经销商总数</p>
            <p className="text-2xl font-bold">{dealers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">A级客户</p>
            <p className="text-2xl font-bold">
              {dealers.filter((d) => d.priceTier === "A").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">总授信额度</p>
            <p className="text-2xl font-bold">
              {formatCurrency(
                dealers.reduce((sum, d) => sum + d.creditLimit, 0)
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">已用额度</p>
            <p className="text-2xl font-bold">
              {formatCurrency(
                dealers.reduce(
                  (sum, d) => sum + (d.creditLimit - d.creditBalance),
                  0
                )
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dealer List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            经销商列表（{filtered.length}）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    编号
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    公司名称
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    联系人
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    等级
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    结算方式
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">
                    授信额度
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">
                    可用额度
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    状态
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((dealer) => (
                  <tr
                    key={dealer.id}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {dealer.dealerId}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {dealer.companyName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{dealer.contactPerson}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={TIER_MAP[dealer.priceTier].variant}>
                        {TIER_MAP[dealer.priceTier].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {SETTLEMENT_MAP[dealer.settlementMethod]}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(dealer.creditLimit)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(dealer.creditBalance)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={dealer.isActive ? "success" : "default"}
                      >
                        {dealer.isActive ? "启用" : "停用"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedDealer(dealer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* New Dealer Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">新增经销商</h3>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    公司名称 *
                  </label>
                  <Input placeholder="请输入公司全称" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    联系人 *
                  </label>
                  <Input placeholder="联系人姓名" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    联系电话
                  </label>
                  <Input placeholder="手机号码" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    邮箱
                  </label>
                  <Input placeholder="电子邮箱" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    价格等级
                  </label>
                  <Select defaultValue="C">
                    <option value="A">A级</option>
                    <option value="B">B级</option>
                    <option value="C">C级</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    结算方式
                  </label>
                  <Select defaultValue="prepaid">
                    <option value="prepaid">预付</option>
                    <option value="deposit">定金</option>
                    <option value="credit">账期</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    授信额度
                  </label>
                  <Input type="number" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  备注
                </label>
                <textarea
                  rows={2}
                  placeholder="备注信息..."
                  className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                取消
              </Button>
              <Button onClick={() => setShowForm(false)}>保存</Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selectedDealer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white p-6">
              <h3 className="text-lg font-semibold">经销商详情</h3>
              <button
                onClick={() => setSelectedDealer(null)}
                className="rounded-lg p-1 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">编号</p>
                <p className="font-mono text-sm">{selectedDealer.dealerId}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">公司名称</p>
                <p className="font-medium">{selectedDealer.companyName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">联系人</p>
                  <p>{selectedDealer.contactPerson}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">价格等级</p>
                  <Badge
                    variant={TIER_MAP[selectedDealer.priceTier].variant}
                  >
                    {TIER_MAP[selectedDealer.priceTier].label}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="h-4 w-4" />
                  {selectedDealer.contactPhone}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="h-4 w-4" />
                  {selectedDealer.contactEmail}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 space-y-3">
                <p className="text-sm font-medium text-slate-700">财务信息</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">结算方式</p>
                    <p className="font-medium">
                      {SETTLEMENT_MAP[selectedDealer.settlementMethod]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">授信额度</p>
                    <p className="font-medium font-mono">
                      {formatCurrency(selectedDealer.creditLimit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">可用额度</p>
                    <p className="font-medium font-mono">
                      {formatCurrency(selectedDealer.creditBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">已用额度</p>
                    <p className="font-medium font-mono">
                      {formatCurrency(
                        selectedDealer.creditLimit -
                          selectedDealer.creditBalance
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
