/**
 * LuckyShop 5.0 - 种子数据
 * 执行: npm run prisma:seed
 *
 * 数据规模：
 *   - 3 用户 (admin/test/demo, bcrypt 加密)
 *   - 6 商品分类
 *   - 24 商品 (覆盖所有分类与价位)
 *   - 6 优惠券模板
 *   - 13 奖品 (12 段位 + 1 参与奖)
 *   - 12 成就
 *   - test 用户预置：3 券 + 500 积分 + 2 订单 + 5 收藏 + 3 签到 + 1 通关游戏
 */

import { PrismaClient } from '@prisma/client';
import type { Coupon, Product } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function subDays(date: Date, days: number): Date {
  return addDays(date, -days);
}
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function genOrderNo(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const hms = `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `LS${ymd}${hms}${rand}`;
}

async function clearAll(): Promise<void> {
  // 顺序：先清依赖表，再清主表
  const tablenames = [
    'AnalyticsEvent',
    'Notification',
    'ShareRecord',
    'Invitation',
    'UserAchievement',
    'Achievement',
    'CheckIn',
    'PointsTransaction',
    'UserCoupon',
    'CouponRule',
    'Coupon',
    'UserPrize',
    'Prize',
    'GameRecord',
    'GameSession',
    'OrderItem',
    'Order',
    'CartItem',
    'Favorite',
    'Review',
    'ProductRelation',
    'Product',
    'Category',
    'Address',
    'User',
    'FeatureFlag',
  ];
  for (const t of tablenames) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any)[t.charAt(0).toLowerCase() + t.slice(1)].deleteMany({});
    } catch {
      // 表可能不存在，跳过
    }
  }
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash('admin123', 12);
  const testHash = await bcrypt.hash('test123', 12);
  const demoHash = await bcrypt.hash('demo123', 12);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@luckyshop.com',
      password: passwordHash,
      role: 'admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  });
  const test = await prisma.user.create({
    data: {
      username: 'test',
      email: 'test@luckyshop.com',
      password: testHash,
      phone: '13800138000',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
    },
  });
  const demo = await prisma.user.create({
    data: {
      username: 'demo',
      email: 'demo@luckyshop.com',
      password: demoHash,
      phone: '13900139000',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    },
  });
  return { admin, test, demo };
}

async function seedCategories() {
  const cats = [
    { name: '数码', icon: '📱', sort: 1 },
    { name: '服饰', icon: '👕', sort: 2 },
    { name: '美妆', icon: '💄', sort: 3 },
    { name: '食品', icon: '🍪', sort: 4 },
    { name: '家居', icon: '🏠', sort: 5 },
    { name: '图书', icon: '📚', sort: 6 },
  ];
  const result = [];
  for (const c of cats) {
    result.push(await prisma.category.create({ data: c }));
  }
  return result;
}

const IMG = (id: string) =>
  `https://picsum.photos/seed/${id}/400/400`;

async function seedProducts(categoryMap: Record<string, string>) {
  const products = [
    // 数码
    {
      name: '无线降噪蓝牙耳机 Pro',
      description: '主动降噪 + 蓝牙 5.3，续航 30 小时',
      price: 29900,
      originalPrice: 39900,
      category: '数码',
      images: JSON.stringify([IMG('1505740420928-5e560c06d30e')]),
      stock: 50,
      sales: 1200,
      isFeatured: true,
      isNew: false,
      tags: JSON.stringify(['热卖', '推荐']),
    },
    {
      name: '机械键盘 青轴 87键',
      description: 'PBT 键帽 / 青轴段落感 / RGB 背光',
      price: 19900,
      category: '数码',
      images: JSON.stringify([IMG('1587829741301-dc798b83add3')]),
      stock: 30,
      sales: 890,
      isNew: true,
    },
    {
      name: '便携充电宝 20000mAh',
      description: '双向快充 / 18W PD / 多协议兼容',
      price: 12900,
      category: '数码',
      images: JSON.stringify([IMG('1609091839311-d5365f9ff1c5')]),
      stock: 80,
      sales: 2300,
      isFeatured: true,
    },
    {
      name: 'Type-C 扩展坞 7合1',
      description: 'HDMI 4K + USB 3.0 × 3 + PD 充电',
      price: 15900,
      category: '数码',
      images: JSON.stringify([IMG('1625948515291-69613efd103f')]),
      stock: 45,
      sales: 560,
    },
    {
      name: '手机散热背夹 磁吸',
      description: '半导体制冷 / 静音 / iPhone 15 通用',
      price: 7900,
      category: '数码',
      images: JSON.stringify([IMG('1601784551446-20c9e07cdbdb')]),
      stock: 100,
      sales: 1890,
    },
    {
      name: '智能手表 健康监测',
      description: '心率血氧 / 50 米防水 / 14 天续航',
      price: 59900,
      originalPrice: 79900,
      category: '数码',
      images: JSON.stringify([IMG('1523275335684-37898b6baf30')]),
      stock: 25,
      sales: 320,
      isFeatured: true,
    },

    // 服饰
    {
      name: '纯棉圆领短袖 T恤',
      description: '100% 长绒棉 / 多色可选 / 修身版型',
      price: 8900,
      category: '服饰',
      images: JSON.stringify([IMG('1521572163474-6864f9cf17ab')]),
      stock: 200,
      sales: 3400,
    },
    {
      name: '轻薄防晒外套 UPF50+',
      description: 'UPF50+ 防晒 / 速干透气 / 4 色',
      price: 14900,
      category: '服饰',
      images: JSON.stringify([IMG('1551488831-00ddcb6c6bd3')]),
      stock: 120,
      sales: 980,
      isNew: true,
    },
    {
      name: '直筒牛仔裤 深蓝色',
      description: '新疆长绒棉 / 直筒版型 / 5 码全',
      price: 19900,
      category: '服饰',
      images: JSON.stringify([IMG('1542272604-787c3835535d')]),
      stock: 80,
      sales: 1500,
    },
    {
      name: '运动跑步鞋 轻便透气',
      description: '飞织网面 / EVA 缓震 / 多场景',
      price: 25900,
      category: '服饰',
      images: JSON.stringify([IMG('1542291026-7eec264c27ff')]),
      stock: 60,
      sales: 720,
    },

    // 美妆
    {
      name: '保湿精华液 30ml',
      description: '玻尿酸 + 烟酰胺 / 补水修护',
      price: 16900,
      category: '美妆',
      images: JSON.stringify([IMG('1556228720-195a672e8a03')]),
      stock: 90,
      sales: 2100,
    },
    {
      name: '防晒霜 SPF50+ PA++++',
      description: '高倍防晒 / 轻薄不油腻 / 全身可用',
      price: 12900,
      category: '美妆',
      images: JSON.stringify([IMG('1556228841-a3c527ebefe5')]),
      stock: 150,
      sales: 3200,
      isFeatured: true,
    },
    {
      name: '哑光口红 豆沙色',
      description: '丝绒哑光 / 持妆 8 小时 / 6 色可选',
      price: 7900,
      category: '美妆',
      images: JSON.stringify([IMG('1586495777744-4413f21062fa')]),
      stock: 100,
      sales: 4500,
    },

    // 食品
    {
      name: '坚果礼盒 每日混合装',
      description: '7 种坚果 / 30 包独立装 / 节日送礼',
      price: 9900,
      category: '食品',
      images: JSON.stringify([IMG('1599599810694-b5b37304c041')]),
      stock: 200,
      sales: 5800,
    },
    {
      name: '挂耳咖啡 混合风味 20袋',
      description: '日式深烘 / 4 种风味 / 办公室常备',
      price: 8900,
      category: '食品',
      images: JSON.stringify([IMG('1559056199-641a0ac8b55e')]),
      stock: 150,
      sales: 3500,
    },
    {
      name: '进口巧克力礼盒 16粒',
      description: '比利时进口 / 16 粒 4 味 / 礼盒装',
      price: 13900,
      category: '食品',
      images: JSON.stringify([IMG('1481391319762-47dff72954d9')]),
      stock: 80,
      sales: 2200,
    },

    // 家居
    {
      name: '超声波香薰机 500ml',
      description: '静音雾化 / 7 色灯光 / 500ml 大容量',
      price: 18900,
      category: '家居',
      images: JSON.stringify([IMG('1602874801006-e26c4c5b5b21')]),
      stock: 40,
      sales: 450,
    },
    {
      name: '记忆棉颈椎枕',
      description: '慢回弹记忆棉 / 蜂窝透气 / 防螨',
      price: 15900,
      category: '家居',
      images: JSON.stringify([IMG('1540932239986-30128078f3c5')]),
      stock: 70,
      sales: 1200,
    },
    {
      name: '台灯 护眼LED 三档调光',
      description: '国 AA 级照度 / 3 档色温 / 触摸开关',
      price: 12900,
      category: '家居',
      images: JSON.stringify([IMG('1507473885765-e6ed057f782c')]),
      stock: 50,
      sales: 880,
    },

    // 图书
    {
      name: 'JavaScript高级程序设计 第4版',
      description: '前端必读经典 / 800+ 页 / 配套源码',
      price: 9900,
      category: '图书',
      images: JSON.stringify([IMG('1532012197267-da84d127e765')]),
      stock: 60,
      sales: 3200,
    },
    {
      name: '设计中的设计 原研哉',
      description: '设计哲学经典 / 全彩印刷 / 收藏版',
      price: 6800,
      category: '图书',
      images: JSON.stringify([IMG('1544716278-ca5e3f4abd8c')]),
      stock: 40,
      sales: 1500,
    },

    // 低价引流款
    {
      name: '手机支架 桌面可调节',
      description: '铝合金 / 多角度 / 折叠便携',
      price: 1900,
      category: '数码',
      images: JSON.stringify([IMG('1583394838336-acd977736f90')]),
      stock: 300,
      sales: 12000,
      isFeatured: true,
    },
    {
      name: '数据线 Type-C 1米',
      description: '6A 超级快充 / 尼龙编织 / 耐用',
      price: 2900,
      category: '数码',
      images: JSON.stringify([IMG('1583394838336-acd977736f90')]),
      stock: 500,
      sales: 9800,
    },
    {
      name: '环保购物袋 帆布',
      description: '加厚帆布 / 可折叠 / 多图案',
      price: 1500,
      category: '家居',
      images: JSON.stringify([IMG('1591047139829-d91aecb6caea')]),
      stock: 200,
      sales: 6700,
    },
  ];
  const result = [];
  for (const p of products) {
    const cat = categoryMap[p.category];
    if (!cat) continue;
    const { category: _category, ...data } = p;
    result.push(
      await prisma.product.create({
        data: { ...data, categoryId: cat, rating: 4.5 + Math.random() * 0.5 },
      }),
    );
  }
  return result;
}

async function seedCoupons() {
  const list = [
    {
      name: '5元无门槛券',
      type: 'fixed_amount',
      amount: 500,
      minSpend: 0,
      validDays: 30,
      totalQuota: 200,
      description: '任意订单可用',
    },
    {
      name: '10元满100减券',
      type: 'fixed_amount',
      amount: 1000,
      minSpend: 10000,
      validDays: 30,
      totalQuota: 100,
      description: '满100减10',
    },
    {
      name: '15元满200减券',
      type: 'fixed_amount',
      amount: 1500,
      minSpend: 20000,
      validDays: 30,
      totalQuota: 80,
      description: '满200减15',
    },
    {
      name: '30元满300减券',
      type: 'fixed_amount',
      amount: 3000,
      minSpend: 30000,
      validDays: 30,
      totalQuota: 50,
      description: '满300减30',
    },
    {
      name: '新人专享9折',
      type: 'percentage',
      amount: 10, // 10% off
      minSpend: 5000,
      maxDiscount: 5000,
      validDays: 7,
      totalQuota: 999,
      description: '9折优惠，最高减50',
    },
    {
      name: '限时满500减100',
      type: 'fixed_amount',
      amount: 10000,
      minSpend: 50000,
      validDays: 3,
      totalQuota: 30,
      description: '限时大额券',
    },
  ];
  const result = [];
  for (const c of list) {
    result.push(await prisma.coupon.create({ data: c }));
  }
  return result;
}

async function seedPrizes() {
  const list = [
    {
      name: '5元无门槛券',
      type: 'coupon',
      tier: 'easy',
      value: 500,
      description: '直接使用 5 元券',
      probability: 0.35,
      stock: 30,
    },
    {
      name: '50 积分',
      type: 'points',
      tier: 'easy',
      value: 50,
      description: '50 积分奖励',
      probability: 0.4,
      stock: 9999,
    },
    {
      name: 'Lucky 贴纸',
      type: 'gift',
      tier: 'easy',
      value: 0,
      description: 'Lucky 主题贴纸',
      probability: 0.15,
      stock: 20,
    },
    {
      name: '10元满100券',
      type: 'coupon',
      tier: 'easy',
      value: 1000,
      description: '满100减10',
      probability: 0.1,
      stock: 10,
    },
    {
      name: '15元满200券',
      type: 'coupon',
      tier: 'medium',
      value: 1500,
      description: '满200减15',
      probability: 0.35,
      stock: 15,
    },
    {
      name: '100 积分',
      type: 'points',
      tier: 'medium',
      value: 100,
      description: '100 积分奖励',
      probability: 0.4,
      stock: 9999,
    },
    {
      name: '创意手机壳',
      type: 'gift',
      tier: 'medium',
      value: 0,
      description: 'Lucky 主题手机壳',
      probability: 0.15,
      stock: 10,
    },
    {
      name: '20元满300券',
      type: 'coupon',
      tier: 'medium',
      value: 2000,
      description: '满300减20',
      probability: 0.1,
      stock: 5,
    },
    {
      name: '50元满400券',
      type: 'coupon',
      tier: 'hard',
      value: 5000,
      description: '满400减50',
      probability: 0.35,
      stock: 8,
    },
    {
      name: '200 积分',
      type: 'points',
      tier: 'hard',
      value: 200,
      description: '200 积分奖励',
      probability: 0.4,
      stock: 9999,
    },
    {
      name: '蓝牙耳机',
      type: 'gift',
      tier: 'hard',
      value: 0,
      description: '高品质蓝牙耳机',
      probability: 0.15,
      stock: 5,
    },
    {
      name: '100元满800券',
      type: 'coupon',
      tier: 'hard',
      value: 10000,
      description: '满800减100',
      probability: 0.1,
      stock: 2,
    },
    {
      name: '10积分参与奖',
      type: 'points',
      tier: 'consolation',
      value: 10,
      description: '未通关参与奖',
      probability: 1.0,
      stock: 9999,
    },
  ];
  const result = [];
  for (const p of list) {
    result.push(await prisma.prize.create({ data: p }));
  }
  return result;
}

async function seedAchievements() {
  const list = [
    {
      key: 'first_purchase',
      name: '初出茅庐',
      description: '完成首笔订单',
      icon: '🎉',
      category: 'order',
      condition: JSON.stringify({ orderCount: 1 }),
      reward: JSON.stringify({ type: 'points', value: 100 }),
    },
    {
      key: 'big_spender',
      name: '购物达人',
      description: '累计消费满 1000 元',
      icon: '💎',
      category: 'order',
      condition: JSON.stringify({ totalSpent: 100000 }),
      reward: JSON.stringify({ type: 'coupon', value: 5000 }),
    },
    {
      key: 'play_5_games',
      name: '游戏新手',
      description: '玩过 5 次游戏',
      icon: '🎮',
      category: 'game',
      condition: JSON.stringify({ gameCount: 5 }),
      reward: JSON.stringify({ type: 'points', value: 50 }),
    },
    {
      key: 'win_3_streak',
      name: '连胜之星',
      description: '连续 3 天游戏通关',
      icon: '🔥',
      category: 'game',
      condition: JSON.stringify({ winStreak: 3 }),
      reward: JSON.stringify({ type: 'coupon', value: 1000 }),
    },
    {
      key: 'all_games_played',
      name: '全能玩家',
      description: '5 款游戏各玩一次',
      icon: '🏆',
      category: 'game',
      condition: JSON.stringify({ allGamesPlayed: 1 }),
      reward: JSON.stringify({ type: 'points', value: 200 }),
    },
    {
      key: 'hard_winner',
      name: '挑战王者',
      description: '在困难难度下通关',
      icon: '👑',
      category: 'game',
      condition: JSON.stringify({ hardWins: 1 }),
      reward: JSON.stringify({ type: 'gift', value: '蓝牙耳机' }),
    },
    {
      key: 'first_share',
      name: '分享达人',
      description: '分享一次游戏结果',
      icon: '📢',
      category: 'social',
      condition: JSON.stringify({ shareCount: 1 }),
      reward: JSON.stringify({ type: 'points', value: 20 }),
    },
    {
      key: 'invite_friend',
      name: '社交达人',
      description: '成功邀请 1 位好友',
      icon: '👥',
      category: 'social',
      condition: JSON.stringify({ inviteSuccess: 1 }),
      reward: JSON.stringify({ type: 'coupon', value: 2000 }),
    },
    {
      key: 'checkin_7',
      name: '坚持不懈',
      description: '连续签到 7 天',
      icon: '📅',
      category: 'social',
      condition: JSON.stringify({ checkinStreak: 7 }),
      reward: JSON.stringify({ type: 'points', value: 100 }),
    },
    {
      key: 'checkin_30',
      name: '签到达人',
      description: '连续签到 30 天',
      icon: '🌟',
      category: 'social',
      condition: JSON.stringify({ checkinStreak: 30 }),
      reward: JSON.stringify({ type: 'gift', value: '神秘礼包' }),
    },
    {
      key: 'first_review',
      name: '热心评价',
      description: '提交首条评价',
      icon: '✍️',
      category: 'social',
      condition: JSON.stringify({ reviewCount: 1 }),
      reward: JSON.stringify({ type: 'points', value: 30 }),
    },
    {
      key: 'favorite_5',
      name: '收藏家',
      description: '收藏 5 件商品',
      icon: '❤️',
      category: 'social',
      condition: JSON.stringify({ favoriteCount: 5 }),
      reward: JSON.stringify({ type: 'points', value: 50 }),
    },
  ];
  for (const a of list) {
    await prisma.achievement.create({ data: a });
  }
}

async function seedTestUserData(
  testUserId: string,
  products: Pick<Product, 'id' | 'price' | 'name' | 'images'>[],
  coupons: Pick<Coupon, 'id' | 'validDays'>[],
) {
  // 1. 给 test 用户发 3 张可用券
  for (let i = 0; i < 3 && i < coupons.length; i++) {
    await prisma.userCoupon.create({
      data: {
        userId: testUserId,
        couponId: coupons[i].id,
        status: 'unused',
        expiredAt: addDays(new Date(), coupons[i].validDays),
      },
    });
  }

  // 2. 给 test 用户 500 积分 (流水方式)
  await prisma.pointsTransaction.create({
    data: {
      userId: testUserId,
      amount: 500,
      type: 'earned',
      source: 'admin',
      remark: '种子数据预置',
    },
  });
  await prisma.user.update({
    where: { id: testUserId },
    data: { points: { increment: 500 } },
  });

  // 3. 地址簿
  const address = await prisma.address.create({
    data: {
      userId: testUserId,
      name: '张三',
      phone: '13800138000',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detail: '建国路 88 号 SOHO 现代城 A 座 1801',
      isDefault: true,
    },
  });

  // 4. 2 笔已支付订单 (用前 2 个商品)
  if (products.length >= 2) {
    for (let i = 0; i < 2; i++) {
      const p = products[i];
      const qty = i + 1;
      const orderNo = genOrderNo();
      const order = await prisma.order.create({
        data: {
          orderNo,
          userId: testUserId,
          totalAmount: Number(p.price) * qty,
          discount: 0,
          finalAmount: Number(p.price) * qty,
          status: i === 0 ? 'completed' : 'paid',
          paymentMethod: 'mock',
          addressId: address.id,
          gameChances: 1,
          paidAt: subDays(new Date(), i + 1),
          ...(i === 0 ? { completedAt: subDays(new Date(), 0) } : {}),
          items: {
            create: [
              {
                productId: p.id,
                productName: p.name,
                productImage: JSON.parse(p.images)[0],
                price: p.price,
                quantity: qty,
                subtotal: Number(p.price) * qty,
              },
            ],
          },
        },
      });
      // 第一笔订单创建游戏会话
      if (i === 0) {
        const session = await prisma.gameSession.create({
          data: {
            userId: testUserId,
            orderId: order.id,
            gameType: 'wheel',
            difficulty: 'easy',
            status: 'completed',
            rngSeed: 'demo-seed-' + i,
            serverNonce: 'demo-nonce',
            configSnapshot: JSON.stringify({ segments: 6 }),
            resultSnapshot: JSON.stringify({ segment: 2, prizeId: null }),
            completedAt: subDays(new Date(), 0),
            expiresAt: addDays(new Date(), 30),
          },
        });
        await prisma.gameRecord.create({
          data: {
            userId: testUserId,
            sessionId: session.id,
            gameType: 'wheel',
            difficulty: 'easy',
            score: 100,
            passed: true,
            duration: 8200,
          },
        });
      }
    }
  }

  // 5. 5 个收藏
  for (let i = 0; i < 5 && i < products.length; i++) {
    await prisma.favorite.create({
      data: { userId: testUserId, productId: products[i].id },
    });
  }

  // 6. 3 天签到记录
  for (let i = 0; i < 3; i++) {
    const checkDate = startOfDay(subDays(new Date(), i));
    try {
      await prisma.checkIn.create({
        data: {
          userId: testUserId,
          checkDate,
          dayIndex: i + 1,
          reward: JSON.stringify({ type: 'points', value: 10 * (i + 1) }),
          points: 10 * (i + 1),
        },
      });
    } catch {
      // unique 冲突跳过
    }
  }

  // 7. 预置首单成就
  const firstPurchase = await prisma.achievement.findUnique({ where: { key: 'first_purchase' } });
  if (firstPurchase) {
    await prisma.userAchievement.create({
      data: {
        userId: testUserId,
        achievementId: firstPurchase.id,
        progress: 1,
        target: 1,
        completed: true,
        completedAt: subDays(new Date(), 0),
      },
    });
  }
}

async function main() {
  // eslint-disable-next-line no-console
  console.log('🌱 开始填充种子数据...');

  await clearAll();
  // eslint-disable-next-line no-console
  console.log('  ✓ 清空旧数据');

  const { test } = await seedUsers();
  // eslint-disable-next-line no-console
  console.log('  ✓ 创建 3 个用户');

  const categories = await seedCategories();
  const categoryMap: Record<string, string> = {};
  for (const c of categories) categoryMap[c.name] = c.id;
  // eslint-disable-next-line no-console
  console.log('  ✓ 创建 6 个分类');

  const products = await seedProducts(categoryMap);
  // eslint-disable-next-line no-console
  console.log(`  ✓ 创建 ${products.length} 个商品`);

  const coupons = await seedCoupons();
  // eslint-disable-next-line no-console
  console.log(`  ✓ 创建 ${coupons.length} 个券模板`);

  const prizes = await seedPrizes();
  // eslint-disable-next-line no-console
  console.log(`  ✓ 创建 ${prizes.length} 个奖品`);

  await seedAchievements();
  // eslint-disable-next-line no-console
  console.log('  ✓ 创建 12 个成就');

  // test 用户预置数据
  await seedTestUserData(test.id, products, coupons);
  // eslint-disable-next-line no-console
  console.log('  ✓ test 用户预置数据 (3 券 / 500 积分 / 2 订单 / 5 收藏 / 3 签到 / 1 通关)');

  // eslint-disable-next-line no-console
  console.log('\n🎉 种子数据填充完成！\n');
  // eslint-disable-next-line no-console
  console.log('演示账号:');
  // eslint-disable-next-line no-console
  console.log('  admin:  admin@luckyshop.com / admin123');
  // eslint-disable-next-line no-console
  console.log('  test:   test@luckyshop.com  / test123   (预置完整数据)');
  // eslint-disable-next-line no-console
  console.log('  demo:   demo@luckyshop.com  / demo123\n');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('❌ 种子数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
