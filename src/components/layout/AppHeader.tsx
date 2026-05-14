import React, { useState } from 'react';
import { Layout, Button, Badge, Dropdown, Modal, Form, Input, message, Avatar, Space, Typography } from 'antd';
import { 
  BellOutlined, 
  QuestionCircleOutlined, 
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  SettingOutlined,
  DownOutlined
} from '@ant-design/icons';
import { SystemStatusPanel } from './SystemStatusPanel';
import { useAuth } from '../../contexts/AuthContext';
import { updateUser } from '../../services/api/userService';

const { Header } = Layout;
const { Text } = Typography;

interface AppHeaderProps {
  currentTime: Date;
  notifications: number;
  onClearNotifications: () => void;
}

const roleLabels: Record<string, string> = {
  admin: '系统管理员',
  operator: '运维操作员',
  viewer: '观察员'
};

const roleColors: Record<string, string> = {
  admin: '#f5222d',
  operator: '#1890ff',
  viewer: '#52c41a'
};

export const AppHeader: React.FC<AppHeaderProps> = ({ 
  currentTime, 
  notifications,
  onClearNotifications
}) => {
  const { user, logout } = useAuth();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async (values: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    if (!user) return;
    
    setChangingPassword(true);
    try {
      await updateUser(user.id, { password: values.newPassword });
      message.success('密码修改成功');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (err) {
      message.error('密码修改失败');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        logout();
        window.location.href = '/login';
      }
    });
  };

  const userMenuItems = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '8px 0', minWidth: 200 }}>
          <div style={{ fontWeight: 'bold', fontSize: 14 }}>{user?.display_name || user?.username}</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            <Badge color={roleColors[user?.role || 'viewer']} text={roleLabels[user?.role || 'viewer']} />
          </div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{user?.email || '-'}</div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'change-password',
      icon: <KeyOutlined />,
      label: '修改密码',
      onClick: () => setPasswordModalVisible(true),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <>
      <Header className="header-container">
        <div className="logo-area">
          <div className="city-logo"></div>
          <div className="platform-title">
            <h1>智能井盖中央管理平台</h1>
          </div>
        </div>
        
        <div className="header-controls">
          <SystemStatusPanel currentTime={currentTime} />
          
          <Badge count={notifications} size="small">
            <Button 
              type="text" 
              icon={<BellOutlined />} 
              className="header-icon-button"
              onClick={onClearNotifications}
              title="通知"
            />
          </Badge>
          
          <Button 
            type="text" 
            icon={<QuestionCircleOutlined />} 
            className="header-icon-button"
            title="帮助"
          />
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
            <Button type="text" className="header-user-button">
              <Space>
                <Avatar 
                  size="small" 
                  icon={<UserOutlined />} 
                  style={{ backgroundColor: roleColors[user?.role || 'viewer'] }}
                />
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                  {user?.display_name || user?.username || '用户'}
                </span>
              </Space>
            </Button>
          </Dropdown>
        </div>
      </Header>

      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setPasswordModalVisible(false);
                passwordForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={changingPassword}>
                确认修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
