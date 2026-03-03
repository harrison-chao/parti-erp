"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Search, ChevronRight } from "lucide-react";

const DEMO_PRODUCTS = [
  {
    id: "1",
    baseModel: "C-MR-2525-8",
    name: "25×25功能管-8mm槽",
    series: "C",
    category: "铝管功能款",
    spec: "25×25mm",
    variants: [
      { sku: "C-MR-2525-8-A-SV", surface: "太空银 (阳极)", preprocess: "-", price: 45 },
      { sku: "C-MR-2525-8-A-GY", surface: "太空灰 (阳极)", preprocess: "-", price: 45 },
      { sku: "C-MR-2525-8-A-BK", surface: "曜石黑 (阳极)", preprocess: "-", price: 48 },
      { sku: "C-MR-2525-8-A-SV-L600MM-DE", surface: "太空银 (阳极)", preprocess: "L600MM + 钻孔 + 预埋", price: 68 },
      { sku: "C-MR-2525-8-A-GY-L800MM-DE", surface: "太空灰 (阳极)", preprocess: "L800MM + 钻孔 + 预埋", price: 85 },
    ],
  },
  {
    id: "2",
    baseModel: "C-MR-2525-9",
    name: "25×25功能管-9mm槽",
    series: "C",
    category: "铝管功能款",
    spec: "25×25mm",
    variants: [
      { sku: "C-MR-2525-9-A-RG", surface: "玫瑰金 (阳极)", preprocess: "-", price: 50 },
      { sku: "C-MR-2525-9-A-RG-L500MM-D", surface: "玫瑰金 (阳极)", preprocess: "L500MM + 钻孔", price: 92 },
    ],
  },
  {
    id: "3",
    baseModel: "C-MR-5050",
    name: "50×50功能管",
    series: "C",
    category: "铝管功能款",
    spec: "50×50mm",
    variants: [
      { sku: "C-MR-5050-A-BK", surface: "曜石黑 (阳极)", preprocess: "-", price: 120 },
      { sku: "C-MR-5050-A-BK-L1200MM-D", surface: "曜石黑 (阳极)", preprocess: "L1200MM + 钻孔", price: 280 },
    ],
  },
  {
    id: "4",
    baseModel: "C-OL-2525",
    name: "25×25六通标准款",
    series: "C",
    category: "六通标准款",
    spec: "25×25mm",
    variants: [
      { sku: "C-OL-2525-A-SV", surface: "太空银 (阳极)", preprocess: "-", price: 45 },
      { sku: "C-OL-2525-A-GY", surface: "太空灰 (阳极)", preprocess: "-", price: 45 },
      { sku: "C-OL-2525-A-BK", surface: "曜石黑 (阳极)", preprocess: "-", price: 48 },
    ],
  },
  {
    id: "5",
    baseModel: "C-OL-5050/C",
    name: "50×50六通异形C",
    series: "C",
    category: "六通异形款",
    spec: "50×50mm",
    variants: [
      { sku: "C-OL-5050/C-A-BK", surface: "曜石黑 (阳极)", preprocess: "-", price: 145 },
      { sku: "C-OL-5050/C-A-SV", surface: "太空银 (阳极)", preprocess: "-", price: 145 },
    ],
  },
  {
    id: "6",
    baseModel: "C-OL-7575/C",
    name: "75×75六通异形C",
    series: "C",
    category: "六通异形款",
    spec: "75×75mm",
    variants: [
      { sku: "C-OL-7575/C-A-RG", surface: "玫瑰金 (阳极)", preprocess: "-", price: 320 },
    ],
  },
  {
    id: "7",
    baseModel: "C-Q2525",
    name: "25×25方管",
    series: "C",
    category: "铝管方管",
    spec: "25×25mm",
    variants: [
      { sku: "C-Q2525-A-GY-L600MM", surface: "太空灰 (阳极)", preprocess: "L600MM", price: 70 },
    ],
  },
  {
    id: "8",
    baseModel: "H-MR-2020",
    name: "20×20功能管",
    series: "H",
    category: "铝管功能款",
    spec: "20×20mm",
    variants: [
      { sku: "H-MR-2020-A-SV", surface: "太空银 (阳极)", preprocess: "-", price: 28 },
      { sku: "H-MR-2020-A-SV-L400MM", surface: "太空银 (阳极)", preprocess: "L400MM", price: 35 },
    ],
  },
  {
    id: "9",
    baseModel: "H-OL-2020",
    name: "20×20六通",
    series: "H",
    category: "六通标准款",
    spec: "20×20mm",
    variants: [
      { sku: "H-OL-2020-A-SV", surface: "太空银 (阳极)", preprocess: "-", price: 40 },
    ],
  },
  {
    id: "10",
    baseModel: "LY15/MR2525/9",
    name: "层板托",
    series: "C",
    category: "功能五金",
    spec: "适配MR2525/9",
    variants: [
      { sku: "LY15/MR2525/9-A-RG", surface: "玫瑰金 (阳极)", preprocess: "-", price: 50.5 },
      { sku: "LY15/MR2525/9-A-SV", surface: "太空银 (阳极)", preprocess: "-", price: 48 },
    ],
  },
];

const SERIES_MAP = {
  C: { label: "商用", color: "info" as const },
  H: { label: "家用", color: "success" as const },
};

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [seriesFilter, setSeriesFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = [...new Set(DEMO_PRODUCTS.map((p) => p.category))];

  const filtered = DEMO_PRODUCTS.filter((p) => {
    const matchSearch =
      !search ||
      p.baseModel.toLowerCase().includes(search.toLowerCase()) ||
      p.name.includes(search) ||
      p.variants.some((v) => v.sku.toLowerCase().includes(search.toLowerCase()));
    const matchSeries = !seriesFilter || p.series === seriesFilter;
    const matchCategory = !categoryFilter || p.category === categoryFilter;
    return matchSearch && matchSeries && matchCategory;
  });

  const totalVariants = DEMO_PRODUCTS.reduce((sum, p) => sum + p.variants.length, 0);

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜索型号、名称、SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-72"
            />
          </div>
          <Select value={seriesFilter} onChange={(e) => setSeriesFilter(e.target.value)} className="w-28">
            <option value="">全部系列</option>
            <option value="C">商用 C</option>
            <option value="H">家用 H</option>
          </Select>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-36">
            <option value="">全部类别</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">基础型号</p>
            <p className="text-2xl font-bold">{DEMO_PRODUCTS.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">SKU 变体</p>
            <p className="text-2xl font-bold">{totalVariants}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">商用系列</p>
            <p className="text-2xl font-bold text-blue-600">{DEMO_PRODUCTS.filter((p) => p.series === "C").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">家用系列</p>
            <p className="text-2xl font-bold text-emerald-600">{DEMO_PRODUCTS.filter((p) => p.series === "H").length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Product List */}
      <div className="space-y-3">
        {filtered.map((product) => {
          const isExpanded = expandedId === product.id;
          const seriesInfo = SERIES_MAP[product.series as keyof typeof SERIES_MAP];
          return (
            <Card key={product.id} className="overflow-hidden">
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : product.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-600">
                    {product.spec.split("×")[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-slate-900">{product.baseModel}</span>
                      <Badge variant={seriesInfo.color}>{seriesInfo.label}</Badge>
                      <span className="text-xs text-slate-400">{product.category}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{product.name} · {product.spec}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">{product.variants.length} 个变体</span>
                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>
              </div>

              {isExpanded && (
                <div className="border-t bg-slate-50/50 px-5 pb-4">
                  <table className="w-full text-sm mt-3">
                    <thead>
                      <tr className="text-left">
                        <th className="pb-2 font-medium text-slate-500 text-xs">完整 SKU</th>
                        <th className="pb-2 font-medium text-slate-500 text-xs">表面处理</th>
                        <th className="pb-2 font-medium text-slate-500 text-xs">预加工</th>
                        <th className="pb-2 font-medium text-slate-500 text-xs text-right">单价 (¥)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((v) => (
                        <tr key={v.sku} className="border-t border-slate-100">
                          <td className="py-2.5 font-mono text-xs text-blue-600">{v.sku}</td>
                          <td className="py-2.5 text-slate-700">{v.surface}</td>
                          <td className="py-2.5 text-slate-500">{v.preprocess}</td>
                          <td className="py-2.5 text-right font-mono font-medium">¥{v.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
