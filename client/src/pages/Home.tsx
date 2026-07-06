import { useQuery } from '@tanstack/react-query';
import { Button, Card, Col, Row, Skeleton, Space, Statistic, Tag, Typography } from 'antd';
import {
  GiftOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getFeaturedProducts, getHotProducts } from '@api/products';
import type { Product } from '@types';
import { formatPrice, placeholderImage } from '../utils/format';
import SEO from '@components/SEO';

const { Title, Paragraph, Text } = Typography;

function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      className="product-card"
      cover={
        <div className="product-card-cover" style={{ height: compact ? 160 : 190 }}>
          <img
            src={product.images?.[0] || placeholderImage(product.name, product.category?.name)}
            alt={product.name}
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = placeholderImage(product.name, product.category?.name); }}
          />
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            {product.isFeatured && <Tag color="red">精选</Tag>}
            {product.isNew && <Tag color="green">新品</Tag>}
          </div>
        </div>
      }
      onClick={() => navigate(`/products/${product.id}`)}
      styles={{ body: { padding: compact ? '12px' : '14px' } }}
    >
      <div className="product-title">{product.name}</div>
      <Space align="baseline" size={8}>
        <span className="price-text">¥{formatPrice(product.price)}</span>
        {product.originalPrice && (<Text delete type="secondary" style={{ fontSize: 12 }}>
            {formatPrice(product.originalPrice)}
          </Text>
        )}
      </Space>
      <div style={{ color: 'var(--color-text-muted)', fontSize: 12, marginTop: 6 }}>
        已售 {product.sales} · ⭐ {product.rating?.toFixed(1) ?? '5.0'}
      </div>
    </Card>
  );
}

function ProductSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: count }).map((_, index) => (
        <Col xs={12} sm={12} md={6} lg={6} key={index}>
          <Card className="product-card">
            <Skeleton.Image active style={{ width: '100%', height: 160 }} />
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const { data: featured, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured'],
    queryFn: getFeaturedProducts,
  });

  const { data: hot, isLoading: hotLoading } = useQuery({
    queryKey: ['hot'],
    queryFn: getHotProducts,
  });

  return (
    <div className="container">
      <SEO title="首页" description="购物即游戏 — 5款小游戏等你挑战" />
      <section
        className="hero-section"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 'clamp(40px, 8vw, 80px) min(5vw, 72px) clamp(36px, 6vw, 64px)',
          marginBottom: 40,
          color: '#fff',
          background: 'var(--gradient-hero)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-lg), var(--glow-primary)',
          border: '1px solid rgba(255,255,255,0.18)',
        }}
      >
        <div className="hero-orb" style={{ right: '8%', top: 32, fontSize: 64 }}>
          🎁
        </div>
        <div
          className="hero-orb"
          style={{ right: '22%', bottom: 22, fontSize: 42, animationDelay: '1s' }}
        >
          🎮
        </div>
        <div
          className="hero-orb"
          style={{ left: '48%', top: 28, fontSize: 34, animationDelay: '1.8s' }}
        >
          ✨
        </div>

        <div style={{ maxWidth: 680, position: 'relative', zIndex: 1 }}>
          <span
            style={{
              display: 'inline-flex',
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.2)',
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            🦊 我买我卖 5.0 · 游戏化电商平台
          </span>
          <Title
            level={1}
            style={{
              fontSize: 'clamp(36px, 7vw, 68px)',
              margin: 0,
              color: '#fff',
              letterSpacing: '-0.06em',
            }}
          >
            购物即游戏，
            <br />
            每次下单都有惊喜。
          </Title>
          <Paragraph
            style={{
              maxWidth: 560,
              marginTop: 18,
              color: 'rgba(255,255,255,0.92)',
              fontSize: 18,
              lineHeight: 1.8,
            }}
          >
            浏览商品、完成订单、挑战 5 款小游戏，赢取优惠券 / 积分 /
            实物奖品，形成从购物到复购的完整闭环。
          </Paragraph>
          <Space size="middle" wrap style={{ marginTop: 22 }}>
            <Button
              type="primary"
              size="large"
              icon={<ShoppingOutlined />}
              onClick={() => navigate('/products')}
            >
              立即开始购物
            </Button>
            <Button size="large" ghost icon={<GiftOutlined />} onClick={() => navigate('/games')}>
              前往游戏大厅
            </Button>
          </Space>
        </div>

        <div className="stat-strip hero-stats" style={{ marginTop: 40, position: 'relative', zIndex: 1 }}>
          <div className="stat-tile">
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.82)' }}>自研小游戏</span>}
              value={5}
              suffix="款"
              valueStyle={{ color: '#fff' }}
              prefix={<ThunderboltOutlined />}
            />
          </div>
          <div className="stat-tile">
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.82)' }}>奖励段位</span>}
              value={3}
              suffix="档"
              valueStyle={{ color: '#fff' }}
              prefix={<TrophyOutlined />}
            />
          </div>
          <div className="stat-tile">
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.82)' }}>核心子系统</span>}
              value={12}
              valueStyle={{ color: '#fff' }}
            />
          </div>
          <div className="stat-tile">
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.82)' }}>API 契约</span>}
              value={80}
              suffix="+"
              valueStyle={{ color: '#fff' }}
            />
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">🌟 Featured</span>
            <Title level={3} style={{ margin: '10px 0 0' }}>
              精选商品
            </Title>
          </div>
          <Button type="link" onClick={() => navigate('/products')}>
            查看全部 →
          </Button>
        </div>
        {featuredLoading ? (
          <ProductSkeletonGrid count={4} />
        ) : (
          <Row gutter={[16, 16]}>
            {featured?.slice(0, 4).map((product: Product) => (
              <Col xs={12} sm={12} md={6} lg={6} key={product.id}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        )}
      </section>

      <section className="page-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">🔥 Hot Sales</span>
            <Title level={3} style={{ margin: '10px 0 0' }}>
              热销榜单
            </Title>
          </div>
          <Button type="link" onClick={() => navigate('/products?sort=sales')}>
            查看热销 →
          </Button>
        </div>
        {hotLoading ? (
          <ProductSkeletonGrid count={8} />
        ) : (
          <Row gutter={[16, 16]}>
            {hot?.slice(0, 8).map((product: Product) => (
              <Col xs={12} sm={12} md={6} lg={3} key={product.id}>
                <ProductCard product={product} compact />
              </Col>
            ))}
          </Row>
        )}
      </section>
    </div>
  );
}

