"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

const titleMap: Record<string, string> = {
  "/": "工作台",
  "/dealers": "经销商管理",
  "/sales-orders": "销售订单",
  "/production": "生产委托",
  "/purchase": "采购申请",
  "/goods-receipt": "入库管理",
  "/inventory": "库存管理",
  "/products": "产品管理",
};

function getTitle(pathname: string): string {
  if (titleMap[pathname]) return titleMap[pathname];
  for (const [key, value] of Object.entries(titleMap)) {
    if (key !== "/" && pathname.startsWith(key)) return value;
  }
  return "Parti ERP";
}

export function Header() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索订单、经销商..."
            className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            3
          </span>
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-medium text-white">
          管
        </div>
      </div>
    </header>
  );
}
