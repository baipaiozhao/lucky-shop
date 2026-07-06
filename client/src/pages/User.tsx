import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '../utils/format';
import {
  Card,
  Typography,
  Button,
  Space,
  Avatar,
  Form,
  Input,
  message,
  Tabs,
  List,
  Modal,
  Tag,
  Statistic,
  Row,
  Col,
} from 'antd';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  PlusOutlined,
  GiftOutlined,
  DollarOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import {
  getMe,
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@api/auth';
import { getFavorites, removeFavorite } from '@api/products';
import { useAuthStore } from '@store/authStore';
import { http } from '@api/client';
import type { Address, Product } from '@types';

const { Title, Text } = Typography;

type PrizeCenterData = {
  points?: { balance?: number };
  coupons?: unknown[];
  gifts?: unknown[];
};

type CheckinData = {
  checked?: boolean;
};

type CheckinResponse = {
  record: { points: number };
};

type AddressFormValues = Omit<Address, 'id'>;

export default function User() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, setUser, logout } = useAuthStore();
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [form] = Form.useForm();
  const [checking, setChecking] = useState(false);

  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!user,
  });
  useEffect(() => {
    if (userData) setUser(userData);
  }, [setUser, userData]);

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
  });

  const { data: favoritesRaw } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
  });
  // 后端返回 {id, userId, productId, product: {...}} 结构，需要提取 product
  const favorites = favoritesRaw?.map((item: any) => item.product || item) || [];

  // 积分 + 签到
  const { data: prizesData } = useQuery({
    queryKey: ['prizes'],
    queryFn: async () => {
      const res = await http.get<PrizeCenterData>('/prizes/my');
      return res.data;
    },
    enabled: !!user,
  });

  const { data: checkinData, refetch: refetchCheckin } = useQuery({
    queryKey: ['checkin', 'today'],
    queryFn: async () => {
      const res = await http.get<CheckinData>('/checkin/today');
      return res.data;
    },
    enabled: !!user,
  });

  async function doCheckin() {
    setChecking(true);
    try {
      const res = await http.post<CheckinResponse>('/checkin');
      message.success(`签到成功！+${res.data.record.points} 积分`);
      refetchCheckin();
      queryClient.invalidateQueries({ queryKey: ['prizes'] });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '签到失败';
      message.error(errorMessage);
    } finally {
      setChecking(false);
    }
  }

  const updateProfileMutation = useMutation({
    mutationFn: (data: { username?: string; phone?: string }) => updateProfile(data),
    onSuccess: (data) => {
      setUser(data);
      message.success('资料更新成功');
    },
  });

  const saveAddressMutation = useMutation({
    mutationFn: async (values: AddressFormValues) => {
      if (editingAddress) {
        await updateAddress(editingAddress.id, values);
      } else {
        await createAddress(values);
      }
    },
    onSuccess: () => {
      message.success('地址保存成功');
      setAddressModalOpen(false);
      setEditingAddress(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => {
      message.success('地址已删除');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => setDefaultAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const removeFavMutation = useMutation({
    mutationFn: (productId: string) => removeFavorite(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const tabItems = [
    {
      key: 'profile',
      label: '👤 个人资料',
      children: (
        <Card size="small">
          <Form
            layout="vertical"
            initialValues={{ username: user?.username, phone: user?.phone }}
            onFinish={(values) => updateProfileMutation.mutate(values)}
          >
            <Form.Item name="username" label="用户名">
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="手机号">
              <Input />
            </Form.Item>
            <Form.Item label="邮箱">
              <Input disabled value={user?.email} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={updateProfileMutation.isPending}>
                保存
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'addresses',
      label: '📍 地址簿',
      children: (
        <Card
          size="small"
          title="收货地址"
          extra={
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingAddress(null);
                form.resetFields();
                setAddressModalOpen(true);
              }}
            >
              新增
            </Button>
          }
        >
          <List
            dataSource={addresses}
            renderItem={(addr: Address) => (
              <List.Item
                actions={[
                  addr.isDefault ? (
                    <Tag key="default-tag" color="blue">
                      默认
                    </Tag>
                  ) : (
                    <Button
                      key="set-default"
                      size="small"
                      onClick={() => setDefaultMutation.mutate(addr.id)}
                    >
                      设为默认
                    </Button>
                  ),
                  <Button
                    key="edit"
                    size="small"
                    onClick={() => {
                      setEditingAddress(addr);
                      form.setFieldsValue(addr);
                      setAddressModalOpen(true);
                    }}
                  >
                    编辑
                  </Button>,
                  <Button
                    key="delete"
                    size="small"
                    danger
                    onClick={() => deleteAddressMutation.mutate(addr.id)}
                  >
                    删除
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <>
                      <Text strong>{addr.name}</Text> <Text>{addr.phone}</Text>
                    </>
                  }
                  description={`${addr.province}${addr.city}${addr.district}${addr.detail}`}
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'favorites',
      label: '❤️ 收藏',
      children: (
        <Card size="small" title="我的收藏">
          {!favorites?.length ? (
            <Text type="secondary">暂无收藏商品</Text>
          ) : (
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
              dataSource={favorites}
              renderItem={(product: Product) => (
                <List.Item>
                  <Card
                    hoverable
                    cover={
                      <img
                        src={
                          product.images?.[0] || 'https://placehold.co/300x200/FF6B35/FFF?text=P'
                        }
                        alt={product.name}
                        style={{ height: 160, objectFit: 'cover' }}
                      />
                    }
                    onClick={() => navigate(`/products/${product.id}`)}
                    actions={[
                      <Button
                        key="remove"
                        size="small"
                        danger
                        onClick={() => removeFavMutation.mutate(product.id)}
                      >
                        取消收藏
                      </Button>,
                    ]}
                  >
                    <Card.Meta
                      title={product.name}
                      description={`${formatPrice(product.price)}`}
                    />
                  </Card>
                </List.Item>
              )}
            />
          )}
        </Card>
      ),
    },
    {
      key: 'orders',
      label: '📋 订单',
      children: (
        <Card size="small">
          <Button type="primary" onClick={() => navigate('/orders')}>
            查看我的订单
          </Button>
        </Card>
      ),
    },
    {
      key: 'prizes',
      label: '🎁 奖品',
      children: (
        <Card size="small">
          <Space direction="vertical">
            <Button type="primary" icon={<GiftOutlined />} onClick={() => navigate('/prizes')}>
              我的奖品中心
            </Button>
          </Space>
        </Card>
      ),
    },
  ];

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: 800, margin: '0 auto' }}>
      {/* 用户信息卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <Space>
            <Avatar
              size={64}
              src={user?.avatar}
              icon={<UserOutlined />}
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            <div>
              <Title level={3} style={{ margin: 0 }}>
                {user?.username}
              </Title>
              <Text type="secondary">{user?.email}</Text>
            </div>
          </Space>
          <Button
            danger
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            退出登录
          </Button>
        </Space>
      </Card>

      {/* 积分 & 签到 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="积分"
              prefix={<DollarOutlined />}
              value={prizesData?.points?.balance || 0}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="奖品"
              prefix={<GiftOutlined />}
              value={(prizesData?.coupons?.length || 0) + (prizesData?.gifts?.length || 0)}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            {checkinData?.checked ? (
              <div>
                <CalendarOutlined style={{ fontSize: 20, color: '#06D6A0' }} />
                <br />
                <Text type="secondary">今日已签</Text>
              </div>
            ) : (
              <Button
                type="primary"
                size="small"
                icon={<CalendarOutlined />}
                loading={checking}
                onClick={doCheckin}
              >
                签到
              </Button>
            )}
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="profile" items={tabItems} />

      {/* 地址编辑弹窗 */}
      <Modal
        title={editingAddress ? '编辑地址' : '新增地址'}
        open={addressModalOpen}
        onCancel={() => {
          setAddressModalOpen(false);
          setEditingAddress(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => saveAddressMutation.mutate(values)}
        >
          <Form.Item name="name" label="收货人" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ required: true, pattern: /^1[3-9]\d{9}$/ }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="province" label="省份" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="city" label="城市" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="district" label="区县" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="detail" label="详细地址" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saveAddressMutation.isPending} block>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
