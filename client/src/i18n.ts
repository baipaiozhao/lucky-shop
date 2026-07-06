import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  zh: {
    translation: {
      // Nav
      home: '首页',
      products: '商品',
      games: '游戏',
      cart: '购物车',
      user: '我的',
      login: '登录',
      logout: '退出登录',
      admin: '管理后台',

      // Home
      hero_title: '购物即游戏',
      hero_subtitle: '每次下单都有惊喜',
      hero_cta: '立即开始购物',
      hero_games: '前往游戏大厅',
      featured: '精选商品',
      hot_sales: '热销榜单',
      view_all: '查看全部',

      // Products
      product_list: '商品列表',
      search_placeholder: '搜索商品...',
      sort_sales: '销量优先',
      sort_price_asc: '价格低到高',
      sort_price_desc: '价格高到低',
      sort_newest: '最新上架',
      reset_filter: '重置筛选',
      all_categories: '全部分类',
      no_products: '暂无商品',
      in_stock: '库存',
      sold: '已售',

      // Cart
      cart_title: '购物车',
      cart_empty: '购物车是空的',
      go_shopping: '去逛逛',
      selected_items: '已选商品',
      game_chances: '游戏机会',
      checkout_summary: '结算摘要',
      subtotal: '商品合计',
      shipping_fee: '预计运费',
      free_shipping: '免运费',
      estimated_total: '应付估计',
      go_checkout: '去结算',
      clear_cart: '清空购物车',

      // Order
      order_preview: '结算预览',
      order_create: '创建订单',
      order_list: '我的订单',
      order_detail: '订单详情',
      cancel_order: '取消订单',
      confirm_receipt: '确认收货',
      order_status_pending: '待支付',
      order_status_paid: '已支付',
      order_status_shipped: '已发货',
      order_status_completed: '已完成',
      order_status_cancelled: '已取消',

      // Games
      game_hall: '游戏大厅',
      game_play: '开始游戏',
      game_result: '游戏结果',
      game_passed: '恭喜通关！',
      game_failed: '继续加油！',
      wheel_game: '幸运转盘',
      scratch_game: '刮刮乐',
      memory_game: '记忆翻牌',
      game_2048: '2048合成',
      reaction_game: '反应挑战',

      // Prizes
      my_prizes: '我的奖品',
      my_coupons: '我的优惠券',
      my_points: '我的积分',
      my_gifts: '实物奖品',

      // User
      profile: '个人中心',
      addresses: '收货地址',
      my_orders: '我的订单',
      change_password: '修改密码',
      forgot_password: '忘记密码',

      // Common
      save: '保存',
      cancel: '取消',
      delete: '删除',
      confirm: '确认',
      loading: '加载中...',
      error: '出错了',
      retry: '重试',
      price_unit: '¥',
      points_unit: '积分',
    },
  },
  en: {
    translation: {
      home: 'Home',
      products: 'Products',
      games: 'Games',
      cart: 'Cart',
      user: 'Me',
      login: 'Login',
      logout: 'Logout',
      admin: 'Admin',

      hero_title: 'Shop & Play',
      hero_subtitle: 'Every order is a surprise',
      hero_cta: 'Start Shopping',
      hero_games: 'Game Hall',
      featured: 'Featured',
      hot_sales: 'Hot Sales',
      view_all: 'View All',

      product_list: 'Products',
      search_placeholder: 'Search products...',
      sort_sales: 'Best Selling',
      sort_price_asc: 'Price: Low to High',
      sort_price_desc: 'Price: High to Low',
      sort_newest: 'Newest',
      reset_filter: 'Reset',
      all_categories: 'All Categories',
      no_products: 'No products found',
      in_stock: 'Stock',
      sold: 'Sold',

      cart_title: 'Shopping Cart',
      cart_empty: 'Your cart is empty',
      go_shopping: 'Go Shopping',
      selected_items: 'Selected',
      game_chances: 'Game Chances',
      checkout_summary: 'Order Summary',
      subtotal: 'Subtotal',
      shipping_fee: 'Shipping',
      free_shipping: 'Free',
      estimated_total: 'Estimated Total',
      go_checkout: 'Checkout',
      clear_cart: 'Clear Cart',

      order_preview: 'Order Preview',
      order_create: 'Place Order',
      order_list: 'My Orders',
      order_detail: 'Order Detail',
      cancel_order: 'Cancel',
      confirm_receipt: 'Confirm Receipt',
      order_status_pending: 'Pending',
      order_status_paid: 'Paid',
      order_status_shipped: 'Shipped',
      order_status_completed: 'Completed',
      order_status_cancelled: 'Cancelled',

      game_hall: 'Game Hall',
      game_play: 'Play',
      game_result: 'Result',
      game_passed: 'You Win!',
      game_failed: 'Try Again!',
      wheel_game: 'Lucky Wheel',
      scratch_game: 'Scratch Card',
      memory_game: 'Memory Match',
      game_2048: '2048',
      reaction_game: 'Reaction',

      my_prizes: 'My Prizes',
      my_coupons: 'My Coupons',
      my_points: 'My Points',
      my_gifts: 'My Gifts',

      profile: 'Profile',
      addresses: 'Addresses',
      my_orders: 'My Orders',
      change_password: 'Change Password',
      forgot_password: 'Forgot Password',

      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      confirm: 'Confirm',
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      price_unit: '$',
      points_unit: 'pts',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'zh',
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
