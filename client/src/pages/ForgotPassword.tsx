import { Card, Typography, Form, Input, Button, Space, message, Steps } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request } from '@api/client';
import type { ApiSuccess } from '@types';

const { Title, Paragraph } = Typography;

interface ForgotPasswordResponse {
  resetToken: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function ForgotPassword() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  async function requestReset(values: { email: string }) {
    setLoading(true);
    try {
      const res = await request<ApiSuccess<ForgotPasswordResponse>>({
        method: 'POST',
        url: '/auth/forgot-password',
        data: values,
      });
      setResetToken(res.data.resetToken);
      setEmail(values.email);
      setStep(1);
      message.success('重置令牌已生成');
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '请求失败'));
    } finally {
      setLoading(false);
    }
  }

  async function doReset(values: { newPassword: string }) {
    setLoading(true);
    try {
      await request<ApiSuccess<null>>({
        method: 'POST',
        url: '/auth/reset-password',
        data: { resetToken, newPassword: values.newPassword },
      });
      message.success('密码重置成功！请重新登录');
      navigate('/login');
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '重置失败'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480, padding: '48px 16px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2}>🔑 重置密码</Title>
          </div>

          <Steps
            current={step}
            size="small"
            items={[{ title: '验证邮箱' }, { title: '设置密码' }]}
          />

          {step === 0 ? (
            <Form layout="vertical" onFinish={requestReset}>
              <Form.Item name="email" label="注册邮箱" rules={[{ required: true, type: 'email' }]}>
                <Input prefix={<MailOutlined />} placeholder="请输入注册邮箱" size="large" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                  获取重置令牌
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <Form layout="vertical" onFinish={doReset}>
              <Paragraph type="secondary">正在为 {email} 重置密码</Paragraph>
              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[{ required: true, min: 6, message: '至少6位' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="新密码" size="large" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                  重置密码
                </Button>
              </Form.Item>
            </Form>
          )}

          <Paragraph style={{ textAlign: 'center', fontSize: 12 }}>
            <Link to="/login">返回登录</Link>
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
}
