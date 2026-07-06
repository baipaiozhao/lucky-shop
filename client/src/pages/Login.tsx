import { Card, Typography, Form, Input, Button, Space, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '@api/auth';
import { useAuthStore } from '@store/authStore';

const { Title, Paragraph } = Typography;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  async function onFinish(values: { email: string; password: string }) {
    setLoading(true);
    try {
      const { user } = await login(values);
      setUser(user);
      message.success('登录成功！');
      const redirect = new URLSearchParams(location.search).get('redirect') || '/';
      navigate(redirect);
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '登录失败'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480, padding: '48px 16px' }}>
      <Card className="auth-card">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2}>🦊 登录</Title>
            <Paragraph type="secondary">使用账号登录我买我卖</Paragraph>
          </div>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            initialValues={{ email: 'test@luckyshop.com', password: 'test123' }}
          >
            <Form.Item
              name="email"
              label="邮箱"
              rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}
            >
              <Input prefix={<MailOutlined />} placeholder="test@luckyshop.com" size="large" />
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, min: 6, message: '密码至少 6 位' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="••••••" size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                登录
              </Button>
            </Form.Item>
          </Form>
          <Paragraph type="secondary" style={{ textAlign: 'center', fontSize: 12 }}>
            演示账号: test@luckyshop.com / test123 · <Link to="/register">注册新账号</Link> ·{' '}
            <Link to="/forgot-password">忘记密码</Link>
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
}
