import { useQuery } from '@tanstack/react-query';
import { Card, Typography, Tag, List, Row, Col, Progress, Tooltip, Empty, Spin } from 'antd';
import { TrophyOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { http } from '@api/client';
import { useAuthStore } from '@store/authStore';

const { Title, Text, Paragraph } = Typography;

type Achievement = {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  reward: string;
  isActive: boolean;
};

type UserAchievement = {
  achievementId: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt?: string;
  achievement: Achievement;
};

export default function Achievements() {
  const { user } = useAuthStore();

  const { data: userAchievements, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const res = await http.get<{ achievements: UserAchievement[] }>('/achievements/my');
      return res.data.achievements;
    },
    enabled: !!user,
  });

  const { data: allAchievements } = useQuery({
    queryKey: ['all-achievements'],
    queryFn: async () => {
      const res = await http.get<{ achievements: Achievement[] }>('/achievements');
      return res.data.achievements;
    },
  });

  const completedCount = userAchievements?.filter((a) => a.completed).length || 0;
  const totalCount = allAchievements?.length || 0;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      shopping: 'blue',
      game: 'purple',
      social: 'green',
      checkin: 'orange',
      milestone: 'red',
    };
    return colors[category] || 'default';
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      shopping: '购物达人',
      game: '游戏王者',
      social: '社交达人',
      checkin: '连续签到',
      milestone: '里程碑',
    };
    return names[category] || category;
  };

  if (isLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
      <Card style={{ marginBottom: 24, background: 'var(--gradient-hero)', color: '#fff' }}>
        <Row gutter={24} align="middle">
          <Col flex="none">
            <TrophyOutlined style={{ fontSize: 48 }} />
          </Col>
          <Col flex="auto">
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              成就系统
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 0' }}>
              完成挑战，解锁成就，获得丰厚奖励！
            </Paragraph>
          </Col>
          <Col flex="none">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                {completedCount} / {totalCount}
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.7)' }}>已解锁成就</Text>
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="我的成就">
        {!userAchievements?.length ? (
          <Empty description="暂无成就记录" />
        ) : (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3 }}
            dataSource={userAchievements}
            renderItem={(ua) => {
              const achievement = ua.achievement;
              const progressPercent = Math.min(100, (ua.progress / Math.max(ua.target, 1)) * 100);

              return (
                <List.Item>
                  <Card
                    hoverable
                    style={{
                      opacity: ua.completed ? 1 : 0.75,
                      border: ua.completed ? '2px solid var(--color-success)' : undefined,
                    }}
                    cover={
                      <div
                        style={{
                          padding: '24px 16px',
                          textAlign: 'center',
                          background: ua.completed
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : '#f5f5f5',
                          color: ua.completed ? '#fff' : '#999',
                          fontSize: 48,
                        }}
                      >
                        {ua.completed ? achievement.icon : <LockOutlined />}
                      </div>
                    }
                  >
                    <Card.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{achievement.name}</span>
                          {ua.completed ? (
                            <Tooltip title="已完成">
                              <CheckCircleOutlined style={{ color: 'var(--color-success)' }} />
                            </Tooltip>
                          ) : null}
                        </div>
                      }
                      description={
                        <>
                          <Tag color={getCategoryColor(achievement.category)} style={{ marginBottom: 8 }}>
                            {getCategoryName(achievement.category)}
                          </Tag>
                          <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                            {achievement.description}
                          </Paragraph>
                          {!ua.completed ? (
                            <div>
                              <Progress
                                percent={Math.round(progressPercent)}
                                size="small"
                                format={() => `${ua.progress}/${ua.target}`}
                              />
                            </div>
                          ) : (
                            <Text type="success" strong>
                              🎁 奖励：{achievement.reward}
                            </Text>
                          )}
                        </>
                      }
                    />
                  </Card>
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
}
