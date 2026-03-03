import {
  ShoppingCart,
  Factory,
  AlertTriangle,
  TrendingUp,
  Clock,
  Users,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Demo data — replace with DB queries when Neon is connected
const stats = [
  {
    title: "待审核订单",
    value: "12",
    change: "+3 今日",
    icon: ShoppingCart,
    color: "text-amber-600",
    bg: "bg-amber-50",
    href: "/sales-orders",
  },
  {
    title: "生产中",
    value: "8",
    change: "4 即将到期",
    icon: Factory,
    color: "text-blue-600",
    bg: "bg-blue-50",
    href: "/production",
  },
  {
    title: "库存预警",
    value: "5",
    change: "2 紧急",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
    href: "/inventory",
  },
  {
    title: "待审批采购",
    value: "3",
    change: "¥42,800",
    icon: ClipboardList,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    href: "/purchase",
  },
];

const recentOrders = [
  {
    orderNo: "SO-20240301-0001",
    dealer: "深圳创客空间",
    amount: "¥15,800",
    status: "pending",
    statusLabel: "待审核",
    date: "2024-03-01",
  },
  {
    orderNo: "SO-20240228-0003",
    dealer: "广州铝材经销商",
    amount: "¥28,500",
    status: "producing",
    statusLabel: "生产中",
    date: "2024-02-28",
  },
  {
    orderNo: "SO-20240228-0002",
    dealer: "东莞DIY工坊",
    amount: "¥9,200",
    status: "ready",
    statusLabel: "待发货",
    date: "2024-02-28",
  },
  {
    orderNo: "SO-20240227-0005",
    dealer: "佛山五金城",
    amount: "¥45,000",
    status: "shipped",
    statusLabel: "已发货",
    date: "2024-02-27",
  },
  {
    orderNo: "SO-20240227-0004",
    dealer: "上海家居定制",
    amount: "¥32,100",
    status: "completed",
    statusLabel: "已完成",
    date: "2024-02-27",
  },
];

const productionTasks = [
  {
    woNo: "WO-20240301-0001-01",
    product: "C-MR-2525-8-A-SV-L600MM",
    qty: 200,
    status: "cutting",
    statusLabel: "切割中",
    progress: 30,
  },
  {
    woNo: "WO-20240228-0003-01",
    product: "C-OL-2525-A-BK",
    qty: 500,
    status: "surface_treat",
    statusLabel: "表面处理",
    progress: 65,
  },
  {
    woNo: "WO-20240228-0002-01",
    product: "H-MR-2020-A-SV",
    qty: 150,
    status: "qc",
    statusLabel: "质检中",
    progress: 90,
  },
];

const statusColorMap: Record<string, "warning" | "info" | "success" | "default" | "danger"> = {
  pending: "warning",
  confirmed: "info",
  producing: "info",
  ready: "success",
  shipped: "success",
  completed: "success",
  cancelled: "danger",
  cutting: "info",
  surface_treat: "info",
  qc: "warning",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{stat.change}</p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}
                  >
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Sales Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">最近销售订单</CardTitle>
            <Link
              href="/sales-orders"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              查看全部 →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.orderNo}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900">
                      {order.orderNo}
                    </p>
                    <p className="text-xs text-slate-500">{order.dealer}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {order.amount}
                    </p>
                    <Badge variant={statusColorMap[order.status] || "default"}>
                      {order.statusLabel}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Production Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">生产进度</CardTitle>
            <Link
              href="/production"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              查看全部 →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productionTasks.map((task) => (
                <div key={task.woNo} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {task.woNo}
                      </p>
                      <p className="text-xs text-slate-500">
                        {task.product} × {task.qty}
                      </p>
                    </div>
                    <Badge variant={statusColorMap[task.status] || "default"}>
                      {task.statusLabel}
                    </Badge>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">本月销售额</p>
                <p className="text-xl font-bold text-slate-900">¥328,500</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">活跃经销商</p>
                <p className="text-xl font-bold text-slate-900">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">平均交付周期</p>
                <p className="text-xl font-bold text-slate-900">5.2 天</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
