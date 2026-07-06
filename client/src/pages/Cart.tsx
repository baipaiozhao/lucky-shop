import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '../utils/format';
import {
  Card,
  Typography,
  Button,
  Space,
  Checkbox,
  InputNumber,
  message,
  Spin,
  Empty,
  Image,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  DeleteOutlined,
  GiftOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeCartItem, clearCart } from '@api/cart';
import type { CartItem } from '@types';

const { Title, Text, Paragraph } = Typography;

export default function Cart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: () => {
      message.success('已移除');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      message.success('购物车已清空');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  if (!data?.items?.length) {
    return (
      <div className="container">
        <div className="surface-card" style={{ padding: '72px 16px', textAlign: 'center' }}>
          <Empty description="购物车是空的" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button
              type="primary"
              size="large"
              icon={<ShoppingOutlined />}
              onClick={() => navigate('/products')}
            >
              去逛逛
            </Button>
          </Empty>
        </div>
      </div>
    );
  }

  const items = data.items as CartItem[];
  const selectedItems = items.filter((item) => item.selected && item.isActive);
  const totalPrice = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gameChances = selectedItems.length > 0 ? 1 : 0;
  const shippingFee = totalPrice >= 9900 || totalPrice === 0 ? 0 : 1000;

  return (
    <div className="container">
      <section className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <span className="section-kicker">
              <ShoppingCartOutlined /> Cart
            </span>
            <Title level={2} style={{ margin: '12px 0 8px' }}>
              购物车 ({items.length})
            </Title>
            <Paragraph className="muted-text" style={{ marginBottom: 0 }}>
              确认商品数量与库存状态，结算成功后即可获得游戏挑战机会。
            </Paragraph>
          </Col>
          <Col xs={24} md={8}>
            <div className="stat-strip" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="stat-tile">
                <Text type="secondary">已选商品</Text>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{selectedItems.length}</div>
              </div>
              <div className="stat-tile">
                <Text type="secondary">游戏机会</Text>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-primary)' }}>
                  <ThunderboltOutlined /> {gameChances}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </section>

      <Row gutter={[20, 20]} align="top">
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {items.map((item: CartItem) => (
              <Card key={item.id} className="surface-card" styles={{ body: { padding: 16 } }}>
                <div className="cart-item-row" style={{ opacity: item.isActive ? 1 : 0.58 }}>
                  <Checkbox
                    checked={item.selected}
                    disabled={!item.isActive}
                    onChange={() =>
                      updateMutation.mutate({ itemId: item.id, quantity: item.quantity })
                    }
                  />
                  <Image
                    src={item.productImage || 'https://placehold.co/160x160/FF6B35/FFF?text=P'}
                    width={92}
                    height={92}
                    preview={false}
                    style={{ borderRadius: 16, objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, marginBottom: 6, color: 'var(--color-text)' }}>
                      {item.productName}
                    </div>
                    <div className="price-text">¥{formatPrice(item.price)}</div>
                    <Space size="small" wrap style={{ marginTop: 6 }}>
                      {!item.isActive && <Text type="danger">商品已下架</Text>}
                      {item.isActive && item.stock < item.quantity && (
                        <Text type="warning">库存不足</Text>
                      )}
                      <Text className="muted-text">库存: {item.stock}</Text>
                    </Space>
                  </div>
                  <Space direction="vertical" align="center">
                    <InputNumber
                      min={1}
                      max={item.stock}
                      value={item.quantity}
                      size="middle"
                      onChange={(value) => {
                        if (value && value !== item.quantity) {
                          updateMutation.mutate({ itemId: item.id, quantity: value });
                        }
                      }}
                    />
                    <Text strong>小计 ¥{((item.price * item.quantity) / 100).toFixed(2)}</Text>
                  </Space>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    loading={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(item.id)}
                  />
                </div>
              </Card>
            ))}
          </Space>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="glass-card checkout-summary" styles={{ body: { padding: 22 } }}>
            <Title level={4} style={{ marginTop: 0 }}>
              结算摘要
            </Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>商品合计</Text>
                <Text strong>¥{formatPrice(totalPrice)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>预估运费</Text>
                <Text strong>
                  {shippingFee === 0 ? '免运费' : `${formatPrice(shippingFee)}`}
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>
                  <GiftOutlined /> 购物奖励
                </Text>
                <Text strong style={{ color: 'var(--color-primary)' }}>
                  {gameChances} 次游戏机会
                </Text>
              </div>
              <Divider style={{ margin: '4px 0' }} />
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
              >
                <Text strong>应付预估</Text>
                <Text strong style={{ fontSize: 26, color: 'var(--color-primary)' }}>
                  ¥{((totalPrice + shippingFee) / 100).toFixed(2)}
                </Text>
              </div>
              <Button
                type="primary"
                size="large"
                block
                disabled={selectedItems.length === 0}
                onClick={() => navigate('/checkout')}
              >
                去结算
              </Button>
              <Button
                block
                loading={clearMutation.isPending}
                onClick={() => clearMutation.mutate()}
              >
                清空购物车
              </Button>
              <Paragraph className="muted-text" style={{ marginBottom: 0, fontSize: 12 }}>
                实际优惠券、积分抵扣与最终金额将在结算页实时计算。
              </Paragraph>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
