import { useQuery } from '@tanstack/react-query';
import { Card, Typography, Tag, Button, Space, Spin, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { GiftOutlined, DollarOutlined, TrophyOutlined } from '@ant-design/icons';
import { http } from '@api/client';

const { Title, Text } = Typography;

interface UserCoupon {
  id: string;
  name: string;
  minSpend: number;
  expiredAt: string;
  status: 'unused' | 'used' | 'expired' | string;
}

interface UserGift {
  id: string;
  name: string;
  status: 'unclaimed' | 'claimed' | string;
}

interface GameHistoryItem {
  id: string;
  gameType: string;
  difficulty: string;
  passed: boolean;
}

interface PrizesData {
  points?: {
    balance: number;
  };
  coupons?: UserCoupon[];
  gifts?: UserGift[];
  gameHistory?: GameHistoryItem[];
}

const gameIcons: Record<string, string> = {
  wheel: '🎰',
  scratch: '🎫',
  memory: '🃏',
  game2048: '🔢',
  reaction: '⚡',
};

export default function Prizes() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['prizes'],
    queryFn: async () => {
      const res = await http.get<PrizesData>('/prizes/my');
      return res.data;
    },
  });

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>🎁 我的奖品</Title>

      {/* 积分 */}
      <Card
        title={
          <>
            <DollarOutlined /> 我的积分
          </>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Text style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-primary)' }}>
          {data?.points?.balance || 0}
        </Text>
        <Text type="secondary"> 积分</Text>
        <Text type="secondary" style={{ marginLeft: 8 }}>
          （1分=0.01元）
        </Text>
      </Card>

      {/* 优惠券 */}
      <Card
        title={
          <>
            <TrophyOutlined /> 优惠券
          </>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        {!data?.coupons?.length ? (
          <Empty description="暂无优惠券" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          data.coupons.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div>
                <Text strong>{c.name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {c.minSpend > 0 ? `满¥${(c.minSpend / 100).toFixed(0)}可用` : '无门槛'}· 有效期至{' '}
                  {new Date(c.expiredAt).toLocaleDateString()}
                </Text>
              </div>
              <Tag color={c.status === 'unused' ? 'blue' : 'default'}>
                {c.status === 'unused' ? '可用' : c.status === 'used' ? '已用' : '已过期'}
              </Tag>
            </div>
          ))
        )}
      </Card>

      {/* 实物 */}
      <Card
        title={
          <>
            <GiftOutlined /> 实物奖品
          </>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        {!data?.gifts?.length ? (
          <Empty description="暂未有实物奖品" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          data.gifts.map((g) => (
            <div
              key={g.id}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}
            >
              <Text>{g.name}</Text>
              <Tag color={g.status === 'claimed' ? 'green' : 'orange'}>
                {g.status === 'unclaimed' ? '待领取' : g.status === 'claimed' ? '已领取' : g.status}
              </Tag>
            </div>
          ))
        )}
      </Card>

      {/* 游戏历史 */}
      <Card title="🎮 游戏记录" size="small">
        {!data?.gameHistory?.length ? (
          <Empty description="暂无游戏记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          data.gameHistory.slice(0, 10).map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div>
                <Text>
                  {gameIcons[r.gameType] || ''} {r.gameType}
                </Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {r.difficulty}
                </Text>
              </div>
              <Tag color={r.passed ? 'green' : 'default'}>{r.passed ? '通关' : '未通关'}</Tag>
            </div>
          ))
        )}
      </Card>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Space>
          <Button type="primary" onClick={() => navigate('/products')}>
            去购物
          </Button>
          <Button onClick={() => navigate('/games')}>去玩游戏</Button>
        </Space>
      </div>
    </div>
  );
}
