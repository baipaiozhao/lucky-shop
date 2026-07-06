import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '../utils/format';
import { Button, Card, Checkbox, Divider, Empty, message, Radio, Space, Spin, Switch, Typography, Collapse } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAddresses, getMe } from '@api/auth';
import { getCart } from '@api/cart';
import type { CartItem } from '@api/cart';
import { createOrder, previewOrder, type OrderPreview } from '@api/orders';
import type { User } from '@types';

const { Title, Text } = Typography;
const { Panel } = Collapse;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '下单失败';
}

function isSelectedAvailableItem(item: CartItem): boolean {
  return item.selected && item.isActive;
}

export default function Checkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState('mock_alipay');
  const [usePoints, setUsePoints] = useState(true);
  const [selectedCouponIds, setSelectedCouponIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
  });

  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
  });

  const selectedAddress = addresses?.find((address) => address.isDefault) || addresses?.[0];
  const selectedItems = cartData?.items.filter(isSelectedAvailableItem) || [];
  const totalPrice = cartData?.summary.totalPrice || 0;

  // Load user profile and order preview
  useEffect(() => {
    if (selectedItems.length > 0) {
      Promise.all([
        getMe(),
        previewOrder({
          items: selectedItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          usePoints: usePoints ? 1 : 0,
        }),
      ]).then(([userData, previewData]) => {
        setUser(userData);
        setPreview(previewData);
      }).catch((err) => {
        console.error('Failed to load preview:', err);
      });
    }
  }, [selectedItems, usePoints]);

  const handleCouponChange = (couponId: string, checked: boolean) => {
    if (checked) {
      setSelectedCouponIds([couponId]); // Only allow one coupon for now
    } else {
      setSelectedCouponIds(selectedCouponIds.filter((id) => id !== couponId));
    }
  };

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAddress) {
        message.error('请选择收货地址');
        return undefined;
      }
      return createOrder({
        addressId: selectedAddress.id,
        paymentMethod,
        couponIds: selectedCouponIds,
        usePoints: preview?.pointsUsed || 0,
      });
    },
    onSuccess: (order) => {
      if (order) {
        message.success('支付成功！');
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        navigate(`/pay-success/${order.id}`);
      }
    },
    onError: (error: unknown) => message.error(getErrorMessage(error)),
  });

  const finalAmount = preview ? preview.finalAmount : totalPrice;
  const shippingFee = preview?.shippingFee ?? (totalPrice >= 9900 ? 0 : 1000);
  const couponDiscount = preview?.couponDiscount || 0;
  const pointsUsed = preview?.pointsUsed || 0;

  if (cartLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!selectedItems.length) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 16px' }}>
        <Empty description="购物车没有选中任何商品">
          <Button type="primary" onClick={() => navigate('/products')}>
            去逛逛
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>确认订单</Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 收货地址 */}
        <Card title="📍 收货地址" size="small">
          {selectedAddress ? (
            <div>
              <Text strong>{selectedAddress.name}</Text> <Text>{selectedAddress.phone}</Text>
              <div>
                {selectedAddress.province}
                {selectedAddress.city}
                {selectedAddress.district}
                {selectedAddress.detail}
              </div>
              <Button type="link" size="small" onClick={() => navigate('/user')}>
                修改地址
              </Button>
            </div>
          ) : (
            <Empty description="暂无收货地址" image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <Button type="primary" onClick={() => navigate('/user')}>
                添加地址
              </Button>
            </Empty>
          )}
        </Card>

        {/* 商品清单 */}
        <Card title="📦 商品清单" size="small">
          {selectedItems.map((item) => (
            <div
              key={item.id}
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}
            >
              <Text>
                {item.productName} x {item.quantity}
              </Text>
              <Text strong>¥{((item.price * item.quantity) / 100).toFixed(2)}</Text>
            </div>
          ))}
        </Card>

        {/* 积分抵扣 */}
        <Card title="🎯 积分抵扣" size="small">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text>使用积分抵扣（当前积分: {user?.points || 0}）</Text>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  最多可使用订单金额的30%，1积分 = 1分钱
                </Text>
              </div>
            </div>
            <Switch checked={usePoints} onChange={setUsePoints} />
          </div>
          {usePoints && pointsUsed > 0 && (
            <div style={{ marginTop: 8, color: '#52c41a' }}>
              <Text strong>本次可抵扣: ¥{formatPrice(pointsUsed)}</Text>
            </div>
          )}
        </Card>

        {/* 优惠券 */}
        <Card title="🎫 优惠券" size="small">
          {preview?.availableCoupons && preview.availableCoupons.length > 0 ? (
            <Collapse ghost>
              {preview.availableCoupons.map((coupon) => (
                <Panel
                  key={coupon.id}
                  header={
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Checkbox
                        checked={selectedCouponIds.includes(coupon.id)}
                        onChange={(e) => handleCouponChange(coupon.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Text strong>{coupon.name}</Text>
                      </Checkbox>
                      <Text type="success">
                        满¥{(coupon.minSpend / 100).toFixed(2)}可用
                      </Text>
                    </div>
                  }
                >
                  <div style={{ paddingLeft: 24 }}>
                    <Text type="secondary">优惠金额: ¥{(coupon.amount / 100).toFixed(2)}</Text>
                  </div>
                </Panel>
              ))}
            </Collapse>
          ) : (
            <Text type="secondary">暂无可用优惠券，去玩游戏赢取优惠券吧！</Text>
          )}
          {couponDiscount > 0 && (
            <div style={{ marginTop: 8, color: '#52c41a' }}>
              <Text strong>优惠券抵扣: ¥{formatPrice(couponDiscount)}</Text>
            </div>
          )}
        </Card>

        {/* 支付方式 */}
        <Card title="💰 支付方式" size="small">
          <Radio.Group
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          >
            <Space direction="vertical">
              <Radio value="mock_alipay">📱 模拟支付宝</Radio>
              <Radio value="mock_wechat">💬 模拟微信支付</Radio>
              <Radio value="mock_bank">💳 模拟银行卡</Radio>
              <Radio value="mock_cod">💵 模拟货到付款</Radio>
            </Space>
          </Radio.Group>
        </Card>

        {/* 价格明细 */}
        <Card title="价格明细" size="small">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text>商品总额</Text>
            <Text>¥{formatPrice(totalPrice)}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text>运费</Text>
            <Text>{shippingFee === 0 ? '免运费' : `¥${formatPrice(shippingFee)}`}</Text>
          </div>
          {couponDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="success">优惠券抵扣</Text>
              <Text type="success">-¥{formatPrice(couponDiscount)}</Text>
            </div>
          )}
          {pointsUsed > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="success">积分抵扣</Text>
              <Text type="success">-¥{formatPrice(pointsUsed)}</Text>
            </div>
          )}
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text strong>应付总额</Text>
            <Text strong style={{ fontSize: 20, color: 'var(--color-primary)' }}>
              ¥{formatPrice(finalAmount)}
            </Text>
          </div>
        </Card>

        {/* 提交按钮 */}
        <Button
          type="primary"
          size="large"
          block
          loading={createOrderMutation.isPending}
          onClick={() => createOrderMutation.mutate()}
        >
          🔒 确认支付 ¥{formatPrice(finalAmount)}
        </Button>
      </Space>
    </div>
  );
}
