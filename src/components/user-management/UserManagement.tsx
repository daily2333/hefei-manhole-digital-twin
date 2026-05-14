import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  App,
  Row,
  Col,
  Tag,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  TeamOutlined,
  SafetyOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { fetchUsers, createUser, updateUser, deleteUser } from '../../services/api/userService';
import dayjs from 'dayjs';

interface User {
  id: string;
  username: string;
  display_name: string;
  role: string;
  status: string;
  email: string;
  phone: string;
  created_at: string;
}

const statusMap: Record<string, string> = {
  active: '激活',
  inactive: '未激活',
};

const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '操作员', value: 'operator' },
  { label: '查看者', value: 'viewer' },
];

const statusOptions = [
  { label: '激活', value: 'active' },
  { label: '未激活', value: 'inactive' },
];

const UserManagementInner: React.FC = () => {
  const { message, modal } = App.useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      display_name: user.display_name,
      role: user.role,
      status: user.status,
      email: user.email,
      phone: user.phone,
    });
    setModalVisible(true);
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteUser(userId);
      message.success('删除成功');
      await loadUsers();
    } catch {
      message.error('删除失败');
    }
  };

  const toggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await updateUser(user.id, { status: newStatus });
      message.success(`用户状态已更改为${statusMap[newStatus]}`);
      await loadUsers();
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || '状态变更失败';
      message.error(errMsg);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success('更新成功');
      } else {
        await createUser(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      await loadUsers();
    } catch (err: any) {
      if (err?.response?.data?.error) {
        message.error(err.response.data.error);
      }
    }
  };

  const renderStatusTag = (status: string) => {
    switch (status) {
      case 'active':
        return <Tag color="success">激活</Tag>;
      case 'inactive':
        return <Tag color="default">未激活</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const renderRoleTag = (role: string) => {
    switch (role) {
      case 'admin':
        return <Tag color="red">管理员</Tag>;
      case 'operator':
        return <Tag color="blue">操作员</Tag>;
      case 'viewer':
        return <Tag color="green">查看者</Tag>;
      default:
        return <Tag>{role}</Tag>;
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '显示名',
      dataIndex: 'display_name',
      key: 'display_name',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: renderRoleTag,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: renderStatusTag,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? '停用' : '激活'}>
            <Button
              type="link"
              icon={record.status === 'active' ? <StopOutlined /> : <SafetyOutlined />}
              onClick={() => toggleUserStatus(record)}
              style={{ color: record.status === 'active' ? '#faad14' : '#52c41a' }}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此用户？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <TeamOutlined />
            <span>用户管理</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增用户
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item name="display_name" label="显示名">
            <Input placeholder="请输入显示名" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="role" label="角色" initialValue="operator">
                <Select options={roleOptions} placeholder="选择角色" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="active">
                <Select options={statusOptions} placeholder="选择状态" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const UserManagement: React.FC = () => (
  <App>
    <UserManagementInner />
  </App>
);

export default UserManagement;
