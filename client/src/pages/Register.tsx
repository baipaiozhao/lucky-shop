import { Card, Typography, Form, Input, Button, Space, message } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '@api/auth';
import { useAuthStore } from '@store/authStore';

const { Title, Paragraph } = Typography;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  async function onFinish(values: { username: string; email: string; password: string }) {
    setLoading(true);
    try {
      const { user } = await register(values);
      setUser(user);
      message.success('注册成功！');
      navigate('/');
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '注册失败'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480, padding: '48px 16px' }}>
      <Card className="auth-card">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2}>🦊 注册</Title>
            <Paragraph type="secondary">创建您的我买我卖账号</Paragraph>
          </div>
          <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, min: 2, max: 20, message: '用户名 2-20 位' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" size="large" />
            </Form.Item>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}
            >
              <Input prefix={<MailOutlined />} placeholder="请输入邮箱" size="large" />
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, min: 6, message: '密码至少 6 位' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="至少 6 位" size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                注册
              </Button>
            </Form.Item>
          </Form>
          <Paragraph type="secondary" style={{ textAlign: 'center', fontSize: 12 }}>
            已有账号？<Link to="/login">立即登录</Link>
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
}
