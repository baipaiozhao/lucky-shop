import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography, Button, message, Statistic, Row, Col, Tag } from 'antd';
import { http } from '@api/client';

const { Title, Text } = Typography;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function ReactionGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionData = location.state?.session;
  const config = sessionData?.config || { rounds: 10, targetAvg: 350, minValid: 6 };

  const [phase, setPhase] = useState<'idle' | 'red' | 'green' | 'result'>('idle');
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [fouls, setFouls] = useState(0);
  const greenTime = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function start() {
    setRound(1);
    setTimes([]);
    setFouls(0);
    setPhase('red');
  }

  useEffect(() => {
    if (phase === 'red' && round <= config.rounds) {
      const delay = 1000 + Math.random() * 2000;
      timerRef.current = setTimeout(() => {
        setPhase('green');
        greenTime.current = Date.now();
      }, delay);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, round, config.rounds]);

  function handleClick() {
    if (phase === 'red') {
      // Foul
      setFouls((f) => f + 1);
      if (timerRef.current) clearTimeout(timerRef.current);
      nextRound();
    } else if (phase === 'green') {
      const rt = Date.now() - greenTime.current;
      setTimes((t) => [...t, rt]);
      nextRound();
    }
  }

  function nextRound() {
    if (round >= config.rounds) {
      setPhase('result');
    } else {
      setRound((r) => r + 1);
      setPhase('red');
    }
  }

  const validTimes = times.slice(0);
  const avgTime =
    validTimes.length > 0
      ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
      : 9999;
  const passed = validTimes.length >= config.minValid && avgTime <= config.targetAvg;

  async function submitResult() {
    try {
      const res = await http.post(`/games/reaction/finish`, {
        sessionId: sessionData.sessionId,
        serverNonce: sessionData.serverNonce,
        score: 0,
        duration: avgTime,
      });
      navigate('/games/result', { state: { result: res.data, gameType: 'reaction' } });
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '提交失败'));
    }
  }

  if (phase === 'idle') {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '48px' }}>
        <Title level={2}>⚡ 反应挑战</Title>
        <Text>
          {config.rounds} 轮测试, 平均 {config.targetAvg}ms 内通关
        </Text>
        <br />
        <Button type="primary" size="large" style={{ marginTop: 16 }} onClick={start}>
          开始测试
        </Button>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div
        className="container"
        style={{ textAlign: 'center', padding: '24px', maxWidth: 500, margin: '0 auto' }}
      >
        <Title level={3}>⚡ 反应挑战 - 结果</Title>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic title="轮次" value={`${validTimes.length}/${config.rounds}`} />
          </Col>
          <Col span={8}>
            <Statistic title="犯规" value={fouls} />
          </Col>
          <Col span={8}>
            <Statistic
              title="平均"
              value={`${avgTime}ms`}
              valueStyle={{ color: passed ? 'green' : 'red' }}
            />
          </Col>
        </Row>
        <div style={{ marginBottom: 16 }}>
          {validTimes.map((t, i) => (
            <Tag key={i} color={t <= config.targetAvg ? 'green' : 'red'}>
              第{i + 1}轮: {t}ms
            </Tag>
          ))}
        </div>
        <Button type="primary" size="large" onClick={submitResult}>
          {passed ? '🎉 通关！领取奖品' : '查看结果'}
        </Button>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      style={{
        textAlign: 'center',
        padding: '24px',
        height: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        background: phase === 'red' ? '#EF476F' : phase === 'green' ? '#06D6A0' : '#f0f0f0',
        transition: 'background 0.1s',
      }}
    >
      <div>
        <Title level={2} style={{ color: '#fff' }}>
          {phase === 'red' ? '等待绿色...' : '点击！'}
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
          第 {round}/{config.rounds} 轮
        </Text>
      </div>
    </div>
  );
}
