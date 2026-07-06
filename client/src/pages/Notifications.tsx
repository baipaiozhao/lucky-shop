import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, List, Typography, Badge, Button, Space, Empty, Tag, message } from 'antd';
import {
  BellOutlined,
  GiftOutlined,
  ShoppingOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { http } from '@api/client';
import { useAuthStore } from '@store/authStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const { Title, Text, Paragraph } = Typography;

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: string;
  read: boolean;
  createdAt: string;
};

export default function Notifications() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await http.get<{ notifications: Notification[] }>('/notifications');
      return res.data.notifications;
    },
    enabled: !!user,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await http.post('/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      message.success('已全部标记为已读');
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await http.post(`/notifications/${id}/mark-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      achievement: <TrophyOutlined style={{ color: '#52c41a', fontSize: 20 }} />,
      order: <ShoppingOutlined style={{ color: '#1890ff', fontSize: 20 }} />,
      prize: <GiftOutlined style={{ color: '#faad14', fontSize: 20 }} />,
      system: <InfoCircleOutlined style={{ color: '#722ed1', fontSize: 20 }} />,
    };
    return icons[type] || <BellOutlined style={{ fontSize: 20 }} />;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      achievement: 'green',
      order: 'blue',
      prize: 'orange',
      system: 'purple',
    };
    return colors[type] || 'default';
  };

  const getTypeName = (type: string) => {
    const names: Record<string, string> = {
      achievement: '成就',
      order: '订单',
      prize: '奖品',
      system: '系统',
    };
    return names[type] || type;
  };

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  if (!user) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: 60 }}>
        <Empty description="请先登录查看通知" />
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <Card style={{ marginBottom: 24, background: 'var(--gradient-primary)', color: '#fff' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Badge count={unreadCount} overflowCount={99} size="small">
              <BellOutlined style={{ fontSize: 32 }} />
            </Badge>
            <div>
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                消息通知
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                {unreadCount > 0 ? `您有 ${unreadCount} 条未读消息` : '暂无未读消息'}
              </Text>
            </div>
          </Space>
          {unreadCount > 0 ? (
            <Button
              type="text"
              style={{ color: '#fff' }}
              onClick={() => markAllReadMutation.mutate()}
              loading={markAllReadMutation.isPending}
              icon={<CheckCircleOutlined />}
            >
              全部已读
            </Button>
          ) : null}
        </Space>
      </Card>

      <Card>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="ant-skeleton ant-skeleton-active">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="ant-skeleton-paragraph" style={{ marginBottom: 16 }}>
                  <li style={{ width: '100%', height: 48 }} />
                </div>
              ))}
            </div>
          </div>
        ) : !notifications?.length ? (
          <Empty description="暂无通知消息" />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                style={{
                  background: notification.read ? 'transparent' : '#f6ffed',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  cursor: 'pointer',
                }}
                onClick={() => !notification.read && markReadMutation.mutate(notification.id)}
              >
                <Space align="start" style={{ width: '100%' }}>
                  <Badge dot={!notification.read} offset={[2, 2]}>
                    <div style={{ padding: 8 }}>{getTypeIcon(notification.type)}</div>
                  </Badge>
                  <div style={{ flex: 1 }}>
                    <Space align="center" style={{ marginBottom: 4 }}>
                      <Text strong>{notification.title}</Text>
                      <Tag color={getTypeColor(notification.type)} style={{ fontSize: 12 }}>
                        {getTypeName(notification.type)}
                      </Tag>
                    </Space>
                    <Paragraph type="secondary" style={{ margin: 0 }}>
                      {notification.body}
                    </Paragraph>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {format(new Date(notification.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                    </Text>
                  </div>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
