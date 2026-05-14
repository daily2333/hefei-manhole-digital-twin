import React, { useState, useEffect, useCallback } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Tabs, 
  Statistic, 
  Badge, 
  Tag, 
  Space, 
  Input, 
  Select, 
  DatePicker, 
  Modal, 
  Form, 
  Tooltip,
  Spin,
  Calendar,
  Alert
} from 'antd';
import { 
  ToolOutlined, 
  CheckCircleOutlined, 
  SyncOutlined, 
  ClockCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  SearchOutlined,
  HistoryOutlined,
  FileTextOutlined,
  ScheduleOutlined,
  CalendarOutlined,
  CloseCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { MaintenanceRecord, MaintenanceType, ManholeInfo } from '../../typings';
import { generateMockMaintenanceRecords, generateEnhancedManholes } from '../../mock-data/manholes';
import { formatDateTime } from '../../utils';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

/**
 * 维护记录管理组件
 */
const MaintenanceManagement: React.FC = () => {
  // 维护记录
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  // 井盖数据
  const [manholes, setManholes] = useState<ManholeInfo[]>([]);
  // 加载状态
  const [loading, setLoading] = useState(false);
  // 标签页
  const [activeTab, setActiveTab] = useState('1');
  // 模态框
  const [isModalVisible, setIsModalVisible] = useState(false);
  // 表单
  const [form] = Form.useForm();
  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    manholeId: '',
    type: undefined as MaintenanceType | undefined,
    status: undefined as string | undefined,
    dateRange: undefined as [dayjs.Dayjs, dayjs.Dayjs] | undefined
  });
  // 当前日期
  const [currentDate, setCurrentDate] = useState(dayjs());

  // 获取模拟数据
  const fetchMaintenanceData = useCallback(async () => {
    setLoading(true);
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 获取模拟井盖数据
      const mockManholes = generateEnhancedManholes(30);
      setManholes(mockManholes);
      
      // 获取模拟维护记录数据
      const mockRecords = generateMockMaintenanceRecords(mockManholes);
      
      // 按时间排序，最新的在前面
      mockRecords.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      
      setMaintenanceRecords(mockRecords);
    } catch (error) {
      console.error('获取维护记录数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载数据
  useEffect(() => {
    fetchMaintenanceData();
    
    // 设置定时刷新 - 每10分钟刷新一次，避免频繁刷新
    const intervalId = setInterval(() => {
      // 只对部分数据做增量更新，避免全量刷新带来的巨大差异
      setMaintenanceRecords(prevRecords => {
        // 随机选择1-2条记录进行状态更新
        const updatedRecords = [...prevRecords];
        const updateCount = Math.floor(Math.random() * 2) + 1;
        
        for (let i = 0; i < updateCount; i++) {
          const index = Math.floor(Math.random() * updatedRecords.length);
          // 有30%的概率将进行中的维护标记为已完成
          if (updatedRecords[index].status === 'inProgress' && Math.random() < 0.3) {
            updatedRecords[index] = {
              ...updatedRecords[index],
              status: 'completed',
              completionTime: new Date().toISOString()
            };
          }
        }
        
        // 有5%的概率添加1条新维护记录
        if (Math.random() < 0.05) {
          const mockManholes = generateEnhancedManholes(5);
          const newRecords = generateMockMaintenanceRecords(mockManholes).slice(0, 1);
          return [...newRecords, ...updatedRecords];
        }
        
        return updatedRecords;
      });
    }, 600000); // 10分钟更新一次
    
    return () => clearInterval(intervalId);
  }, [fetchMaintenanceData]);

  // 计算维护记录统计数据
  const maintenanceStatistics = {
    total: maintenanceRecords.length,
    pending: maintenanceRecords.filter(r => r.status === 'pending').length,
    inProgress: maintenanceRecords.filter(r => r.status === 'inProgress').length,
    completed: maintenanceRecords.filter(r => r.status === 'completed').length,
    cancelled: maintenanceRecords.filter(r => r.status === 'cancelled').length,
    routine: maintenanceRecords.filter(r => r.type === MaintenanceType.Routine).length,
    repair: maintenanceRecords.filter(r => r.type === MaintenanceType.Repair).length,
    replacement: maintenanceRecords.filter(r => r.type === MaintenanceType.Replacement).length,
    calibration: maintenanceRecords.filter(r => r.type === MaintenanceType.Calibration).length,
    cleaning: maintenanceRecords.filter(r => r.type === MaintenanceType.Cleaning).length,
    systemUpgrade: maintenanceRecords.filter(r => r.type === MaintenanceType.SystemUpgrade).length,
  };

  // 表格列定义
  const columns = [
    {
      title: '维护ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '井盖ID',
      dataIndex: 'manholeId',
      key: 'manholeId',
      width: 100,
    },
    {
      title: '维护时间',
      dataIndex: 'time',
      key: 'time',
      render: (text: string) => formatDateTime(text),
      width: 180,
      sorter: (a: MaintenanceRecord, b: MaintenanceRecord) => 
        new Date(a.time).getTime() - new Date(b.time).getTime(),
    },
    {
      title: '维护类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: MaintenanceType) => {
        let color = '';
        switch (type) {
          case MaintenanceType.Routine:
            color = 'blue';
            break;
          case MaintenanceType.Repair:
            color = 'red';
            break;
          case MaintenanceType.Replacement:
            color = 'orange';
            break;
          case MaintenanceType.Calibration:
            color = 'green';
            break;
          case MaintenanceType.Cleaning:
            color = 'cyan';
            break;
          case MaintenanceType.SystemUpgrade:
            color = 'purple';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{type}</Tag>;
      },
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = '';
        let text = '';
        let icon = null;
        
        switch (status) {
          case 'pending':
            color = 'default';
            text = '待处理';
            icon = <ClockCircleOutlined />;
            break;
          case 'inProgress':
            color = 'processing';
            text = '进行中';
            icon = <SyncOutlined spin />;
            break;
          case 'completed':
            color = 'success';
            text = '已完成';
            icon = <CheckCircleOutlined />;
            break;
          case 'cancelled':
            color = 'error';
            text = '已取消';
            icon = <CloseCircleOutlined />;
            break;
          default:
            color = 'default';
            text = '未知';
        }
        
        return <Badge status={color as any} text={text} />;
      },
      width: 100,
    },
    {
      title: '维护人员',
      dataIndex: 'operatorName',
      key: 'operatorName',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
      width: 120,
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      render: (text: string) => (
        <Space>
          <PhoneOutlined />
          {text}
        </Space>
      ),
      width: 150,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: '完成时间',
      dataIndex: 'completionTime',
      key: 'completionTime',
      render: (text: string) => text ? formatDateTime(text) : '-',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: MaintenanceRecord) => (
        <Space size="small">
          <Button size="small" type="link">
            详情
          </Button>
          {record.status === 'pending' && (
            <Button size="small" type="primary">
              开始
            </Button>
          )}
          {record.status === 'inProgress' && (
            <Button size="small" type="primary" style={{ backgroundColor: '#52c41a' }}>
              完成
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 根据搜索条件过滤记录
  const filteredRecords = maintenanceRecords.filter(record => {
    // 根据井盖ID过滤
    if (searchParams.manholeId && !record.manholeId.includes(searchParams.manholeId)) {
      return false;
    }
    
    // 根据维护类型过滤
    if (searchParams.type && record.type !== searchParams.type) {
      return false;
    }
    
    // 根据状态过滤
    if (searchParams.status && record.status !== searchParams.status) {
      return false;
    }
    
    // 根据日期范围过滤
    if (searchParams.dateRange) {
      const recordDate = dayjs(record.time);
      if (
        recordDate.isBefore(searchParams.dateRange[0], 'day') || 
        recordDate.isAfter(searchParams.dateRange[1], 'day')
      ) {
        return false;
      }
    }
    
    return true;
  });

  // 处理模态框显示
  const showModal = () => {
    setIsModalVisible(true);
  };

  // 处理模态框取消
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // 处理表单提交
  const handleSubmit = () => {
    form.validateFields().then(values => {
      // 模拟添加新维护记录
      const newRecord: MaintenanceRecord = {
        id: `mtn-${Date.now()}`,
        manholeId: values.manholeId,
        time: new Date().toISOString(),
        type: values.type,
        description: values.description,
        operatorName: values.operatorName,
        contactPhone: values.contactPhone,
        status: 'pending',
        notes: values.notes,
      };
      
      setMaintenanceRecords([newRecord, ...maintenanceRecords]);
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  // 维护类型饼图配置
  const typeChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: 'rgba(255, 255, 255, 0.65)'
      }
    },
    series: [
      {
        name: '维护类型',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#041527',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: maintenanceStatistics.routine, name: '日常检查', itemStyle: { color: '#1890ff' } },
          { value: maintenanceStatistics.repair, name: '故障维修', itemStyle: { color: '#ff4d4f' } },
          { value: maintenanceStatistics.replacement, name: '设备更换', itemStyle: { color: '#fa8c16' } },
          { value: maintenanceStatistics.calibration, name: '设备校准', itemStyle: { color: '#52c41a' } },
          { value: maintenanceStatistics.cleaning, name: '清理', itemStyle: { color: '#13c2c2' } },
          { value: maintenanceStatistics.systemUpgrade, name: '系统升级', itemStyle: { color: '#722ed1' } }
        ]
      }
    ]
  };

  // 维护状态图表配置
  const statusChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: 'rgba(255, 255, 255, 0.65)'
      }
    },
    series: [
      {
        name: '维护状态',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#041527',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: maintenanceStatistics.pending, name: '待处理', itemStyle: { color: '#d9d9d9' } },
          { value: maintenanceStatistics.inProgress, name: '进行中', itemStyle: { color: '#1890ff' } },
          { value: maintenanceStatistics.completed, name: '已完成', itemStyle: { color: '#52c41a' } },
          { value: maintenanceStatistics.cancelled, name: '已取消', itemStyle: { color: '#ff4d4f' } }
        ]
      }
    ]
  };

  // 获取当前日期下的维护记录
  const getCalendarData = (value: dayjs.Dayjs) => {
    const date = value.format('YYYY-MM-DD');
    return maintenanceRecords.filter(record => 
      record.time.substring(0, 10) === date
    );
  };

  // 自定义日历单元格渲染
  const dateCellRender = (value: dayjs.Dayjs) => {
    const records = getCalendarData(value);
    return (
      <ul style={{ margin: 0, padding: '0 0 0 20px' }}>
        {records.slice(0, 2).map(record => (
          <li key={record.id} style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <Tooltip title={record.description}>
              <Tag color={record.type === MaintenanceType.Routine ? 'blue' : 'red'}>
                {record.type}
              </Tag>
            </Tooltip>
          </li>
        ))}
        {records.length > 2 && (
          <li style={{ fontSize: '12px' }}>
            <a>更多 {records.length - 2} 项...</a>
          </li>
        )}
      </ul>
    );
  };

  return (
    <div className="maintenance-management-container">
      {loading && (
        <div className="loading-overlay">
          <Spin size="large" tip="加载数据中..." />
        </div>
      )}
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ToolOutlined style={{ marginRight: 8 }} />
                <span>维护管理中心</span>
              </div>
            }
            className="glass-card"
            extra={
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                  添加维护记录
                </Button>
                <Button onClick={fetchMaintenanceData} loading={loading}>
                  刷新数据
                </Button>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card bordered={false} className="glass-card inner-card">
                  <Statistic
                    title="总维护记录"
                    value={maintenanceStatistics.total}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered={false} className="glass-card inner-card">
                  <Statistic
                    title="待处理"
                    value={maintenanceStatistics.pending}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered={false} className="glass-card inner-card">
                  <Statistic
                    title="进行中"
                    value={maintenanceStatistics.inProgress}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<SyncOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered={false} className="glass-card inner-card">
                  <Statistic
                    title="已完成"
                    value={maintenanceStatistics.completed}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} className="glass-card maintenance-tabs">
            <TabPane 
              tab={
                <span>
                  <FileTextOutlined />
                  维护记录
                </span>
              } 
              key="1"
            >
              <Card className="glass-card">
                <Space style={{ marginBottom: 16 }} wrap>
                  <Input
                    placeholder="井盖ID"
                    value={searchParams.manholeId}
                    onChange={e => setSearchParams({ ...searchParams, manholeId: e.target.value })}
                    style={{ width: 120 }}
                    prefix={<SearchOutlined />}
                  />
                  
                  <Select
                    placeholder="维护类型"
                    style={{ width: 150 }}
                    allowClear
                    value={searchParams.type}
                    onChange={value => setSearchParams({ ...searchParams, type: value })}
                  >
                    {Object.values(MaintenanceType).map(type => (
                      <Option key={type} value={type}>{type}</Option>
                    ))}
                  </Select>
                  
                  <Select
                    placeholder="状态"
                    style={{ width: 120 }}
                    allowClear
                    value={searchParams.status}
                    onChange={value => setSearchParams({ ...searchParams, status: value })}
                  >
                    <Option value="pending">待处理</Option>
                    <Option value="inProgress">进行中</Option>
                    <Option value="completed">已完成</Option>
                    <Option value="cancelled">已取消</Option>
                  </Select>
                  
                  <RangePicker 
                    style={{ width: 240 }}
                    onChange={values => setSearchParams({ ...searchParams, dateRange: values as any })}
                  />
                  
                  <Button
                    type="primary"
                    onClick={() => setSearchParams({
                      manholeId: '',
                      type: undefined,
                      status: undefined,
                      dateRange: undefined
                    })}
                  >
                    重置
                  </Button>
                </Space>
                
                <Table
                  columns={columns}
                  dataSource={filteredRecords}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1500 }}
                />
              </Card>
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <BarChartOutlined />
                  维护分析
                </span>
              } 
              key="2"
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card 
                    title="维护类型分布" 
                    className="glass-card"
                  >
                    <ReactECharts option={typeChartOption} style={{ height: 300 }} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card 
                    title="维护状态分布" 
                    className="glass-card"
                  >
                    <ReactECharts option={statusChartOption} style={{ height: 300 }} />
                  </Card>
                </Col>
              </Row>
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <CalendarOutlined />
                  维护日历
                </span>
              } 
              key="3"
            >
              <Card className="glass-card">
                <Alert
                  message={`选中日期: ${currentDate.format('YYYY-MM-DD')}`}
                  description={`${getCalendarData(currentDate).length} 条维护记录`}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Calendar 
                  value={currentDate}
                  onSelect={setCurrentDate}
                  dateCellRender={dateCellRender}
                />
              </Card>
            </TabPane>
          </Tabs>
        </Col>
      </Row>
      
      <Modal
        title="添加维护记录"
        visible={isModalVisible}
        onCancel={handleCancel}
        onOk={handleSubmit}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="manholeId"
            label="井盖ID"
            rules={[{ required: true, message: '请选择井盖ID' }]}
          >
            <Select placeholder="选择井盖">
              {manholes.map(manhole => (
                <Option key={manhole.id} value={manhole.id}>
                  {manhole.id} - {manhole.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="type"
            label="维护类型"
            rules={[{ required: true, message: '请选择维护类型' }]}
          >
            <Select placeholder="选择维护类型">
              {Object.values(MaintenanceType).map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="operatorName"
            label="维护人员"
            rules={[{ required: true, message: '请输入维护人员姓名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="维护人员姓名" />
          </Form.Item>
          
          <Form.Item
            name="contactPhone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="联系电话" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="维护描述"
            rules={[{ required: true, message: '请输入维护描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述维护内容" />
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={2} placeholder="其他备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MaintenanceManagement; 