import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '../utils/format';
import {
  Card,
  Typography,
  Button,
  Space,
  Descriptions,
  Timeline,
  Rate,
  Input,
  message,
  Spin,
  Empty,
  Image,
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CarOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { getOrderById } from '@api/orders';
import { http } from '@api/client';
import type { Order } from '@types';

const { Title, Text } = Typography;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

const statusMap: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  pending: { color: 'orange', label: '待支付', icon: <ClockCircleOutlined /> },
  paid: { color: 'blue', label: '已支付', icon: <CheckCircleOutlined /> },
  shipped: { color: 'purple', label: '已发货', icon: <CarOutlined /> },
  completed: { color: 'green', label: '已完成', icon: <InboxOutlined /> },
  cancelled: { color: 'default', label: '已取消', icon: <ClockCircleOutlined /> },
};

const statusSteps = ['pending', 'paid', 'shipped', 'completed'];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id!),
    enabled: !!id,
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: { productId: string; rating: number; content: string }) => {
      await http.post(`/products/${data.productId}/reviews`, {
        rating: data.rating,
        content: data.content,
        orderId: id,
      });
    },
    onSuccess: () => {
      message.success('评价成功！');
      setReviewText('');
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (error: unknown) => message.error(getErrorMessage(error, '评价失败')),
  });

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!order) return <Empty description="订单不存在" />;

  const o = order as Order;
  const currentIdx = statusSteps.indexOf(o.status);

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: 800, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          订单详情
        </Title>
        <Button onClick={() => navigate('/orders')}>返回订单列表</Button>
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 订单状态时间线 */}
        <Card title="📦 物流追踪" size="small">
          <Timeline
            items={statusSteps.map((step, i) => ({
              color: i <= currentIdx ? (o.status === 'cancelled' ? 'gray' : 'green') : 'gray',
              children: (
                <div>
                  <Text strong>{statusMap[step]?.label}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {i <= currentIdx && o.status !== 'cancelled'
                      ? o.status === step && o.paidAt
                        ? new Date(o.paidAt).toLocaleString()
                        : o.status === step && o.shippedAt
                          ? new Date(o.shippedAt).toLocaleString()
                          : o.status === step && o.completedAt
                            ? new Date(o.completedAt).toLocaleString()
                            : i < currentIdx
                              ? '已完成'
                              : ''
                      : '待处理'}
                  </Text>
                </div>
              ),
            }))}
          />
          {o.trackingNo && (
            <div style={{ marginTop: 16 }}>
              <Text>物流公司: {o.carrier || '未知'}</Text>
              <br />
              <Text>物流单号: {o.trackingNo}</Text>
            </div>
          )}
        </Card>

        {/* 商品清单 */}
        <Card title="📦 商品清单" size="small">
          {o.items.map((item) => (<div
              key={item.id}
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}
            >
              <Image
                src={item.productImage || 'https://placehold.co/80x80/FF6B35/FFF?text=P'}
                width={80}
                height={80}
                style={{ borderRadius: 8, objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{item.productName}</div>
                <Text type="secondary">x{item.quantity}</Text>
              </div>
              <Text strong>¥{(item.subtotal)}</Text>
            </div>
          ))}
        </Card>

        {/* 价格明细 */}
        <Card title="价格明细" size="small">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="商品总额">
              ¥{formatPrice(o.totalAmount)}
            </Descriptions.Item>
            <Descriptions.Item label="优惠金额">
              -¥{formatPrice(o.discount)}
            </Descriptions.Item>
            <Descriptions.Item
              label="实付金额"
              contentStyle={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: 18 }}
            >
              ¥{formatPrice(o.finalAmount)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 评价入口 */}
        {o.status === 'completed' && (
          <Card title="✍️ 商品评价" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Rate value={rating} onChange={setRating} />
              <Input.TextArea
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="分享您的购物体验..."
              />
              <Button
                type="primary"
                loading={reviewMutation.isPending}
                onClick={() => {
                  if (!reviewText.trim()) return message.error('请输入评价内容');
                  reviewMutation.mutate({
                    productId: o.items[0]?.productId || '',
                    rating,
                    content: reviewText,
                  });
                }}
              >
                提交评价
              </Button>
            </Space>
          </Card>
        )}

        {/* 订单信息 */}
        <Card title="订单信息" size="small">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="订单号">{o.orderNo}</Descriptions.Item>
            <Descriptions.Item label="支付方式">{o.paymentMethod}</Descriptions.Item>
            <Descriptions.Item label="下单时间">
              {new Date(o.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="支付时间">
              {o.paidAt ? new Date(o.paidAt).toLocaleString() : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="游戏次数">
              获得 {o.gameChances} 次，已用 {o.gameChancesUsed} 次
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Space>
    </div>
  );
}
