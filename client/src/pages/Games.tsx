import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Card,
  Typography,
  Space,
  Button,
  Tag,
  Statistic,
  Row,
  Col,
  Spin,
  Empty,
  Modal,
  message,
  Segmented,
} from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CrownOutlined,
  FireOutlined,
  GiftOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { http } from '@api/client';

const { Title, Text, Paragraph } = Typography;

interface GameStats {
  type: string;
  totalPlayed: number;
  totalWon: number;
}

interface GamesSummary {
  remainingChances: number;
  totalWon: number;
  games: GameStats[];
}

interface StartGameVariables {
  type: string;
  difficulty: string;
}

interface GameSession {
  sessionId: string;
  serverNonce: string;
  config?: Record<string, unknown>;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

const gameList = [
  {
    type: 'wheel',
    name: '幸运转盘',
    icon: '🎰',
    desc: '旋转转盘，命中奖品分区',
    color: '#FF6B35',
    badge: '入门推荐',
  },
  {
    type: 'scratch',
    name: '刮刮卡',
    icon: '🎫',
    desc: '刮开涂层，揭晓隐藏奖励',
    color: '#06D6A0',
    badge: '触摸友好',
  },
  {
    type: 'memory',
    name: '记忆翻牌',
    icon: '🃏',
    desc: '翻牌配对，挑战短时记忆',
    color: '#004E89',
    badge: '脑力挑战',
  },
  {
    type: 'game2048',
    name: '2048合成',
    icon: '🔢',
    desc: '滑动合成，冲击目标数字',
    color: '#EF476F',
    badge: '策略玩法',
  },
  {
    type: 'reaction',
    name: '反应挑战',
    icon: '⚡',
    desc: '等待信号，测试极限反应',
    color: '#8338EC',
    badge: '速度挑战',
  },
];

const difficulties = [
  { key: 'easy', label: '⭐ Easy', desc: '简单通关，基础奖品', color: 'green' },
  { key: 'medium', label: '⭐⭐ Medium', desc: '中等难度，进阶奖品', color: 'orange' },
  { key: 'hard', label: '⭐⭐⭐ Hard', desc: '困难关卡，稀有奖品', color: 'red' },
];

export default function Games() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await http.get<GamesSummary>('/games');
      return res.data;
    },
  });

  const startGameMutation = useMutation({
    mutationFn: async ({ type, difficulty }: StartGameVariables) => {
      const res = await http.post<GameSession>(`/games/${type}/start`, { difficulty });
      return res.data;
    },
    onSuccess: (data: GameSession, variables: StartGameVariables) => {
      navigate(`/games/${variables.type}`, {
        state: { session: data, difficulty: variables.difficulty },
      });
    },
    onError: (error: unknown) => message.error(getErrorMessage(error, '无法开始游戏')),
  });

  const handleStartGame = (type: string) => {
    setSelectedGame(type);
    setModalOpen(true);
  };

  const confirmStart = () => {
    if (selectedGame) {
      setModalOpen(false);
      startGameMutation.mutate({ type: selectedGame, difficulty });
    }
  };

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const remainingChances = data?.remainingChances || 0;
  const selectedGameConfig = gameList.find((game) => game.type === selectedGame);

  return (
    <div className="container">
      <section className="game-hero glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={14}>
            <span className="section-kicker">
              <CrownOutlined /> Game Center
            </span>
            <Title level={1} style={{ margin: '12px 0', letterSpacing: '-0.05em' }}>
              游戏大厅
            </Title>
            <Paragraph
              className="muted-text"
              style={{ fontSize: 16, lineHeight: 1.8, maxWidth: 680 }}
            >
              购物完成后获得挑战机会，选择难度进入 5
              款自研小游戏。通关后触发老虎机揭晓，奖励自动进入奖品中心。
            </Paragraph>
            <Space wrap size="middle">
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                disabled={remainingChances === 0}
              >
                剩余 {remainingChances} 次机会
              </Button>
              <Button
                size="large"
                icon={<ShoppingOutlined />}
                onClick={() => navigate('/products')}
              >
                去购物赚机会
              </Button>
              <Button
                size="large"
                icon={<TrophyOutlined />}
                onClick={() => navigate('/games/leaderboard')}
              >
                查看排行榜
              </Button>
            </Space>
          </Col>
          <Col xs={24} lg={10}>
            <div className="stat-strip">
              <div className="stat-tile">
                <Statistic
                  title="剩余游戏次数"
                  value={remainingChances}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{
                    color:
                      remainingChances > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}
                />
              </div>
              <div className="stat-tile">
                <Statistic
                  title="已通关"
                  value={data?.totalWon || 0}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: 'var(--color-success)' }}
                />
              </div>
              <div className="stat-tile">
                <Statistic
                  title="奖品类型"
                  value={3}
                  suffix="类"
                  prefix={<GiftOutlined />}
                  valueStyle={{ color: 'var(--color-secondary)' }}
                />
              </div>
            </div>
          </Col>
        </Row>
      </section>

      {remainingChances === 0 ? (
        <div className="surface-card" style={{ padding: 56, textAlign: 'center' }}>
          <Empty description="暂无游戏机会，请先完成购物">
            <Button
              type="primary"
              size="large"
              icon={<ShoppingOutlined />}
              onClick={() => navigate('/products')}
            >
              去购物
            </Button>
          </Empty>
        </div>
      ) : (
        <section className="page-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                <FireOutlined /> Choose Challenge
              </span>
              <Title level={3} style={{ margin: '10px 0 0' }}>
                选择一款游戏开始挑战
              </Title>
            </div>
            <Text className="muted-text">统一会话协议 · RNG Seed · 防作弊复盘</Text>
          </div>

          <Row gutter={[16, 16]}>
            {gameList.map((game) => {
              const stats = data?.games?.find((item) => item.type === game.type);
              return (
                <Col xs={24} sm={12} lg={8} key={game.type}>
                  <Card
                    hoverable
                    className="game-card surface-card"
                    style={{ cursor: 'pointer', borderTop: `4px solid ${game.color}` }}
                    styles={{ body: { padding: 22 } }}
                    onClick={() => handleStartGame(game.type)}
                  >
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            width: 68,
                            height: 68,
                            borderRadius: 24,
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 38,
                            background: `${game.color}18`,
                          }}
                        >
                          {game.icon}
                        </div>
                        <Tag color="blue">{game.badge}</Tag>
                      </div>

                      <div>
                        <Title level={3} style={{ margin: '0 0 8px' }}>
                          {game.name}
                        </Title>
                        <Text className="muted-text">{game.desc}</Text>
                      </div>

                      <div style={{ minHeight: 30 }}>
                        {stats ? (
                          <Space wrap>
                            <Text type="secondary">玩过 {stats.totalPlayed} 次</Text>
                            {stats.totalWon > 0 && <Tag color="green">通关 ×{stats.totalWon}</Tag>}
                          </Space>
                        ) : (
                          <Tag color="default">未玩过</Tag>
                        )}
                      </div>

                      <Button type="primary" block>
                        开始挑战
                      </Button>
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </section>
      )}

      <Modal
        title={
          selectedGameConfig
            ? `选择难度 · ${selectedGameConfig.icon} ${selectedGameConfig.name}`
            : '选择难度'
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={confirmStart}
        okText="开始挑战"
        confirmLoading={startGameMutation.isPending}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', padding: '16px 0' }}>
          <Segmented
            block
            value={difficulty}
            onChange={(value) => setDifficulty(String(value))}
            options={difficulties.map((item) => ({ label: item.label, value: item.key }))}
          />
          {difficulties.map((item) => (
            <Card
              key={item.key}
              size="small"
              hoverable
              style={{
                border:
                  difficulty === item.key
                    ? `2px solid var(--color-primary)`
                    : '1px solid var(--color-border)',
                background: difficulty === item.key ? 'var(--color-primary-soft)' : undefined,
              }}
              onClick={() => setDifficulty(item.key)}
            >
              <Space align="start">
                <Tag color={item.color}>{item.label}</Tag>
                <div>
                  <Text strong>{item.key.toUpperCase()}</Text>
                  <br />
                  <Text type="secondary">{item.desc}</Text>
                </div>
              </Space>
            </Card>
          ))}
        </Space>
      </Modal>
    </div>
  );
}
