import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography, Button, message, Progress } from 'antd';
import { http } from '@api/client';

const { Title, Text } = Typography;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function ScratchGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionData = location.state?.session;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ratio, setRatio] = useState(0);
  const [finished, setFinished] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const isDrawing = useRef(false);

  const config = sessionData?.config || { coverage: 0.5, passThreshold: 0.8 };
  const passThreshold = config.passThreshold;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || initialized) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#06D6A0';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎁 奖品在这里', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#CCCCCC';
    const coverRatio = config.coverage || 0.5;
    ctx.fillRect(0, 0, canvas.width, canvas.height * coverRatio);
    setInitialized(true);
  }, [config.coverage, initialized]);

  function handlePointerDown(e: React.PointerEvent) {
    isDrawing.current = true;
    scratch(e);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDrawing.current) return;
    scratch(e);
  }

  function scratch(e: React.PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imgData.data.length; i += 4) {
      if (imgData.data[i] === 0) transparent++;
    }
    const r = Math.floor((transparent / (canvas.width * canvas.height)) * 100);
    setRatio(r);

    if (r >= passThreshold * 100) {
      setFinished(true);
    }
  }

  async function submitResult() {
    try {
      const res = await http.post(`/games/scratch/finish`, {
        sessionId: sessionData.sessionId,
        serverNonce: sessionData.serverNonce,
        score: ratio,
        duration: 0,
      });
      navigate('/games/result', { state: { result: res.data, gameType: 'scratch' } });
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '提交失败'));
    }
  }

  return (
    <div className="container" style={{ textAlign: 'center', padding: '24px 16px' }}>
      <Title level={2}>🎫 刮刮卡</Title>
      <Text type="secondary" style={{ marginBottom: 16 }}>
        用手指或鼠标刮开灰色区域
      </Text>
      <div style={{ margin: '16px auto', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={320}
          height={200}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={() => {
            isDrawing.current = false;
          }}
          onPointerLeave={() => {
            isDrawing.current = false;
          }}
          style={{
            border: '2px solid #ccc',
            borderRadius: 8,
            cursor: 'pointer',
            touchAction: 'none',
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      </div>
      <Progress percent={ratio} format={() => `${ratio}%`} />
      <div style={{ marginTop: 16 }}>
        <Text>需要刮开 {(passThreshold * 100).toFixed(0)}% 以上</Text>
      </div>
      {finished && (
        <Button type="primary" size="large" style={{ marginTop: 16 }} onClick={submitResult}>
          🎁 揭晓奖品
        </Button>
      )}
    </div>
  );
}
