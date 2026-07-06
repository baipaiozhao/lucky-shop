import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography, Button, message } from 'antd';
import { http } from '@api/client';

const { Title } = Typography;

const labels = ['5元券', '积分', '15元券', '积分', '20元券', '积分', '30元券', '积分'];
const colors = [
  '#FF6B35',
  '#FFD166',
  '#06D6A0',
  '#004E89',
  '#EF476F',
  '#118AB2',
  '#073B4C',
  '#8338EC',
];

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function WheelGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionData = location.state?.session;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [finished, setFinished] = useState(false);
  const angleRef = useRef(0);

  const config = sessionData?.config || { segmentCount: 6, spinDuration: 8000 };

  const drawWheel = useCallback(
    (currentAngle: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(cx, cy) - 10;
      const n = config.segmentCount;
      const segAngle = (2 * Math.PI) / n;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < n; i++) {
        const startAngle = currentAngle + i * segAngle;
        const endAngle = startAngle + segAngle;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(startAngle + segAngle / 2);
        ctx.fillStyle = '#fff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i] || '?', radius * 0.6, 5);
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.fillStyle = colors[0];
      ctx.font = '20px sans-serif';
      ctx.fillText('🦊', cx - 15, cy + 8);
    },
    [config.segmentCount],
  );

  useEffect(() => {
    drawWheel(0);
  }, [drawWheel]);

  async function spin() {
    if (spinning) return;
    setSpinning(true);

    const targetAngle = Math.random() * 360 * 5 + 360 * 3;
    const duration = config.spinDuration;
    const start = angleRef.current;
    const startTime = performance.now();

    function animate() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + targetAngle * eased;
      angleRef.current = current % (2 * Math.PI);
      drawWheel(angleRef.current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setFinished(true);
      }
    }

    requestAnimationFrame(animate);
  }

  async function submitResult() {
    try {
      const res = await http.post(`/games/wheel/finish`, {
        sessionId: sessionData.sessionId,
        serverNonce: sessionData.serverNonce,
        score: 100,
        duration: config.spinDuration,
      });
      navigate('/games/result', { state: { result: res.data, gameType: 'wheel' } });
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '提交失败'));
    }
  }

  return (
    <div
      className="container"
      style={{ textAlign: 'center', padding: '24px 16px', maxWidth: 500, margin: '0 auto' }}
    >
      <Title level={2}>🎰 幸运转盘</Title>
      <canvas ref={canvasRef} width={360} height={360} style={{ maxWidth: '100%' }} />
      <div style={{ marginTop: 24 }}>
        {!finished ? (
          <Button type="primary" size="large" onClick={spin} loading={spinning}>
            {spinning ? '旋转中...' : '🎯 开始旋转'}
          </Button>
        ) : (
          <Button type="primary" size="large" onClick={submitResult}>
            揭晓奖品
          </Button>
        )}
      </div>
    </div>
  );
}
