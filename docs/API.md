# LuckyShop API 文档 v5.0

> 基础 URL: `http://localhost:4000/api`
> 认证: `Authorization: Bearer <jwt>`
> 统一响应: `{ success: true, data: T, meta?: {...} }` 或 `{ success: false, requestId: string, error: { code, message } }`
> 追踪: 所有响应包含 `x-request-id` 头部，错误响应 body 中也包含 `requestId`

---

## 监控端点

| Method | Path       | 说明                  | 限流 |
| ------ | ---------- | --------------------- | ---- |
| GET    | `/metrics`  | Prometheus 格式指标   | 无   |
| GET    | `/health`   | 活跃探测 (liveness)   | 无   |
| GET    | `/health/ready` | 就绪探测 (readiness) | 无   |
| GET    | `/csrf-token` | 获取 CSRF 令牌       | 无   |

### 幂等性

所有 `POST/PUT/PATCH/DELETE` 请求支持 `Idempotency-Key` 头部。相同 key 的重复请求返回首次结果（30 分钟窗口）。

### CSRF 保护

所有非 `GET/HEAD/OPTIONS` 请求需携带 `x-csrf-token` 头部。前端自动从 `/api/csrf-token` 获取并在 403 时自动刷新重试。

---

## 认证 `/api/auth`

| Method | Path               | 说明     | 请求体                         | 响应              |
| ------ | ------------------ | -------- | ------------------------------- | ----------------- |
| POST   | `/register`        | 注册     | `{ username, email, password }` | `{ token, user }` |
| POST   | `/login`           | 登录     | `{ email, password }`           | `{ token, user }` |
| POST   | `/logout`          | 登出     | —                               | `{ message }`     |
| GET    | `/me`              | 当前用户 | —                               | `{ user }`        |
| POST   | `/change-password` | 修改密码 | `{ oldPassword, newPassword }`  | `{ message }`     |
| POST   | `/forgot-password` | 忘记密码 | `{ email }`                     | `{ resetToken }`  |
| POST   | `/reset-password`  | 重置密码 | `{ resetToken, newPassword }`   | `{ message }`     |

**密码规则**: 至少8位，包含大写字母、小写字母、数字。

## 用户 `/api/users`

| Method | Path                        | 说明     |
| ------ | --------------------------- | -------- |
| PUT    | `/me`                       | 更新资料 |
| GET    | `/me/addresses`             | 地址列表 |
| POST   | `/me/addresses`             | 新增地址 |
| PUT    | `/me/addresses/:id`         | 编辑地址 |
| DELETE | `/me/addresses/:id`         | 删除地址 |
| PUT    | `/me/addresses/:id/default` | 设为默认 |

## 商品 `/api/products`

| Method | Path                  | 说明                        |
| ------ | --------------------- | --------------------------- |
| GET    | `/`                   | 列表（分页/筛选/排序/搜索） |
| GET    | `/featured`           | 精选商品                    |
| GET    | `/new`                | 新品                        |
| GET    | `/hot`                | 热销                        |
| GET    | `/categories`         | 分类列表                    |
| GET    | `/search/suggestions` | 搜索建议                    |
| GET    | `/:id`                | 详情                        |
| GET    | `/:id/reviews`        | 评价列表                    |
| POST   | `/:id/reviews`        | 提交评价                    |
| GET    | `/:id/related`        | 相关推荐                    |

## 购物车 `/api/cart`

| Method | Path       | 说明          |
| ------ | ---------- | ------------- |
| GET    | `/`        | 购物车列表    |
| POST   | `/`        | 加入购物车    |
| PATCH  | `/:itemId` | 修改数量/选中 |
| DELETE | `/:itemId` | 移除          |
| DELETE | `/`        | 清空          |

## 订单 `/api/orders`

| Method | Path           | 说明                 |
| ------ | -------------- | -------------------- |
| POST   | `/preview`     | 结算预览（优惠券/积分/邮费） |
| POST   | `/`            | 创建订单（模拟支付） |
| GET    | `/`            | 订单列表             |
| GET    | `/:id`         | 订单详情             |
| PUT    | `/:id/cancel`  | 取消订单             |
| POST   | `/:id/confirm` | 确认收货             |

**库存保障**: 下单时使用原子操作（乐观锁 + stock >= quantity），防止超卖。

## 游戏 `/api/games`

| Method | Path              | 说明                  |
| ------ | ----------------- | --------------------- |
| GET    | `/`               | 游戏大厅（次数/统计） |
| GET    | `/history`        | 游戏历史              |
| POST   | `/:type/start`    | 开始游戏              |
| POST   | `/:type/complete` | 完成游戏              |

游戏类型: `wheel` | `scratch` | `memory` | `game2048` | `reaction`
难度: `easy` | `medium` | `hard`

## 奖品 `/api/prizes`

| Method | Path          | 说明         |
| ------ | ------------- | ------------ |
| GET    | `/my`         | 我的奖品中心 |
| GET    | `/my/coupons` | 优惠券列表   |
| GET    | `/my/points`  | 积分流水     |
| GET    | `/my/gifts`   | 实物奖品     |

**积分**: 余额缓存于 `User.points` 字段，所有变动原子更新。

## 签到 `/api/checkin`

| Method | Path     | 说明         |
| ------ | -------- | ------------ |
| GET    | `/today` | 今日是否已签 |
| POST   | `/`      | 签到         |

## 管理后台 `/api/admin`（需 admin 权限）

| Method | Path                  | 说明          |
| ------ | --------------------- | ------------- |
| GET    | `/dashboard`          | 数据看板      |
| GET    | `/products`           | 商品管理      |
| POST   | `/products`           | 新增商品      |
| PUT    | `/products/:id`       | 编辑商品      |
| DELETE | `/products/:id`       | 下架商品      |
| GET    | `/orders`             | 订单管理      |
| PATCH  | `/orders/:id`         | 修改状态/发货 |
| GET    | `/prizes`             | 奖品管理      |
| POST   | `/prizes/:id/restock` | 补货          |
| GET    | `/users`              | 用户列表      |
| PATCH  | `/users/:id`          | 改角色/封禁   |

**安全**: 所有 Admin 路由已添加 Zod 输入白名单校验。

## 错误码

| 代码        | 说明                              |
| ----------- | --------------------------------- |
| A1001-A1009 | 认证相关（含 CSRF 无效）           |
| A2001-A2002 | 资源不存在/已存在                  |
| A3001-A3003 | 参数校验                          |
| A4001-A4011 | 业务逻辑（库存/购物车/游戏/订单/幂等） |
| A5000-A5003 | 系统错误                          |
