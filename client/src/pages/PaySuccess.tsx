import { Result, Button, Typography, Space, Card } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircleOutlined, GiftOutlined, ShoppingOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function PaySuccess() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  return (
    <div
      className="container"
      style={{ textAlign: 'center', padding: '60px 16px', maxWidth: 600, margin: '0 auto' }}
    >
      <Result
        status="success"
        icon={<CheckCircleOutlined style={{ color: 'var(--color-success)' }} />}
        title="支付成功！"
        subTitle={`订单号: ${orderId}`}
        extra={
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card style={{ background: '#fff7f0', border: '1px solid var(--color-primary)' }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Title level={3} style={{ margin: 0 }}>
                  🎮 恭喜获得 1 次游戏机会！
                </Title>
                <Text type="secondary">完成订单即可挑战小游戏，赢取优惠券和实物奖品</Text>
                <Button
                  type="primary"
                  size="large"
                  icon={<GiftOutlined />}
                  onClick={() => navigate('/games')}
                  style={{ marginTop: 16 }}
                >
                  🎯 立即挑战
                </Button>
              </Space>
            </Card>

            <Space size="large">
              <Button onClick={() => navigate(`/orders/${orderId}`)}>查看订单</Button>
              <Button type="primary" icon={<ShoppingOutlined />} onClick={() => navigate('/')}>
                继续购物
              </Button>
            </Space>
          </Space>
        }
      />
    </div>
  );
}
