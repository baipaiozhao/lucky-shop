import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography, Button, message, Statistic, Row, Col } from 'antd';
import { http } from '@api/client';
import './MemoryGame.css';

const { Title, Text } = Typography;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

const emojiPool = ['🍎', '🍋', '🍇', '🍊', '🍓', '🍒', '🥝', '🍑'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionData = location.state?.session;
  const config = sessionData?.config || { pairs: 4, cols: 4, rows: 2, timeLimit: 60 };

  const [cards, setCards] = useState<
    Array<{ id: number; emoji: string; flipped: boolean; matched: boolean }>
  >([]);
  const [flippedIdx, setFlippedIdx] = useState<number[]>([]);
  const [matched, setMatched] = useState(0);
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [finished, setFinished] = useState(false);
  const [passed, setPassed] = useState(false);

  function initGame() {
    const emojis = emojiPool.slice(0, config.pairs);
    const deck = shuffle(
      [...emojis, ...emojis].map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false })),
    );
    setCards(deck);
    setMatched(0);
    setMoves(0);
    setFlippedIdx([]);
    setTimeLeft(config.timeLimit);
    setFinished(false);
  }

  function startGame() {
    initGame();
    setStarted(true);
  }

  useEffect(() => {
    if (!started || finished) return;
    const timer = setInterval(() => {
      setTimeLeft((t: number) => {
        if (t <= 1) {
          setFinished(true);
          setPassed(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, finished]);

  function flipCard(idx: number) {
    if (finished) return;
    if (cards[idx].flipped || cards[idx].matched) return;
    if (flippedIdx.length >= 2) return;

    const newCards = [...cards];
    newCards[idx].flipped = true;
    setCards(newCards);
    const newFlipped = [...flippedIdx, idx];
    setFlippedIdx(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newFlipped;
      if (newCards[a].emoji === newCards[b].emoji) {
        // Match
        setTimeout(() => {
          const matched = [...cards];
          matched[a].matched = true;
          matched[b].matched = true;
          setCards(matched);
          setFlippedIdx([]);
          setMatched((m) => {
            const newM = m + 1;
            if (newM >= config.pairs) {
              setFinished(true);
              setPassed(true);
            }
            return newM;
          });
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const reset = [...cards];
          reset[a].flipped = false;
          reset[b].flipped = false;
          setCards(reset);
          setFlippedIdx([]);
        }, 800);
      }
    }
  }

  async function submitResult() {
    try {
      const res = await http.post(`/games/memory/finish`, {
        sessionId: sessionData.sessionId,
        serverNonce: sessionData.serverNonce,
        score: matched,
        duration: (config.timeLimit - timeLeft) * 1000,
      });
      navigate('/games/result', { state: { result: res.data, gameType: 'memory' } });
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '提交失败'));
    }
  }

  if (!started) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '48px' }}>
        <Title level={2}>🃏 记忆翻牌</Title>
        <Text>
          配对 {config.pairs} 对, {config.timeLimit} 秒内完成
        </Text>
        <br />
        <Button type="primary" size="large" style={{ marginTop: 16 }} onClick={startGame}>
          开始游戏
        </Button>
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{ textAlign: 'center', padding: '24px 16px', maxWidth: 500, margin: '0 auto' }}
    >
      <Title level={3}>🃏 记忆翻牌</Title>
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic title="配对" value={`${matched}/${config.pairs}`} />
        </Col>
        <Col span={8}>
          <Statistic title="次数" value={moves} />
        </Col>
        <Col span={8}>
          <Statistic
            title="剩余"
            value={`${timeLeft}s`}
            valueStyle={{ color: timeLeft < 10 ? 'red' : undefined }}
          />
        </Col>
      </Row>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
          gap: 8,
          maxWidth: Math.min(config.cols * 80 + 24, 360),
          width: '100%',
          margin: '0 auto',
        }}
      >
        {cards.map((card, idx) => (
          <div
            key={card.id}
            className={`memory-card ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
            onClick={() => flipCard(idx)}
            style={{
              aspectRatio: '1',
              width: '100%',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(20px, 5vw, 28px)',
              cursor: 'pointer',
              background: card.flipped || card.matched ? '#fff' : 'var(--color-primary)',
              border: '2px solid #ddd',
              userSelect: 'none',
            }}
          >
            {card.flipped || card.matched ? card.emoji : '?'}
          </div>
        ))}
      </div>

      {finished && (
        <div style={{ marginTop: 24 }}>
          {passed ? (
            <Button type="primary" size="large" onClick={submitResult}>
              🎉 通关！领取奖品
            </Button>
          ) : (
            <Button size="large" onClick={submitResult}>
              时间到，查看结果
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
