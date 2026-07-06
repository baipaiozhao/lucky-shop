import SEO from '@components/SEO';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Typography,
  Button,
  Space,
  Tag,
  message,
  Spin,
  Empty,
  Image,
  Card,
  Row,
  Col,
  Divider,
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  SafetyCertificateOutlined,
  TruckOutlined,
  GiftOutlined,
  StarFilled,
} from '@ant-design/icons';
import { getProductById, addFavorite, removeFavorite, checkFavorite } from '@api/products';
import { addToCart } from '@api/cart';
import { http } from '@api/client';
import type { Product } from '@types';
import { formatPrice, placeholderImage } from '../utils/format';

const { Title, Paragraph, Text } = Typography;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [isFav, setIsFav] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id!),
    enabled: !!id,
  });

  const { data: isFavData } = useQuery({
    queryKey: ['favorite', id],
    queryFn: () => checkFavorite(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (isFavData !== undefined) setIsFav(isFavData);
  }, [isFavData]);

  const cartMutation = useMutation({
    mutationFn: () => addToCart(id!, quantity),
    onSuccess: () => {
      message.success('已加入购物车');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: unknown) => message.error(getErrorMessage(error, '加入失败')),
  });

  const favMutation = useMutation({
    mutationFn: async () => {
      if (isFav) {
        await removeFavorite(id!);
      } else {
        await addFavorite(id!);
      }
      setIsFav(!isFav);
    },
    onSuccess: () => message.success(isFav ? '已取消收藏' : '已加入收藏'),
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related', id],
    queryFn: async () => {
      const res = await http.get(`/products/${id}/related`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!product) {
    return (
      <div className="container">
        <div className="surface-card" style={{ padding: 48 }}>
          <Empty description="商品不存在">
            <Button type="primary" onClick={() => navigate('/products')}>
              返回商品列表
            </Button>
          </Empty>
        </div>
      </div>
    );
  }

  const p = product as Product;

  return (
    <div className="container">
      <SEO title={p?.name || '商品详情'} description={p?.description} image={p?.images?.[0]} type="product" />
      <div className="product-detail-grid">
        <div className="surface-card" style={{ padding: 16 }}>
          <Image
            src={p.images?.[0] || placeholderImage(p.name, p.category?.name)}
            alt={p.name}
            fallback={placeholderImage(p.name, p.category?.name)}
            style={{ borderRadius: 18, width: "100%", maxHeight: 520, objectFit: "cover" }}
          />
          {p.images && p.images.length > 1 && (
            <Space wrap style={{ marginTop: 12 }}>
              {p.images.map((img: string, i: number) => (
                <Image
                  key={i}
                  src={img}
                  width={68}
                  height={68}
                  fallback={placeholderImage(p.name, p.category?.name)}
                  style={{ borderRadius: 12, objectFit: "cover" }}
                />
              ))}
            </Space>
          )}
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Tag color="orange">{p.category?.name}</Tag>
              {p.isFeatured && <Tag color="red">精选</Tag>}
              {p.isNew && <Tag color="green">新品</Tag>}
              {p.stock > 0 ? <Tag color="blue">现货</Tag> : <Tag color="default">售罄</Tag>}
            </div>

            <Title level={2} style={{ margin: 0, letterSpacing: '-0.04em' }}>
              {p.name}
            </Title>

            <Paragraph className="muted-text" style={{ fontSize: 16, lineHeight: 1.8 }}>
              {p.description}
            </Paragraph>

            <div
              style={{
                padding: 20,
                borderRadius: 20,
                background:
                  'linear-gradient(135deg, var(--color-primary-soft), var(--color-warning-soft))',
                border: '1px solid rgba(255,107,53,0.18)',
              }}
            >
              <Text style={{ color: 'var(--color-primary)', fontSize: 36, fontWeight: 900 }}>
                ¥{formatPrice(p.price)}
              </Text>
              {p.originalPrice && (
                <Text delete type="secondary" style={{ marginLeft: 12, fontSize: 16 }}>
                  {formatPrice(p.originalPrice)}
                </Text>
              )}
              <div style={{ marginTop: 8, color: 'var(--color-text-muted)' }}>
                下单后获得游戏机会，可抽取优惠券 / 积分 / 实物奖品
              </div>
            </div>

            <div className="stat-strip" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="stat-tile">
                <Text type="secondary">销量</Text>
                <div style={{ fontWeight: 900, fontSize: 20 }}>{p.sales}</div>
              </div>
              <div className="stat-tile">
                <Text type="secondary">评分</Text>
                <div style={{ fontWeight: 900, fontSize: 20 }}>
                  <StarFilled style={{ color: '#FFD166' }} /> {p.rating?.toFixed(1) ?? '5.0'}
                </div>
              </div>
              <div className="stat-tile">
                <Text type="secondary">库存</Text>
                <div style={{ fontWeight: 900, fontSize: 20 }}>
                  {p.stock > 0 ? `${p.stock} 件` : '已售罄'}
                </div>
              </div>
            </div>

            <Divider style={{ margin: '4px 0' }} />

            <div>
              <Text strong>购买数量</Text>
              <Space style={{ marginLeft: 12 }}>
                <Button size="small" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  -
                </Button>
                <Text strong style={{ minWidth: 28, textAlign: 'center' }}>
                  {quantity}
                </Text>
                <Button size="small" onClick={() => setQuantity(Math.min(p.stock, quantity + 1))}>
                  +
                </Button>
              </Space>
            </div>

            <Space size="middle" wrap>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                loading={cartMutation.isPending}
                disabled={p.stock === 0}
                onClick={() => cartMutation.mutate()}
              >
                加入购物车
              </Button>
              <Button
                size="large"
                icon={
                  isFav ? (
                    <HeartFilled style={{ color: 'var(--color-error)' }} />
                  ) : (
                    <HeartOutlined />
                  )
                }
                loading={favMutation.isPending}
                onClick={() => favMutation.mutate()}
              >
                {isFav ? '已收藏' : '收藏'}
              </Button>
            </Space>

            <div className="surface-card" style={{ padding: 14, boxShadow: 'none' }}>
              <Space wrap size="large">
                <Text>
                  <SafetyCertificateOutlined style={{ color: 'var(--color-success)' }} /> 正品保障
                </Text>
                <Text>
                  <TruckOutlined style={{ color: 'var(--color-secondary)' }} /> 满 99 免运
                </Text>
                <Text>
                  <GiftOutlined style={{ color: 'var(--color-primary)' }} /> 购物送游戏机会
                </Text>
              </Space>
            </div>
          </Space>
        </div>
      </div>

      {relatedProducts?.length > 0 && (
        <section className="page-section" style={{ marginTop: 40 }}>
          <div className="section-heading">
            <div>
              <span className="section-kicker">🔗 Related</span>
              <Title level={3} style={{ margin: '10px 0 0' }}>
                相关推荐
              </Title>
            </div>
            <Button type="link" onClick={() => navigate('/products')}>
              查看更多 →
            </Button>
          </div>
          <Row gutter={[16, 16]}>
            {relatedProducts.map((rp: Product) => (
              <Col xs={12} sm={8} md={6} key={rp.id}>
                <Card
                  hoverable
                  className="product-card"
                  cover={
                    <div className="product-card-cover" style={{ height: 160 }}>
                      <img
                        src={rp.images?.[0] || placeholderImage(rp.name)}
                        alt={rp.name}
                        loading="lazy"
                      />
                    </div>
                  }
                  onClick={() => navigate(`/products/${rp.id}`)}
                  styles={{ body: { padding: '12px' } }}
                >
                  <div className="product-title">{rp.name}</div>
                  <div className="price-text">¥{formatPrice(rp.price)}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                    已售 {rp.sales}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </section>
      )}
    </div>
  );
}

