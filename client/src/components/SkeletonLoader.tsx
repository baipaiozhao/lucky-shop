import { Skeleton } from 'antd';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'detail' | 'stats';
  count?: number;
}

export default function SkeletonLoader({ type = 'card', count = 4 }: SkeletonLoaderProps) {
  if (type === 'stats') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="surface-card" style={{ padding: 16 }}>
            <Skeleton.Input active block style={{ height: 20, marginBottom: 8 }} />
            <Skeleton.Input active block style={{ height: 32, width: '60%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="surface-card" style={{ padding: 16, display: 'flex', gap: 12 }}>
            <Skeleton.Avatar active size={64} shape="square" />
            <div style={{ flex: 1 }}>
              <Skeleton.Input active block style={{ height: 20, marginBottom: 8, width: '70%' }} />
              <Skeleton.Input active block style={{ height: 16, marginBottom: 8, width: '50%' }} />
              <Skeleton.Input active block style={{ height: 16, width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'detail') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Skeleton.Image active style={{ width: '100%', height: 400 }} />
        <div>
          <Skeleton.Input active block style={{ height: 32, marginBottom: 16, width: '80%' }} />
          <Skeleton.Input active block style={{ height: 24, marginBottom: 12, width: '60%' }} />
          <Skeleton.Input active block style={{ height: 48, marginBottom: 16, width: '40%' }} />
          <Skeleton paragraph={{ rows: 4 }} active />
        </div>
      </div>
    );
  }

  // Default: card grid
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
          <Skeleton.Image active style={{ width: '100%', height: 190 }} />
          <div style={{ padding: 14 }}>
            <Skeleton.Input active block style={{ height: 20, marginBottom: 8 }} />
            <Skeleton.Input active block style={{ height: 16, width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
