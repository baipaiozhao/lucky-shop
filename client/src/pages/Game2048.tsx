import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography, Button, message, Statistic, Row, Col } from 'antd';
import { http } from '@api/client';

const { Title } = Typography;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

type Board = number[][];
type Dir = 'up' | 'down' | 'left' | 'right';

function emptyBoard(): Board {
  return [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
}

function rotate(board: Board): Board {
  const b = emptyBoard();
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) b[c][3 - r] = board[r][c];
  return b;
}

function moveLeft(b: Board): { board: Board; score: number } {
  let score = 0;
  const board = b.map((row) => {
    const filtered = row.filter((v) => v !== 0);
    const merged: number[] = [];
    for (let i = 0; i < filtered.length; i++) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        merged.push(filtered[i] * 2);
        score += filtered[i] * 2;
        i++;
      } else {
        merged.push(filtered[i]);
      }
    }
    while (merged.length < 4) merged.push(0);
    return merged.slice(0, 4);
  });
  return { board, score };
}

function move(board: Board, dir: Dir): { board: Board; score: number } {
  let b = board;
  if (dir === 'up') b = rotate(rotate(rotate(b)));
  else if (dir === 'right') b = b.map((r) => [...r].reverse());
  else if (dir === 'down') b = rotate(b);

  const { board: lefted, score } = moveLeft(b);

  if (dir === 'up') b = rotate(lefted);
  else if (dir === 'right') b = lefted.map((r) => [...r].reverse());
  else if (dir === 'down') b = rotate(rotate(rotate(lefted)));
  else b = lefted;

  return { board: b, score };
}

function addRandom(board: Board): Board {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (board[r][c] === 0) empty.push([r, c]);
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const nb = board.map((rr) => [...rr]);
  nb[r][c] = Math.random() < 0.9 ? 2 : 4;
  return nb;
}

function maxTile(board: Board): number {
  return Math.max(...board.flat());
}

const tileColors: Record<number, string> = {
  2: '#EEE4DA',
  4: '#EDE0C8',
  8: '#F2B179',
  16: '#F59563',
  32: '#F67C5F',
  64: '#F65E3B',
  128: '#EDCF72',
  256: '#EDCC61',
  512: '#EDC850',
  1024: '#EDC53F',
  2048: '#EDC22E',
};

export default function Game2048() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionData = location.state?.session;
  const config = sessionData?.config || { target: 256 };

  const [board, setBoard] = useState<Board>(emptyBoard);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [passed, setPassed] = useState(false);

  function start() {
    let b = emptyBoard();
    b = addRandom(b);
    b = addRandom(b);
    setBoard(b);
    setScore(0);
    setStarted(true);
    setFinished(false);
    setPassed(false);
  }

  const handleKey = useCallback(
    (dir: Dir) => {
      if (!started || finished) return;
      const { board: nb, score: s } = move(board, dir);
      if (JSON.stringify(nb) === JSON.stringify(board)) return;
      const withNew = addRandom(nb);
      setBoard(withNew);
      setScore((sc) => sc + s);
      if (maxTile(withNew) >= config.target) {
        setFinished(true);
        setPassed(true);
      }
      // Game over check
      let canMove = false;
      for (const d of ['up', 'down', 'left', 'right'] as Dir[]) {
        const { board: tb } = move(withNew, d);
        if (JSON.stringify(tb) !== JSON.stringify(withNew)) {
          canMove = true;
          break;
        }
      }
      if (!canMove) {
        setFinished(true);
      }
    },
    [board, config.target, started, finished],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };
      if (map[e.key]) {
        e.preventDefault();
        handleKey(map[e.key]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleKey]);

  // Touch swipe support for mobile
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    const minSwipeDistance = 30;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!started || finished) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) return;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        handleKey(deltaX > 0 ? 'right' : 'left');
      } else {
        handleKey(deltaY > 0 ? 'down' : 'up');
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleKey, started, finished]);

  async function submitResult() {
    try {
      const res = await http.post(`/games/game2048/finish`, {
        sessionId: sessionData.sessionId,
        serverNonce: sessionData.serverNonce,
        score: maxTile(board),
        duration: 0,
      });
      navigate('/games/result', { state: { result: res.data, gameType: 'game2048' } });
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '提交失败'));
    }
  }

  if (!started) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '48px' }}>
        <Title level={2}>🔢 2048 合成</Title>
        <p>目标数字: {config.target} | 方向键/滑动操作</p>
        <Button type="primary" size="large" onClick={start}>
          开始游戏
        </Button>
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{ textAlign: 'center', padding: '24px 16px', maxWidth: 400, margin: '0 auto' }}
    >
      <Title level={3}>🔢 2048 合成</Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic title="分数" value={score} />
        </Col>
        <Col span={8}>
          <Statistic title="最大" value={maxTile(board)} />
        </Col>
        <Col span={8}>
          <Statistic title="目标" value={config.target} />
        </Col>
      </Row>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          background: '#BBADA0',
          padding: 8,
          borderRadius: 8,
        }}
      >
        {board.flat().map((v, i) => (
          <div
            key={i}
            style={{
              width: '100%',
              aspectRatio: '1',
              background: tileColors[v] || '#CDC1B4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: v > 100 ? 18 : 24,
              fontWeight: 700,
              color: v <= 4 ? '#776E65' : '#fff',
              borderRadius: 4,
              lineHeight: 1,
            }}
          >
            {v || ''}
          </div>
        ))}
      </div>
      {finished && (
        <div style={{ marginTop: 16 }}>
          <Button type="primary" size="large" onClick={submitResult}>
            {passed ? '🎉 通关！领取奖品' : '查看结果'}
          </Button>
        </div>
      )}
    </div>
  );
}
