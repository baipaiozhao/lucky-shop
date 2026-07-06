import { useQuery } from '@tanstack/react-query';
import { Card, Col, Row, Typography, Space, Tag, Pagination, Spin, Empty, Input } from 'antd';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getProducts } from '@api/products';
import type { Product } from '@types';
import { formatPrice, placeholderImage } from '../utils/format';

const { Title, Text } = Typography;

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState(q);

  useEffect(() => {
    setKeyword(q);
    setPage(1);
  }, [q]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', keyword, page],
    queryFn: () => getProducts({ page, pageSize: 12, keyword }),
    enabled: keyword.length > 0,
  });

  return (
    <div className="container" style={{ padding: '24px 16px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Title level={2} style={{ margin: 0 }}>
            搜索结果
          </Title>
          {keyword && <Tag color="orange">“{keyword}”</Tag>}
          {data && <Text type="secondary">找到 {data.total} 个结果</Text>}
        </div>

        <Input.Search
          placeholder="搜索商品..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={(val) => navigate(`/search?q=${encodeURIComponent(val)}`)}
          style={{ maxWidth: 400 }}
          enterButton
        />

        {isLoading ? (
          <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
        ) : !data?.products?.length ? (
          <Empty description={keyword ? `未找到“${keyword}”相关商品` : '请输入搜索关键词'} />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {data.products.map((p: Product) => (
                <Col xs={12} sm={8} md={6} key={p.id}>
                  <Card
                    hoverable
                    cover={
                      <div style={{ height: 200, overflow: 'hidden' }}>
                        <img
                          src={p.images?.[0] || placeholderImage(p.name)}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      </div>
                    }
                    onClick={() => navigate(`/products/${p.id}`)}
                    styles={{ body: { padding: '12px' } }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      {p.isFeatured && <Tag color="red">精选</Tag>}
                      {p.isNew && <Tag color="green">新品</Tag>}
                    </div>
                    <div
                      style={{
                        fontWeight: 500,
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                      ¥{formatPrice(p.price)}
                    </div>
                    <div style={{ color: '#999', fontSize: 12 }}>已售 {p.sales}</div>
                  </Card>
                </Col>
              ))}
            </Row>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Pagination
                current={data.page}
                pageSize={data.pageSize}
                total={data.total}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </Space>
    </div>
  );
}
