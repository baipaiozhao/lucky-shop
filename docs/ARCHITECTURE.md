# LuckyShop 5.0 — 架构设计

> 经五轮迭代形成的最终架构方案，对应 `D:\此电脑\桌面\购物项目\` 中的 `LuckyShop5.0-完整开发方案.docx` 与 `开发计划.docx`。

## 1. 系统架构

```
┌────────────────────────────────────────────────────────┐
│                   Browser / Mobile                     │
└────────────────────────┬───────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼───────────────────────────────┐
│   Vercel (CDN)   ←──  React 18 SPA (Vite + Ant Design) │
│   lucky-shop.vercel.app                                  │
└────────────────────────┬───────────────────────────────┘
                         │ /api/*
┌────────────────────────▼───────────────────────────────┐
│   Railway / Render   ←──  Express + Prisma (Node 20)   │
│   api.lucky-shop.app      JWT + Helmet + Rate Limit     │
└────────────────────────┬───────────────────────────────┘
                         │ Prisma ORM
┌────────────────────────▼───────────────────────────────┐
│   PostgreSQL (prod) / SQLite (dev)                       │
│   25 张表 / 30+ 索引 / 乐观锁                            │
└─────────────────────────────────────────────────────────┘
```

## 2. 模块划分

| 模块      | 路径                                | 状态      |
| --------- | ----------------------------------- | --------- |
| 用户认证  | `server/src/modules/auth/`          | S2 待开发 |
| 用户/地址 | `server/src/modules/users/`         | S2 待开发 |
| 商品      | `server/src/modules/products/`      | S3 待开发 |
| 购物车    | `server/src/modules/cart/`          | S4 待开发 |
| 订单      | `server/src/modules/orders/`        | S4 待开发 |
| 游戏      | `server/src/modules/games/`         | S5 待开发 |
| 奖品      | `server/src/modules/prizes/`        | S6 待开发 |
| 签到      | `server/src/modules/checkin/`       | S7 待开发 |
| 成就      | `server/src/modules/achievements/`  | S7 待开发 |
| 通知      | `server/src/modules/notifications/` | S7 待开发 |
| 邀请      | `server/src/modules/invitations/`   | S7 待开发 |
| 管理后台  | `server/src/modules/admin/`         | S8 待开发 |

## 3. 数据模型

详见 `prisma/schema.prisma`（25 张表 + 30+ 索引）。

ER 关系图：

```
User ─┬─< Address
      ├─< CartItem >─ Product >─ Category
      ├─< Favorite >─ Product
      ├─< Review >─ Product
      ├─< Order >─ Address
      │           └─< OrderItem >─ Product
      ├─< GameSession >─ Order
      │                └─1:1─ GameRecord >─ Prize
      ├─< UserPrize >─ Prize
      ├─< UserCoupon >─ Coupon >─ CouponRule
      ├─< PointsTransaction
      ├─< CheckIn
      ├─< UserAchievement >─ Achievement
      ├─< Invitation (self)
      ├─< ShareRecord
      ├─< Notification
      └─< AnalyticsEvent
```

## 4. 关键技术决策

- **类型安全**：全栈 TypeScript strict mode
- **数据库**：开发 SQLite，生产 PostgreSQL（Prisma 同套 Schema）
- **认证**：JWT + bcrypt (12 rounds)
- **校验**：Zod schema 双端共用
- **限流**：路由级（login 5/min, game 10/min, order 5/min）
- **缓存**：LRU 进程内（商品/奖品/规则）
- **调度**：node-cron（券过期/积分清理/游戏会话）
- **游戏防作弊**：统一会话协议 + RNG Seed + 服务端校验

## 5. 性能策略

- 路由懒加载（React.lazy）
- React Query staleTime 5 分钟
- LRU 缓存层
- 图片 WebP + 多尺寸
- Prisma 连接池
- Brotli 压缩
- Lighthouse 目标 > 90

## 6. 安全策略

- Helmet HTTP 头
- CORS 白名单
- Zod 校验所有 Controller
- Prisma 参数化查询（防 SQL 注入）
- 乐观锁 + 幂等键（防超卖）
- bcrypt 12 rounds（密码）
- 风控日志（游戏作弊）

## 7. 部署

- **前端**：Vercel（自动 HTTPS + CDN）
- **后端**：Railway（Docker 容器）
- **DB**：Railway PostgreSQL
- **CI**：GitHub Actions（lint / typecheck / test / build）
- **CD**：main 合并自动部署

详见 `DEPLOY.md`（S10 阶段补充）。

## 8. 测试金字塔

```
        ┌──────────┐
        │  E2E (1) │  Playwright
        ├──────────┤
        │集成 (15)  │  Supertest
        ├──────────┤
        │ 单元 (50) │  Vitest / Jest
        └──────────┘
```

覆盖率门槛：algorithms 100% / utils > 90% / services > 80%。

---

完整方案见 `LuckyShop5.0-完整开发方案.docx`。
开发排期见 `LuckyShop5.0-开发计划.docx`。
