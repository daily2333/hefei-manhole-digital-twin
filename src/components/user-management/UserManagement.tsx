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
  message, 
  Row, 
  Col, 
  Avatar, 
  Tabs,
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
  SettingOutlined,
  SafetyOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { formatDateTime, generateUniqueId } from '../../utils';

// 用户角色枚举
enum UserRole {
  Admin = '管理员',
  Operator = '操作员',
  Viewer = '查看者',
  Maintenance = '维护人员'
}

// 用户状态枚举
enum UserStatus {
  Active = '激活',
  Inactive = '未激活',
  Locked = '锁定',
  Suspended = '暂停'
}

// 用户信息接口
interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  lastLogin?: string;
  createdAt: string;
  permissions: string[];
}

// 用户日志接口
interface UserLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  ip: string;
  timestamp: string;
  details: string;
}

// 部门及对应的域名和角色
const departments = [
  { 
    name: '技术部', 
    domain: 'hefeiwater.gov.cn',
    roles: ['系统工程师', '网络管理员', '数据库专员', '开发工程师', '测试工程师'] 
  },
  { 
    name: '监控中心', 
    domain: 'hefeiwater.gov.cn',
    roles: ['监控专员', '数据分析师', '运维工程师', '值班主管', '故障处理员'] 
  },
  { 
    name: '市政管理部', 
    domain: 'hefeiwater.gov.cn',
    roles: ['市政主管', '规划专员', '项目经理', '协调员', '审批专员'] 
  },
  { 
    name: '工程部', 
    domain: 'hefeiwater.gov.cn',
    roles: ['工程主管', '现场工程师', '质检专员', '安全主管', '设备工程师'] 
  },
  { 
    name: '业务部', 
    domain: 'hefeiwater.gov.cn',
    roles: ['业务主管', '客户经理', '服务专员', '合同管理员', '业务分析师'] 
  },
  { 
    name: '应急处理部', 
    domain: 'hefeiwater.gov.cn',
    roles: ['应急主管', '快速反应员', '协调专员', '抢修组长', '现场指挥'] 
  }
];

// 用户权限数据
const permissionOptions = [
  { label: '实时监控访问', value: 'monitor:access' },
  { label: '告警管理', value: 'alarm:manage' },
  { label: '数据分析访问', value: 'analytics:access' },
  { label: '设备配置', value: 'device:configure' },
  { label: '系统设置', value: 'system:configure' },
  { label: '用户管理', value: 'user:manage' },
  { label: '维护记录管理', value: 'maintenance:manage' },
  { label: '报表生成', value: 'report:generate' },
  { label: '数据导出', value: 'data:export' },
  { label: 'API访问', value: 'api:access' }
];

// 汉字姓氏到拼音的映射
const lastNamePinyinMap: Record<string, string> = {
  '张': 'zhang', '李': 'li', '王': 'wang', '赵': 'zhao', '陈': 'chen', 
  '刘': 'liu', '杨': 'yang', '黄': 'huang', '周': 'zhou', '吴': 'wu',
  '徐': 'xu', '孙': 'sun', '马': 'ma', '朱': 'zhu', '胡': 'hu', 
  '林': 'lin', '郭': 'guo', '何': 'he', '高': 'gao', '罗': 'luo'
};

// 汉字名字到拼音的映射
const firstNamePinyinMap: Record<string, string> = {
  '伟': 'wei', '芳': 'fang', '娜': 'na', '秀英': 'xiuying', '敏': 'min', 
  '静': 'jing', '丽': 'li', '强': 'qiang', '磊': 'lei', '洋': 'yang', 
  '艳': 'yan', '勇': 'yong', '军': 'jun', '杰': 'jie', '娟': 'juan', 
  '涛': 'tao', '明': 'ming', '超': 'chao', '秀兰': 'xiulan', '霞': 'xia', 
  '平': 'ping', '刚': 'gang', '桂英': 'guiying'
};

/**
 * 生成随机IP地址
 */
const generateRandomIp = () => {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

/**
 * 生成邮箱地址
 */
const generateEmail = (lastName: string, firstName: string, domain: string): string => {
  const lastNamePinyin = lastNamePinyinMap[lastName] || 'user';
  const firstNamePinyin = firstNamePinyinMap[firstName] || 'user';
  
  // 邮箱格式选择
  const format = Math.random();
  
  if (format < 0.5) {
    // 格式1: zhang.wei@domain.com (50%)
    return `${lastNamePinyin}.${firstNamePinyin}@${domain}`;
  } else if (format < 0.85) {
    // 格式2: zhangwei@domain.com (35%)
    return `${lastNamePinyin}${firstNamePinyin}@${domain}`;
  } else {
    // 格式3: w.zhang@domain.com (15%)
    const initial = firstNamePinyin.charAt(0);
    return `${initial}.${lastNamePinyin}@${domain}`;
  }
};

/**
 * 生成模拟用户日志
 */
const generateUserLogs = (users: User[], count: number = 200): UserLog[] => {
  const actions = [
    '登录系统', 
    '退出系统', 
    '修改密码', 
    '查看设备列表', 
    '查看告警信息',
    '处理告警', 
    '添加维护记录', 
    '导出报表', 
    '修改个人信息',
    '查看数据分析',
    '访问实时监控',
    '查询历史数据',
    '配置系统参数',
    '重置他人密码',
    '添加新用户',
    '修改用户权限'
  ];
  
  const logs: UserLog[] = [];
  
  // 获取过去30天的日期范围
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);
  
  for (let i = 0; i < count; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    // 生成随机时间戳
    const timestamp = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    ).toISOString();
    
    logs.push({
      id: generateUniqueId(),
      userId: user.id,
      username: user.username,
      action,
      ip: generateRandomIp(),
      timestamp,
      details: `用户${user.name}(${user.username})于${formatDateTime(timestamp)}执行了${action}操作`
    });
  }
  
  // 按时间戳降序排序
  return logs.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

/**
 * 创建模拟用户数据
 */
const generateUserData = (): User[] => {
  // 用户姓氏列表
  const lastNames = Object.keys(lastNamePinyinMap);
  
  // 用户名列表
  const firstNames = Object.keys(firstNamePinyinMap);
  
  // 生成随机日期函数
  const randomDate = (start: Date, end: Date): string => {
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');
  };
  
  // 用户列表
  const users: User[] = [];
  
  // 添加系统管理员
  users.push({
    id: '1',
    username: 'admin',
    name: '系统管理员',
    avatar: 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png',
    email: 'admin@hefeiwater.gov.cn',
    phone: '13901380000',
    role: UserRole.Admin,
    department: '信息中心',
    status: UserStatus.Active,
    lastLogin: '2024-04-10 14:13:24',
    createdAt: '2023-01-01 08:00:00',
    permissions: [
      'monitor:access', 
      'alarm:manage', 
      'analytics:access', 
      'device:configure', 
      'system:configure', 
      'user:manage', 
      'maintenance:manage', 
      'report:generate', 
      'data:export', 
      'api:access'
    ]
  });
  
  // 添加固定的测试用户
  const predefinedUsers = [
    {
      id: '2',
      username: 'user1',
      name: '吴梓',
      email: 'wu.zi@hefeiwater.gov.cn',
      phone: '13608011979',
      department: '业务部',
      role: UserRole.Admin
    },
    {
      id: '3',
      username: 'user2',
      name: '孙子',
      email: 'sun.zi@hefeiwater.gov.cn',
      phone: '13506364904',
      department: '业务部',
      role: UserRole.Viewer
    },
    {
      id: '4',
      username: 'user3',
      name: '杨亮',
      email: 'yang.liang@hefeiwater.gov.cn',
      phone: '13201136772',
      department: '技术部',
      role: UserRole.Operator
    },
    {
      id: '5',
      username: 'user4',
      name: '张健',
      email: 'zhang.jian@hefeiwater.gov.cn',
      phone: '13903543344',
      department: '技术部',
      role: UserRole.Viewer
    },
    {
      id: '6',
      username: 'user5',
      name: '杨思',
      email: 'yang.si@hefeiwater.gov.cn',
      phone: '13502438755',
      department: '技术部',
      role: UserRole.Viewer
    },
    {
      id: '7',
      username: 'user6',
      name: '周英',
      email: 'zhou.ying@hefeiwater.gov.cn',
      phone: '13909151640',
      department: '工程部',
      role: UserRole.Viewer
    },
    {
      id: '8',
      username: 'user7',
      name: '陈武',
      email: 'chen.wu@hefeiwater.gov.cn',
      phone: '13702316010',
      department: '工程部',
      role: UserRole.Maintenance
    },
    {
      id: '9',
      username: 'user8',
      name: '赵磊',
      email: 'zhao.lei@hefeiwater.gov.cn',
      phone: '13906589332',
      department: '监控中心',
      role: UserRole.Viewer
    },
    {
      id: '10',
      username: 'user9',
      name: '王菲',
      email: 'wang.fei@hefeiwater.gov.cn',
      phone: '13601791500',
      department: '业务部',
      role: UserRole.Viewer
    }
  ];
  
  // 为预定义用户添加缺失字段
  predefinedUsers.forEach(user => {
    // 生成时间范围
    const now = new Date();
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(now.getFullYear() - 3);
    
    // 生成权限
    let permissions: string[] = [];
    switch (user.role) {
      case UserRole.Admin:
        permissions = permissionOptions.map(option => option.value);
        break;
      case UserRole.Operator:
        permissions = [
          'monitor:access', 
          'alarm:manage', 
          'analytics:access', 
          'maintenance:manage', 
          'data:export'
        ];
        break;
      case UserRole.Viewer:
        permissions = [
          'monitor:access', 
          'analytics:access'
        ];
        break;
      case UserRole.Maintenance:
        permissions = [
          'monitor:access', 
          'maintenance:manage', 
          'device:configure', 
          'data:export'
        ];
        break;
    }
    
    users.push({
      ...user,
      avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${parseInt(user.id) + 10}.jpg`,
      status: UserStatus.Active,
      createdAt: randomDate(threeYearsAgo, now),
      lastLogin: randomDate(threeYearsAgo, now),
      permissions
    });
  });
  
  // 生成随机用户
  for (let i = predefinedUsers.length + 1; i <= 15; i++) {
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const fullName = lastName + firstName;
    
    const deptIndex = Math.floor(Math.random() * departments.length);
    const dept = departments[deptIndex];
    const roleIndex = Math.floor(Math.random() * dept.roles.length);
    const roleTitle = dept.roles[roleIndex];
    
    // 决定用户角色 (职位名称与角色的映射)
    let userRole = UserRole.Viewer; // 默认
    if (roleTitle.includes('主管') || roleTitle.includes('经理')) {
      userRole = Math.random() > 0.5 ? UserRole.Admin : UserRole.Operator;
    } else if (roleTitle.includes('工程师') || roleTitle.includes('专员')) {
      userRole = Math.random() > 0.7 ? UserRole.Operator : UserRole.Maintenance;
    }
    
    // 生成随机手机号
    const phonePrefix = ['139', '138', '137', '136', '135', '134', '186', '188', '189', '199'][Math.floor(Math.random() * 10)];
    const phoneNumber = `${phonePrefix}${Math.floor(1000000 + Math.random() * 9000000)}`;
    
    // 生成权限
    let permissions: string[] = [];
    switch (userRole) {
      case UserRole.Admin:
        permissions = permissionOptions.map(option => option.value);
        break;
      case UserRole.Operator:
        permissions = [
          'monitor:access', 
          'alarm:manage', 
          'analytics:access', 
          'maintenance:manage', 
          'data:export'
        ];
        break;
      case UserRole.Viewer:
        permissions = [
          'monitor:access', 
          'analytics:access'
        ];
        break;
      case UserRole.Maintenance:
        permissions = [
          'monitor:access', 
          'maintenance:manage', 
          'device:configure', 
          'data:export'
        ];
        break;
    }
    
    // 生成时间范围
    const now = new Date();
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(now.getFullYear() - 3);
    const createdAt = randomDate(threeYearsAgo, now);
    const lastLogin = randomDate(new Date(createdAt), now);
    
    users.push({
      id: (i + 1).toString(),
      username: `user${i + 1}`,
      name: fullName,
      avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${i + 10}.jpg`,
      email: generateEmail(lastName, firstName, dept.domain),
      phone: phoneNumber,
      role: userRole,
      department: dept.name,
      status: Math.random() > 0.8 ? UserStatus.Inactive : UserStatus.Active,
      lastLogin,
      createdAt,
      permissions
    });
  }
  
  return users;
};

// 生成用户数据
const mockUsers = generateUserData();

/**
 * 用户管理组件
 */
const UserManagement: React.FC = () => {
  // 状态定义
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [userLogs, setUserLogs] = useState<UserLog[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('添加用户');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [activeTabKey, setActiveTabKey] = useState('1');

  // 过滤和搜索状态
  const [roleFilter, setRoleFilter] = useState<UserRole | null>(null);
  const [statusFilter, setStatusFilter] = useState<UserStatus | null>(null);
  const [searchText, setSearchText] = useState('');
  
  // 加载模拟数据
  useEffect(() => {
    setLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      const mockUsers = generateUserData();
      setUsers(mockUsers);
      
      // 生成用户日志
      const logs = generateUserLogs(mockUsers);
      setUserLogs(logs);
      
      setLoading(false);
    }, 800);
  }, []);
  
  // 过滤用户列表
  const filteredUsers = users.filter(user => {
    // 角色过滤
    if (roleFilter && user.role !== roleFilter) {
      return false;
    }
    
    // 状态过滤
    if (statusFilter && user.status !== statusFilter) {
      return false;
    }
    
    // 搜索文本过滤
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      return (
        user.username.toLowerCase().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phone.includes(searchText) ||
        user.department.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // 过滤用户日志
  const filteredLogs = userLogs.filter(log => {
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      return (
        log.username.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        log.details.toLowerCase().includes(searchLower) ||
        log.ip.includes(searchText)
      );
    }
    return true;
  });
  
  // 打开添加用户模态框
  const showAddModal = () => {
    setEditingUser(null);
    setModalTitle('添加用户');
    form.resetFields();
    setIsModalVisible(true);
  };
  
  // 打开编辑用户模态框
  const showEditModal = (user: User) => {
    setEditingUser(user);
    setModalTitle('编辑用户');
    form.setFieldsValue({
      ...user,
      createdAt: user.createdAt ? dayjs(user.createdAt) : undefined
    });
    setIsModalVisible(true);
  };
  
  // 关闭模态框
  const handleCancel = () => {
    setIsModalVisible(false);
  };
  
  // 提交表单
  const handleSubmit = () => {
    form.validateFields().then(values => {
      if (editingUser) {
        // 更新用户
        const updatedUsers = users.map(user => 
          user.id === editingUser.id ? { ...user, ...values } : user
        );
        setUsers(updatedUsers);
        message.success('用户信息已更新');
      } else {
        // 添加新用户
        const newUser: User = {
          id: generateUniqueId(),
          ...values,
          createdAt: new Date().toISOString(),
          status: UserStatus.Active
        };
        setUsers([...users, newUser]);
        message.success('用户已添加');
      }
      
      setIsModalVisible(false);
    });
  };
  
  // 删除用户
  const handleDelete = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
    message.success('用户已删除');
  };
  
  // 更改用户状态
  const toggleUserStatus = (user: User) => {
    let newStatus: UserStatus;
    
    switch (user.status) {
      case UserStatus.Active:
        newStatus = UserStatus.Locked;
        break;
      case UserStatus.Locked:
        newStatus = UserStatus.Active;
        break;
      case UserStatus.Inactive:
        newStatus = UserStatus.Active;
        break;
      case UserStatus.Suspended:
        newStatus = UserStatus.Active;
        break;
      default:
        newStatus = UserStatus.Active;
    }
    
    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, status: newStatus } : u
    );
    
    setUsers(updatedUsers);
    message.success(`用户状态已更改为${newStatus}`);
  };
  
  // 渲染用户状态标签
  const renderStatusTag = (status: UserStatus) => {
    switch (status) {
      case UserStatus.Active:
        return <Tag color="success">激活</Tag>;
      case UserStatus.Inactive:
        return <Tag color="default">未激活</Tag>;
      case UserStatus.Locked:
        return <Tag color="error">锁定</Tag>;
      case UserStatus.Suspended:
        return <Tag color="warning">暂停</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };
  
  // 渲染用户角色标签
  const renderRoleTag = (role: UserRole) => {
    switch (role) {
      case UserRole.Admin:
        return <Tag color="magenta">管理员</Tag>;
      case UserRole.Operator:
        return <Tag color="blue">操作员</Tag>;
      case UserRole.Viewer:
        return <Tag color="green">查看者</Tag>;
      case UserRole.Maintenance:
        return <Tag color="orange">维护人员</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };
  
  // 用户列表列定义
  const userColumns = [
    {
      title: '用户',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: User) => (
        <Space>
          <Avatar 
            src={record.avatar}
            icon={<UserOutlined />}
            style={{ 
              backgroundColor: record.avatar ? undefined : 
                record.status === UserStatus.Active ? '#1890ff' : '#d9d9d9'
            }}
          />
          <div>
            <div>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>{record.username}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '联系信息',
      dataIndex: 'contact',
      key: 'contact',
      render: (_: string, record: User) => (
        <div>
          <div>{record.email}</div>
          <div>{record.phone}</div>
        </div>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => renderRoleTag(role),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: UserStatus) => renderStatusTag(status),
    },
    {
      title: '上次登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (lastLogin: string) => lastLogin ? formatDateTime(lastLogin) : '从未登录',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => formatDateTime(createdAt),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: string, record: User) => (
        <Space size="small">
          <Tooltip title="编辑用户">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => showEditModal(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === UserStatus.Active ? '锁定用户' : '解锁用户'}>
            <Button 
              type="text" 
              danger={record.status === UserStatus.Active}
              icon={record.status === UserStatus.Active ? <LockOutlined /> : <UnlockOutlined />} 
              onClick={() => toggleUserStatus(record)}
            />
          </Tooltip>
          <Tooltip title="删除用户">
            <Popconfirm
              title="确定要删除此用户吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="是"
              cancelText="否"
            >
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];
  
  // 用户日志列定义
  const logColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => formatDateTime(timestamp),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 150,
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
    },
  ];
  
  // 统计信息计算
  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === UserStatus.Active).length,
    locked: users.filter(u => u.status === UserStatus.Locked).length,
    inactive: users.filter(u => u.status === UserStatus.Inactive).length,
    admins: users.filter(u => u.role === UserRole.Admin).length,
    operators: users.filter(u => u.role === UserRole.Operator).length,
    viewers: users.filter(u => u.role === UserRole.Viewer).length,
    maintenance: users.filter(u => u.role === UserRole.Maintenance).length,
  };
  
  return (
    <Card 
      title={
        <Space>
          <TeamOutlined />
          <span>用户管理</span>
        </Space>
      }
      style={{ width: '100%' }}
    >
      <Tabs 
        activeKey={activeTabKey} 
        onChange={setActiveTabKey}
        tabBarExtraContent={
          <Space>
            <Input.Search
              placeholder="搜索用户..."
              allowClear
              onSearch={setSearchText}
              style={{ width: 250 }}
            />
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={showAddModal}
            >
              添加用户
            </Button>
          </Space>
        }
        items={[
          {
            key: '1',
            label: (
              <span>
                <UserOutlined />
                用户列表
              </span>
            ),
            children: (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <Card size="small">
                      <Row align="middle" gutter={16}>
                        <Col span={8}>
                          <Avatar 
                            icon={<TeamOutlined />} 
                            style={{ backgroundColor: '#1890ff', width: 50, height: 50 }}
                            size="large"
                          />
                        </Col>
                        <Col span={16}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{userStats.total}</div>
                          <div>总用户数</div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Row align="middle" gutter={16}>
                        <Col span={8}>
                          <Avatar 
                            icon={<SafetyOutlined />} 
                            style={{ backgroundColor: '#52c41a', width: 50, height: 50 }}
                            size="large"
                          />
                        </Col>
                        <Col span={16}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{userStats.active}</div>
                          <div>激活用户</div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Row align="middle" gutter={16}>
                        <Col span={8}>
                          <Avatar 
                            icon={<LockOutlined />} 
                            style={{ backgroundColor: '#ff4d4f', width: 50, height: 50 }}
                            size="large"
                          />
                        </Col>
                        <Col span={16}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{userStats.locked}</div>
                          <div>锁定用户</div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Row align="middle" gutter={16}>
                        <Col span={8}>
                          <Avatar 
                            icon={<SettingOutlined />} 
                            style={{ backgroundColor: '#722ed1', width: 50, height: 50 }}
                            size="large"
                          />
                        </Col>
                        <Col span={16}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{userStats.admins}</div>
                          <div>管理员</div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>
                
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={24}>
                    <Space>
                      <span>角色筛选:</span>
                      <Select
                        placeholder="选择角色"
                        style={{ width: 150 }}
                        allowClear
                        value={roleFilter || undefined}
                        onChange={(value) => setRoleFilter(value)}
                        options={Object.values(UserRole).map(role => ({ label: role, value: role }))}
                      />
                      
                      <span style={{ marginLeft: 16 }}>状态筛选:</span>
                      <Select
                        placeholder="选择状态"
                        style={{ width: 150 }}
                        allowClear
                        value={statusFilter || undefined}
                        onChange={(value) => setStatusFilter(value)}
                        options={Object.values(UserStatus).map(status => ({ label: status, value: status }))}
                      />
                    </Space>
                  </Col>
                </Row>
                
                <Table
                  columns={userColumns}
                  dataSource={filteredUsers}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条记录`
                  }}
                />
              </>
            )
          },
          {
            key: '2',
            label: (
              <span>
                <HistoryOutlined />
                操作日志
              </span>
            ),
            children: (
              <Table
                columns={logColumns}
                dataSource={filteredLogs}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`
                }}
              />
            )
          }
        ]}
      />
      
      {/* 添加/编辑用户模态框 */}
      <Modal
        title={modalTitle}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleSubmit}
        maskClosable={false}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="姓名" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="电话"
                rules={[{ required: true, message: '请输入电话号码' }]}
              >
                <Input placeholder="电话号码" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="选择角色">
                  {Object.values(UserRole).map(role => (
                    <Select.Option key={role} value={role}>{role}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="department"
                label="部门"
                rules={[{ required: true, message: '请选择部门' }]}
              >
                <Select placeholder="选择部门">
                  {departments.map(dept => (
                    <Select.Option key={dept.name} value={dept.name}>{dept.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="permissions"
            label="权限"
            rules={[{ required: true, message: '请选择至少一项权限' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择权限"
              style={{ width: '100%' }}
              options={permissionOptions}
            />
          </Form.Item>
          
          {!editingUser && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="密码"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confirmPassword"
                  label="确认密码"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请确认密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'));
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement; 