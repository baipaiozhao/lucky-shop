import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Col,
  Row,
  Typography,
  Space,
  Tag,
  Button,
  Select,
  Input,
  Pagination,
  Empty,
  Skeleton,
} from 'antd';
import { FilterOutlined, SearchOutlined, ShoppingOutlined, StarOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getCategories } from '@api/products';
import type { ProductListParams } from '@api/products';
import type { Product } from '@types';
import { formatPrice, placeholderImage } from '../utils/format';
import SEO from '@components/SEO';

interface Category {
  id: string;
  name: string;
  icon: string;
  sort: number;
}

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

type ProductSort = NonNullable<ProductListParams['sort']>;

function ProductGridSkeleton() {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: 12 }).map((_, i) => (
        <Col xs={12} sm={8} md={6} key={i}>
          <Card className="product-card">
            <Skeleton.Image active style={{ width: '100%', height: 190 }} />
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default function Products() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<ProductSort | undefined>();

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, pageSize, categoryId, keyword, sort],
    queryFn: () => getProducts({ page, pageSize, categoryId, keyword: keyword || undefined, sort }),
  });

  const activeCategory = categoriesData?.find((category: Category) => category.id === categoryId);

  const handleSearch = (value: string) => {
    setKeyword(value.trim());
    setPage(1);
  };

  return (
    <div className="container">
      <SEO title="商品列表" description="探索幸运好物 — 支持分类筛选与多维度排序" />
      <section className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} lg={10}>
            <span className="section-kicker">
              <ShoppingOutlined /> Product Mall
            </span>
            <Title level={2} style={{ margin: '12px 0 8px' }}>
              探索幸运好物
            </Title>
            <Paragraph className="muted-text" style={{ marginBottom: 0 }}>
              支持分类筛选、关键词搜索与多维排序。完成订单即可获得游戏机会，购物后继续赢奖品。
            </Paragraph>
          </Col>

          <Col xs={24} lg={14}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Search
                placeholder="搜索耳机、键盘、礼盒..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
              />
              <Space wrap size="middle">
                <Select
                  placeholder="全部分类"
                  allowClear
                  style={{ minWidth: 168 }}
                  value={categoryId}
                  size="large"
                  onChange={(v) => {
                    setCategoryId(v);
                    setPage(1);
                  }}
                  options={categoriesData?.map((c: Category) => ({
                    value: c.id,
                    label: `${c.icon} ${c.name}`,
                  }))}
                />
                <Select
                  placeholder="默认排序"
                  allowClear
                  style={{ minWidth: 168 }}
                  value={sort}
                  size="large"
                  onChange={(v) => {
                    setSort(v);
                    setPage(1);
                  }}
                  options={[
                    { value: 'sales', label: '销量优先' },
                    { value: 'price_asc', label: '价格低到高' },
                    { value: 'price_desc', label: '价格高到低' },
                    { value: 'newest', label: '最新上架' },
                  ]}
                />
                <Button
                  size="large"
                  icon={<FilterOutlined />}
                  onClick={() => {
                    setCategoryId(undefined);
                    setSort(undefined);
                    setKeyword('');
                    setPage(1);
                  }}
                >
                  重置筛选
                </Button>
              </Space>
            </Space>
          </Col>
        </Row>
      </section>

      <div className="section-heading">
        <div>
          <span className="section-kicker">
            <StarOutlined />{' '}
            {activeCategory ? `${activeCategory.icon} ${activeCategory.name}` : '全部商品'}
          </span>
          <Title level={3} style={{ margin: '10px 0 0' }}>
            {keyword ? `“${keyword}” 的搜索结果` : '商品列表'}
          </Title>
        </div>
        {data?.total !== undefined && (
          <Text className="muted-text">
            共 {data.total} 件商品 · 第 {data.page}/
            {Math.max(1, Math.ceil(data.total / data.pageSize))} 页
          </Text>
        )}
      </div>

      {isLoading ? (
        <ProductGridSkeleton />
      ) : !data?.products?.length ? (
        <div className="surface-card" style={{ padding: 48 }}>
          <Empty description="暂无商品">
            <Button
              type="primary"
              onClick={() => {
                setCategoryId(undefined);
                setSort(undefined);
                setKeyword('');
                setPage(1);
              }}
            >
              查看全部商品
            </Button>
          </Empty>
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {data.products.map((product: Product) => (
              <Col xs={12} sm={8} md={6} lg={6} key={product.id}>
                <Card
                  hoverable
                  className="product-card"
                  cover={
                    <div className="product-card-cover" style={{ height: 200 }}>
                      <img
                        src={product.images?.[0] || placeholderImage(product.name, product.category?.name)}
                        alt={product.name}
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = placeholderImage(product.name, product.category?.name); }}
                      />
                      <div style={{ position: 'absolute', top: 10, left: 10 }}>
                        <Tag color="orange" style={{ fontSize: 12 }}>
                          {product.category?.name}
                        </Tag>
                      </div>
                      <div style={{ position: 'absolute', top: 10, right: 10 }}>
                        {product.isFeatured && <Tag color="red">精选</Tag>}
                        {product.isNew && <Tag color="green">新品</Tag>}
                      </div>
                    </div>
                  }
                  onClick={() => navigate(`/products/${product.id}`)}
                  styles={{ body: { padding: '14px' } }}
                >
                  <div className="product-title">{product.name}</div>
                  <Space align="baseline" size={8}>
                    <span className="price-text">¥{formatPrice(product.price)}</span>
                    {product.originalPrice && (<Text delete type="secondary" style={{ fontSize: 12 }}>
            {formatPrice(product.originalPrice)}
          </Text>
        )}
                  </Space>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 12, marginTop: 6 }}>
                    已售 {product.sales} · ⭐ {product.rating?.toFixed(1) ?? '5.0'} · 库存{' '}
                    {product.stock}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <div className="surface-card" style={{ marginTop: 24, padding: 14, textAlign: 'center' }}>
            <Pagination
              current={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onChange={setPage}
              showSizeChanger={false}
              responsive
            />
          </div>
        </>
      )}
    </div>
  );
}

