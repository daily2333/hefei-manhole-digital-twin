import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const { message } = App.useApp();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      window.location.href = '/';
    } catch (err: any) {
      const msg = err?.response?.data?.error || '登录失败，请检查用户名和密码';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0F172A',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(24,144,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(34,197,94,0.05) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(30,41,59,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,0.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />
      <Card
        style={{
          width: 420,
          background: 'rgba(15,23,42,0.9)',
          border: '1px solid rgba(30,41,59,0.8)',
          borderRadius: 12,
          boxShadow: '0 0 40px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <SafetyOutlined style={{ fontSize: 48, color: '#22C55E', marginBottom: 16 }} />
          <Title level={3} style={{ color: '#F8FAFC', margin: 0, fontFamily: 'Fira Sans, sans-serif' }}>
            智慧井盖管理平台
          </Title>
          <Text style={{ color: '#64748B', fontSize: 14, marginTop: 8, display: 'block' }}>
            请登录以继续
          </Text>
        </div>
        <Form
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#475569' }} />}
              placeholder="用户名"
              style={{
                background: 'rgba(30,41,59,0.6)',
                border: '1px solid rgba(51,65,85,0.6)',
                color: '#F8FAFC',
                height: 44,
                borderRadius: 8,
              }}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#475569' }} />}
              placeholder="密码"
              iconRender={(visible) => visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
              style={{
                background: 'rgba(30,41,59,0.6)',
                border: '1px solid rgba(51,65,85,0.6)',
                color: '#F8FAFC',
                height: 44,
                borderRadius: 8,
              }}
            />
          </Form.Item>
          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 44,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
                border: 'none',
                fontWeight: 600,
                fontSize: 16,
                color: '#F8FAFC',
              }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text style={{ color: '#475569', fontSize: 12 }}>
            宿州学院戴磊
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
