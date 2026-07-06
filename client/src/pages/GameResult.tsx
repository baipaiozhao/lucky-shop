import { useEffect } from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { formatPrice } from '../utils/format';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleOutlined, ReloadOutlined, ShoppingOutlined } from '@ant-design/icons';
import { http } from '@api/client';
import { useAuthStore } from '@store/authStore';

const { Title, Text } = Typography;

export default function GameResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, gameType } = location.state || {};
  const updatePoints = useAuthStore((s) => s.updatePoints);

  useEffect(() => {
    if (result) {
      http.get('/auth/me').then((res) => {
        if (res.data?.points !== undefined) {
          updatePoints(res.data.points);
        }
      }).catch(() => {});
    }
  }, [result, updatePoints]);

  const gameNames: Record<string, string> = {
    wheel: '幸运转盘',
    scratch: '刮刮卡',
    memory: '记忆翻牌',
    game2048: '2048合成',
    reaction: '反应挑战',
  };

  return (
    <div
      className="container"
      style={{ textAlign: 'center', padding: '40px 16px', maxWidth: 500, margin: '0 auto' }}
    >
      {result?.passed ? (
        <>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#06D6A0' }} />
          <Title level={2}>🎉 恭喜通关！</Title>
          <Text type="secondary">{gameNames[gameType] || '游戏'} 挑战成功</Text>

          {result?.prize && (
            <Card
              style={{
                marginTop: 24,
                background: 'linear-gradient(135deg, #FFD166, #FF6B35)',
                color: '#fff',
                borderRadius: 16,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎁</div>
              <Title level={3} style={{ color: '#fff', margin: 0 }}>
                {result.prize.name}
              </Title>
              {result.prize.type === 'coupon' && result.prize.value > 0 && (
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18 }}>
                  价值 ¥{formatPrice(result.prize.value)}
                </Text>
              )}
              {result.prize.type === 'points' && (
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18 }}>
                  +{result.prize.value} 积分
                </Text>
              )}
              {result.prize.type === 'gift' && (
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18 }}>
                  实物奖品（请在“我的奖品”中填写地址）
                </Text>
              )}
            </Card>
          )}
        </>
      ) : (
        <>
          <div style={{ fontSize: 64 }}>😢</div>
          <Title level={2}>挑战失败</Title>
          <Text type="secondary">别灰心，再试一次！</Text>
          {result?.consolation && (
            <Card style={{ marginTop: 16, background: '#f5f5f5' }}>
              <Text>参与奖: {result.consolation.message || '+10 积分'}</Text>
            </Card>
          )}
        </>
      )}

      <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 32 }}>
        <Space size="large">
          <Button icon={<ReloadOutlined />} onClick={() => navigate('/games')}>
            再玩一次
          </Button>
          {result?.passed && result?.prize?.type === 'coupon' && (
            <Button
              type="primary"
              icon={<ShoppingOutlined />}
              onClick={() => navigate('/products')}
            >
              去使用优惠券
            </Button>
          )}
          <Button onClick={() => navigate('/')}>返回首页</Button>
        </Space>
      </Space>
    </div>
  );
}
