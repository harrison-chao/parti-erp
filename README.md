# Parti ERP — 边缘智造供应链管理系统

铝型材 DIY 零部件定制化 ERP 解决方案，覆盖"采购-生产-库存-销售"全链路。

## 技术栈

- **框架**: Next.js 16 (App Router + Turbopack)
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **数据库**: Neon (Serverless Postgres) / Vercel Postgres
- **ORM**: Drizzle ORM
- **认证**: Auth.js (Credentials Provider)
- **部署**: Vercel

## 功能模块

| 模块 | 路由 | 状态 |
|------|------|------|
| 工作台 | `/` | ✅ KPI 卡片 + 近期订单 + 生产进度 |
| 经销商管理 | `/dealers` | ✅ CRUD + 搜索 + 等级筛选 + 详情抽屉 |
| 销售订单 | `/sales-orders` | ✅ 列表 + 状态筛选 + 详情 + 新建 |
| 生产委托 | `/production` | ✅ 工单卡片 + 工序进度条 + 详情 |
| 采购申请 | `/purchase` | ✅ 列表 + 审批操作 + 转采购单 |
| 入库管理 | `/goods-receipt` | ✅ 多类型入库 + 质检 + 上架 |
| 库存管理 | `/inventory` | ✅ 多维度库存 + 预警 + 事务日志 |
| 产品管理 | `/products` | ✅ 模板+变体 + SKU 展开 |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入数据库连接和 AUTH_SECRET

# 3. 生成 AUTH_SECRET
npx auth secret

# 4. 启动开发服务器
npm run dev

# 5. 访问 http://localhost:3000
# 演示账号: admin@parti.com / parti2024
```

## 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 中导入该仓库
3. 添加环境变量:
   - `DATABASE_URL` — Neon 或 Vercel Postgres 连接字符串
   - `AUTH_SECRET` — 认证密钥
   - `AUTH_URL` — 部署域名 (如 `https://erp.parti.com`)
4. 部署完成后解析自定义域名

## 数据库初始化

```bash
# 生成迁移文件
npx drizzle-kit generate

# 执行迁移
npx drizzle-kit push

# 查看数据库 Studio
npx drizzle-kit studio
```

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/login/       # 登录页
│   ├── (dashboard)/        # 主面板（需认证）
│   │   ├── page.tsx        # 工作台
│   │   ├── dealers/        # 经销商管理
│   │   ├── sales-orders/   # 销售订单
│   │   ├── production/     # 生产委托
│   │   ├── purchase/       # 采购申请
│   │   ├── goods-receipt/  # 入库管理
│   │   ├── inventory/      # 库存管理
│   │   └── products/       # 产品管理
│   └── api/auth/           # Auth.js API
├── components/
│   ├── ui/                 # 基础 UI 组件
│   └── layout/             # 布局组件
├── db/
│   ├── schema.ts           # Drizzle 数据库 Schema (858行)
│   └── index.ts            # 数据库连接
├── lib/
│   ├── auth.ts             # Auth.js 配置
│   └── utils.ts            # 工具函数 + 状态映射
└── types/
    └── next-auth.d.ts      # Auth 类型扩展
```

## 演示模式

当前系统运行在演示模式（Demo Mode），使用内存数据。连接 Neon 数据库后：

1. 将 `src/lib/auth.ts` 中的 `DEMO_USERS` 替换为数据库查询
2. 各模块页面的 `DEMO_*` 数据替换为 Server Component 数据获取
3. 表单提交连接 Server Actions

## 后续规划

- **Phase 2**: 采购订单(PO) + MRP 自动触发 + 原料批次追溯
- **Phase 3**: 安全库存自动计算 + 交期预测 + 供应商协同门户
