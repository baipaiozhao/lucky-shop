import { Modal, Steps, Button, Typography } from 'antd';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingOutlined,
  SmileOutlined,
  GiftOutlined,
  TrophyOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface GuideStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: () => void;
}

export default function UserGuide() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // 首次访问时显示引导
    const hasSeenGuide = localStorage.getItem('wo-mai-wo-mai-guide');
    if (!hasSeenGuide) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const steps: GuideStep[] = [
    {
      title: '欢迎来到我买我卖',
      description: '这里是一个游戏化电商平台，购物的同时还能玩游戏赢奖品！',
      icon: <ShoppingOutlined style={{ fontSize: 48, color: 'var(--color-primary)' }} />,
    },
    {
      title: '浏览商品',
      description: '海量精选商品等你来选，加入购物车即可下单购买。',
      icon: <ShoppingOutlined style={{ fontSize: 48, color: '#06D6A0' }} />,
      action: () => navigate('/products'),
    },
    {
      title: '玩游戏赢奖品',
      description: '每次购物都能获得游戏机会，5款小游戏等你挑战！',
      icon: <SmileOutlined style={{ fontSize: 48, color: '#004E89' }} />,
      action: () => navigate('/games'),
    },
    {
      title: '奖品中心',
      description: '积分、优惠券、实物奖品都在这里，快来兑换吧！',
      icon: <GiftOutlined style={{ fontSize: 48, color: '#EF476F' }} />,
      action: () => navigate('/prizes'),
    },
  ];

  const handleComplete = () => {
    localStorage.setItem('wo-mai-wo-mai-guide', 'true');
    setOpen(false);
    setCurrent(0);
  };

  const handleSkip = () => {
    localStorage.setItem('wo-mai-wo-mai-guide', 'true');
    setOpen(false);
    setCurrent(0);
  };

  return (
    <Modal
      open={open}
      onCancel={handleSkip}
      footer={null}
      width={480}
      centered
      closable={false}
      styles={{
        body: { padding: '32px 24px' },
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        {steps[current].icon}
        <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>
          {steps[current].title}
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          {steps[current].description}
        </Text>
      </div>

      <Steps
        current={current}
        size="small"
        style={{ marginBottom: 24 }}
      />

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {current > 0 && (
          <Button onClick={() => setCurrent(current - 1)}>
            上一步
          </Button>
        )}
        {current < steps.length - 1 ? (
          <Button type="primary" onClick={() => setCurrent(current + 1)}>
            下一步
          </Button>
        ) : (
          <Button type="primary" onClick={handleComplete}>
            开始探索
          </Button>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Button type="link" size="small" onClick={handleSkip}>
          跳过引导
        </Button>
      </div>
    </Modal>
  );
}
