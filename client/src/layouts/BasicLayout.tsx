import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Space, Typography, Button, Dropdown, Avatar, Badge } from 'antd';
import {
  HomeOutlined,
  ShoppingOutlined,
  GiftOutlined,
  UserOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  MoonOutlined,
  SunOutlined,
  TrophyOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import SearchBar from '@components/SearchBar';
import { useThemeStore } from '@store/themeStore';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@store/authStore';
import { getMe } from '@api/auth';
import { useQuery } from '@tanstack/react-query';
import { getCart } from '@api/cart';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function BasicLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser, logout, isLoggedIn: checkLoggedIn } = useAuthStore();

  useEffect(() => {
    if (checkLoggedIn() && !user) {
      getMe()
        .then(setUser)
        .catch(() => logout());
    }
  }, [checkLoggedIn(), logout, setUser, user]);

  // 购物车徽标
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: checkLoggedIn(),
    refetchInterval: 30000,
  });

  const { theme, toggleTheme } = useThemeStore();
  const selectedKey =
    location.pathname === '/'
      ? '/'
      : location.pathname.split('/')[1]
        ? `/${location.pathname.split('/')[1]}`
        : '/';
  const selectedCartCount =
    cartData?.items.filter((item) => item.selected && item.isActive).length || 0;

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">首页</Link> },
    { key: '/products', icon: <ShoppingOutlined />, label: <Link to="/products">商品</Link> },
    { key: '/games', icon: <GiftOutlined />, label: <Link to="/games">游戏</Link> },
    { key: '/user', icon: <UserOutlined />, label: <Link to="/user">我的</Link> },
  ];

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心', onClick: () => navigate('/user') },
    {
      key: 'orders',
      icon: <LogoutOutlined />,
      label: '我的订单',
      onClick: () => navigate('/orders'),
    },
    {
      key: 'prizes',
      icon: <GiftOutlined />,
      label: '我的奖品',
      onClick: () => navigate('/prizes'),
    },
    { key: 'admin', icon: <UserOutlined />, label: '管理后台', onClick: () => navigate('/admin') },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/');
      },
    },
  ];

  // 移动端 TabBar
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [mobile, setMobile] = useState(isMobile);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  return (
    <Layout className="app-layout">
      <ScrollToTop />
      <Header className={`app-header${scrolled ? ' scrolled' : ''}`}>
        <div className="app-header-inner">
          <div className="header-left">
            <Link to="/" className="brand-logo" aria-label="我买我卖 首页">
              <span className="brand-logo-mark">🦊</span>
              <span className="brand-logo-text">
                <span className="brand-logo-title">我买我卖</span>
                <span className="brand-logo-subtitle">购物即游戏</span>
              </span>
            </Link>
            {!mobile && <SearchBar />}
            {!mobile && (
              <Menu
                mode="horizontal"
                selectedKeys={[selectedKey]}
                items={menuItems}
                className="header-nav"
              />
            )}
          </div>

          <div className="header-actions">
            {mobile && (
              <Link to="/products?search=1" className="header-icon-button" aria-label="搜索">
                <SearchOutlined style={{ fontSize: 18 }} />
              </Link>
            )}
            <button
              type="button"
              className="header-icon-button"
              onClick={toggleTheme}
              title={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
              aria-label={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
            >
              {theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            </button>
            {checkLoggedIn() ? (
              <>
                <Link to="/cart" className="header-icon-button" aria-label="购物车">
                  <Badge count={selectedCartCount} size="small">
                    <ShoppingCartOutlined style={{ fontSize: 18 }} />
                  </Badge>
                </Link>
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                  <Space style={{ cursor: 'pointer' }}>
                    <Avatar
                      size="small"
                      src={user?.avatar}
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      {user?.username?.[0]?.toUpperCase()}
                    </Avatar>
                    {!mobile && <Text>{user?.username}</Text>}
                  </Space>
                </Dropdown>
              </>
            ) : (
              <Link to="/login">
                <Button type="primary" size="small">
                  登录
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Header>

      <Content className="app-content">
        <Outlet />
      </Content>

      {/* 移动端底部 TabBar */}
      {mobile && (
        <nav className="mobile-tabbar" aria-label="移动端主导航">
          {[
            { path: '/', icon: <HomeOutlined />, label: '首页' },
            { path: '/products', icon: <ShoppingOutlined />, label: '商品' },
            {
              path: '/cart',
              icon: <ShoppingCartOutlined />,
              label: '购物车',
              badge: selectedCartCount,
            },
            { path: '/games', icon: <GiftOutlined />, label: '游戏' },
            { path: '/user', icon: <UserOutlined />, label: '我的' },
          ].map((tab) => {
            const active =
              location.pathname === tab.path ||
              (tab.path !== '/' && location.pathname.startsWith(tab.path));
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`mobile-tabbar-item ${active ? 'active' : ''}`}
              >
                <Badge count={tab.badge || 0} size="small" offset={[8, -2]}>
                  <span className="mobile-tabbar-icon">{tab.icon}</span>
                </Badge>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {!mobile && (
        <Footer className="app-footer">
          <div className="container" style={{ textAlign: 'center', padding: '24px 0' }}>
            <Space size="large" wrap>
              <Link to="/products">全部商品</Link>
              <Link to="/games">游戏大厅</Link>
              <Link to="/prizes">奖品中心</Link>
              <Link to="/user">个人中心</Link>
              <Link to="/admin">
                <TrophyOutlined /> 管理后台
              </Link>
            </Space>
            <br />
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'inline-block' }}>
              🦊 我买我卖 5.0 · 购物即游戏 · ©2026
            </Text>
          </div>
        </Footer>
      )}
    </Layout>
  );
}
