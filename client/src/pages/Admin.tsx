import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '../utils/format';
import type { InputNumberProps, TableColumnsType } from 'antd';
import {
  Button,
  Card,
  Col,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  DollarOutlined,
  GiftOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { request } from '@api/client';

const { Title } = Typography;

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  totalUsers: number;
  totalProducts: number;
  todayGamesPlayed: number;
  todayGamesWon: number;
  activeCoupons: number;
}

interface DashboardResponse {
  stats?: Partial<DashboardStats>;
}

interface AdminOrderItem {
  productName: string;
}

interface AdminOrder {
  id: string;
  orderNo: string;
  user?: { username?: string };
  finalAmount: number;
  items?: AdminOrderItem[];
  status: string;
}

interface UpdateOrderPayload {
  id: string;
  status?: string;
  trackingNo?: string;
  carrier?: string;
}

interface AdminProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  sales: number;
  isActive: boolean;
}

interface AdminPrize {
  id: string;
  name: string;
  type: 'coupon' | 'points' | 'gift' | string;
  tier: 'easy' | 'medium' | 'hard' | string;
  stock: number;
  value: number;
  probability: number | string;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | string;
  status: 'active' | 'banned' | string;
  createdAt: string;
}

interface UpdateUserPayload {
  id: string;
  role?: string;
  status?: string;
}

export default function Admin() {
  const { data: dashboard, isLoading } = useQuery<DashboardResponse>({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => request<DashboardResponse>({ url: '/admin/dashboard', method: 'GET' }),
  });

  if (isLoading) return null;

  return (
    <div className="container" style={{ padding: '24px 16px' }}>
      <Title level={2}>🛠️ 管理后台</Title>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="今日订单"
              value={dashboard?.stats?.todayOrders || 0}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="今日收入"
              value={`¥${((dashboard?.stats?.todayRevenue || 0) / 100).toFixed(0)}`}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="用户数"
              value={dashboard?.stats?.totalUsers || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="商品数"
              value={dashboard?.stats?.totalProducts || 0}
              prefix={<GiftOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="今日游戏"
              value={dashboard?.stats?.todayGamesPlayed || 0}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="今日通关"
              value={dashboard?.stats?.todayGamesWon || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#06D6A0' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="可用券"
              value={dashboard?.stats?.activeCoupons || 0}
              prefix={<GiftOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="orders"
        items={[
          {
            key: 'orders',
            label: '📋 订单管理',
            children: <AdminOrders />,
          },
          {
            key: 'products',
            label: '📦 商品管理',
            children: <AdminProducts />,
          },
          {
            key: 'prizes',
            label: '🎁 奖品管理',
            children: <AdminPrizes />,
          },
          {
            key: 'users',
            label: '👤 用户管理',
            children: <AdminUsers />,
          },
        ]}
      />
    </div>
  );
}

function AdminOrders() {
  const queryClient = useQueryClient();
  const { data: ordersData } = useQuery<AdminOrder[]>({
    queryKey: ['admin', 'orders'],
    queryFn: async () => request<AdminOrder[]>({ url: '/admin/orders', method: 'GET' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, trackingNo, carrier }: UpdateOrderPayload) => {
      await request<void>({
        url: `/admin/orders/${id}`,
        method: 'PATCH',
        data: { status, trackingNo, carrier },
      });
    },
    onSuccess: () => {
      message.success('已更新');
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });

  const columns: TableColumnsType<AdminOrder> = [
    { title: '订单号', dataIndex: 'orderNo', width: 160 },
    { title: '用户', dataIndex: ['user', 'username'] },
    { title: '金额', dataIndex: 'finalAmount', render: (v: number) => `${formatPrice(v)}` },
    {
      title: '商品',
      dataIndex: 'items',
      render: (items?: AdminOrderItem[]) =>
        items
          ?.map((item) => item.productName)
          .join(', ')
          .slice(0, 30),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => (
        <Tag
          color={
            s === 'paid'
              ? 'blue'
              : s === 'shipped'
                ? 'purple'
                : s === 'completed'
                  ? 'green'
                  : 'default'
          }
        >
          {s}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'paid' && (
            <Button
              size="small"
              onClick={() => updateMutation.mutate({ id: record.id, status: 'shipped' })}
            >
              发货
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return <Table dataSource={ordersData || []} columns={columns} rowKey="id" size="small" />;
}

function AdminProducts() {
  const queryClient = useQueryClient();
  const { data } = useQuery<AdminProduct[]>({
    queryKey: ['admin', 'products'],
    queryFn: async () => request<AdminProduct[]>({ url: '/admin/products', method: 'GET' }),
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      await request<void>({ url: `/admin/products/${id}`, method: 'DELETE' });
    },
    onSuccess: () => {
      message.success('已下架');
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });

  const columns: TableColumnsType<AdminProduct> = [
    { title: '名称', dataIndex: 'name' },
    { title: '价格', dataIndex: 'price', render: (v: number) => `${formatPrice(v)}` },
    { title: '库存', dataIndex: 'stock' },
    { title: '销量', dataIndex: 'sales' },
    {
      title: '状态',
      dataIndex: 'isActive',
      render: (v: boolean) => (v ? <Tag color="green">上架</Tag> : <Tag>下架</Tag>),
    },
    {
      title: '操作',
      render: (_, record) => (
        <Popconfirm title="确定下架?" onConfirm={() => toggleMutation.mutate(record.id)}>
          <Button size="small" danger>
            下架
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return <Table dataSource={data || []} columns={columns} rowKey="id" size="small" />;
}

function AdminPrizes() {
  const queryClient = useQueryClient();
  const { data } = useQuery<AdminPrize[]>({
    queryKey: ['admin', 'prizes'],
    queryFn: async () => request<AdminPrize[]>({ url: '/admin/prizes', method: 'GET' }),
  });

  const restockMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      await request<void>({ url: `/admin/prizes/${id}/restock`, method: 'POST', data: { stock } });
    },
    onSuccess: () => {
      message.success('已补货');
      queryClient.invalidateQueries({ queryKey: ['admin', 'prizes'] });
    },
  });

  const handleRestock =
    (record: AdminPrize): InputNumberProps['onPressEnter'] =>
    (event) => {
      restockMutation.mutate({ id: record.id, stock: Number(event.currentTarget.value) });
    };

  const columns: TableColumnsType<AdminPrize> = [
    { title: '名称', dataIndex: 'name' },
    {
      title: '类型',
      dataIndex: 'type',
      render: (t: string) => ({ coupon: '优惠券', points: '积分', gift: '实物' })[t] || t,
    },
    {
      title: '段位',
      dataIndex: 'tier',
      render: (t: string) => ({ easy: '⭐', medium: '⭐⭐', hard: '⭐⭐⭐' })[t] || t,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      render: (v: number) => <span style={{ color: v < 5 ? 'red' : 'green' }}>{v}</span>,
    },
    {
      title: '价值',
      dataIndex: 'value',
      render: (v: number, record) =>
        record.type === 'coupon'
          ? `¥${(v / 100).toFixed(0)}券`
          : record.type === 'points'
            ? `${v}分`
            : '-',
    },
    {
      title: '概率',
      dataIndex: 'probability',
      render: (v: number) => `${(Number(v) * 100).toFixed(0)}%`,
    },
    {
      title: '补货',
      render: (_, record) => (
        <InputNumber
          min={0}
          max={9999}
          defaultValue={record.stock}
          size="small"
          style={{ width: 80 }}
          onPressEnter={handleRestock(record)}
        />
      ),
    },
  ];

  return <Table dataSource={data || []} columns={columns} rowKey="id" size="small" />;
}

function AdminUsers() {
  const queryClient = useQueryClient();
  const { data } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => request<AdminUser[]>({ url: '/admin/users', method: 'GET' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, role, status }: UpdateUserPayload) => {
      await request<void>({ url: `/admin/users/${id}`, method: 'PATCH', data: { role, status } });
    },
    onSuccess: () => {
      message.success('已更新');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const columns: TableColumnsType<AdminUser> = [
    { title: '用户名', dataIndex: 'username' },
    { title: '邮箱', dataIndex: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      render: (role: string) => <Tag color={role === 'admin' ? 'red' : 'blue'}>{role}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Select
            size="small"
            defaultValue={record.role}
            style={{ width: 80 }}
            onChange={(role) => updateMutation.mutate({ id: record.id, role })}
            options={[
              { value: 'user', label: '用户' },
              { value: 'admin', label: '管理员' },
            ]}
          />
          <Select
            size="small"
            defaultValue={record.status}
            style={{ width: 80 }}
            onChange={(status) => updateMutation.mutate({ id: record.id, status })}
            options={[
              { value: 'active', label: '正常' },
              { value: 'banned', label: '封禁' },
            ]}
          />
        </Space>
      ),
    },
  ];

  return <Table dataSource={data || []} columns={columns} rowKey="id" size="small" />;
}
