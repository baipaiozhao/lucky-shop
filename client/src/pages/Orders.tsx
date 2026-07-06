import { useQuery } from '@tanstack/react-query';
import { formatPrice } from '../utils/format';
import { Card, Typography, Button, Space, Tag, Empty, Spin, Tabs } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '@api/orders';
import type { Order } from '@types';

const { Title, Text } = Typography;

const statusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: '待支付' },
  paid: { color: 'blue', label: '已支付' },
  shipped: { color: 'purple', label: '已发货' },
  completed: { color: 'green', label: '已完成' },
  cancelled: { color: 'default', label: '已取消' },
  refunded: { color: 'red', label: '已退款' },
};

export default function Orders() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', status],
    queryFn: () => getOrders(status === 'all' ? undefined : { status }),
  });

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'paid', label: '已支付' },
    { key: 'shipped', label: '已发货' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' },
  ];

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div className="container" style={{ padding: '24px 16px' }}>
      <Title level={2}>我的订单</Title>

      <Tabs activeKey={status} onChange={setStatus} items={tabItems} />

      {!data?.orders?.length ? (
        <Empty description="暂无订单" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={() => navigate('/products')}>
            去逛逛
          </Button>
        </Empty>
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {data.orders.map((order: Order) => (
            <Card key={order.id} hoverable onClick={() => navigate(`/orders/${order.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Space>
                  <Text type="secondary">订单号: {order.orderNo}</Text>
                  <Tag color={statusMap[order.status]?.color}>{statusMap[order.status]?.label}</Tag>
                </Space>
                <Text type="secondary">{new Date(order.createdAt).toLocaleDateString()}</Text>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                {order.items.slice(0, 3).map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img
                      src={item.productImage || 'https://placehold.co/60x60/FF6B35/FFF?text=P'}
                      alt={item.productName}
                      style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontSize: 14 }}>{item.productName}</div>
                      <Text type="secondary">x{item.quantity}</Text>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Text type="secondary">共 {order.items.length} 件商品</Text>
                <Text strong style={{ fontSize: 18, color: 'var(--color-primary)' }}>
                  ¥{formatPrice(order.finalAmount)}
                </Text>
              </div>
            </Card>
          ))}
        </Space>
      )}
    </div>
  );
}
