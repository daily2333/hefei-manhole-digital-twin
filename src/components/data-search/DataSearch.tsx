import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Button, 
  DatePicker, 
  Select, 
  Table, 
  Tag, 
  Space, 
  Row,
  Col,
  Tabs,
  Badge,
  message,
  Typography,
  Breadcrumb
} from 'antd';
import { 
  SearchOutlined, 
  HistoryOutlined, 
  ReloadOutlined,
  SaveOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ManholeInfo, ManholeStatus, ManholeRealTimeData, CoverStatus } from '../../typings';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// 模拟数据查询API响应
interface QueryResult {
  timestamp: string;
  manholeId: string;
  manholeName: string;
  status: ManholeStatus;
  parameter: string;
  value: number;
  unit: string;
}

interface DataSearchProps {
  manholes?: ManholeInfo[];
  realTimeDataMap?: Map<string, ManholeRealTimeData>;
}

const DataSearch: React.FC<DataSearchProps> = ({ manholes = [], realTimeDataMap = new Map() }) => {
  const [form] = Form.useForm();
  const [historyForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('realTime');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [historyCount, setHistoryCount] = useState<number>(0);

  // 初始化时加载历史记录
  useEffect(() => {
    // 模拟从本地存储加载历史记录
    const mockHistory = [
      { id: 1, name: '水位异常查询', timestamp: '2024-07-01 15:30:21', criteria: '水位 > 80%, 2024-06-30 至 2024-07-01' },
      { id: 2, name: '气体浓度查询', timestamp: '2024-06-28 09:15:43', criteria: 'CH4 > 5%, 2024-06-01 至 2024-06-28' },
      { id: 3, name: '离线设备查询', timestamp: '2024-06-25 11:22:37', criteria: '状态 = 离线, 2024-06-20 至 2024-06-25' },
    ];
    
    setSearchHistory(mockHistory);
    setHistoryCount(mockHistory.length);
    
    const mockSavedSearches = [
      { id: 1, name: '每日水位监测', criteria: '水位 > 50%, 过去24小时', schedule: '每日' },
      { id: 2, name: '气体浓度异常监测', criteria: 'CH4 > 3% 或 H2S > 10ppm', schedule: '每小时' },
    ];
    setSavedSearches(mockSavedSearches);
  }, []);

  // 实时数据查询
  const handleRealTimeSearch = (values: any) => {
    setLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      const mockResults: QueryResult[] = [];
      
      // 从表单值生成模拟结果
      manholes.forEach(manhole => {
        const realTimeData = realTimeDataMap.get(manhole.id);
        if (realTimeData && matchesSearchCriteria(manhole, realTimeData, values)) {
          // 添加温度数据
          mockResults.push({
            timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            manholeId: manhole.id,
            manholeName: manhole.name,
            status: manhole.status,
            parameter: '温度',
            value: realTimeData.temperature,
            unit: '°C'
          });
          
          // 添加湿度数据
          mockResults.push({
            timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            manholeId: manhole.id,
            manholeName: manhole.name,
            status: manhole.status,
            parameter: '湿度',
            value: realTimeData.humidity,
            unit: '%'
          });
          
          // 添加水位数据
          mockResults.push({
            timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            manholeId: manhole.id,
            manholeName: manhole.name,
            status: manhole.status,
            parameter: '水位',
            value: realTimeData.waterLevel,
            unit: '%'
          });
        }
      });
      
      setResults(mockResults);
      setLoading(false);
      
      // 添加到历史记录
      if (mockResults.length > 0) {
        const newHistory = {
          id: historyCount + 1,
          name: `查询 ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
          timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          criteria: generateCriteriaString(values)
        };
        
        setSearchHistory([newHistory, ...searchHistory]);
        setHistoryCount(prev => prev + 1);
      }
      
      message.success(`查询完成，共找到 ${mockResults.length} 条记录`);
    }, 1000);
  };

  // 判断是否符合搜索条件
  const matchesSearchCriteria = (manhole: ManholeInfo, data: ManholeRealTimeData, criteria: any) => {
    // 检查井盖ID
    if (criteria.manholeId && manhole.id !== criteria.manholeId) {
      return false;
    }
    
    // 检查井盖状态
    if (criteria.status && manhole.status !== criteria.status) {
      return false;
    }
    
    // 检查温度范围
    if (criteria.temperatureRange) {
      const [minTemp, maxTemp] = criteria.temperatureRange;
      if (data.temperature < minTemp || data.temperature > maxTemp) {
        return false;
      }
    }
    
    // 检查湿度范围
    if (criteria.humidityRange) {
      const [minHumidity, maxHumidity] = criteria.humidityRange;
      if (data.humidity < minHumidity || data.humidity > maxHumidity) {
        return false;
      }
    }
    
    // 检查水位范围
    if (criteria.waterLevelRange) {
      const [minWaterLevel, maxWaterLevel] = criteria.waterLevelRange;
      if (data.waterLevel < minWaterLevel || data.waterLevel > maxWaterLevel) {
        return false;
      }
    }
    
    return true;
  };

  // 生成查询条件描述字符串
  const generateCriteriaString = (values: any) => {
    const parts = [];
    
    if (values.manholeId) {
      parts.push(`井盖ID: ${values.manholeId}`);
    }
    
    if (values.status) {
      parts.push(`状态: ${values.status}`);
    }
    
    if (values.temperatureRange) {
      parts.push(`温度: ${values.temperatureRange[0]}°C - ${values.temperatureRange[1]}°C`);
    }
    
    if (values.humidityRange) {
      parts.push(`湿度: ${values.humidityRange[0]}% - ${values.humidityRange[1]}%`);
    }
    
    if (values.waterLevelRange) {
      parts.push(`水位: ${values.waterLevelRange[0]}% - ${values.waterLevelRange[1]}%`);
    }
    
    return parts.join(', ');
  };

  // 导出数据
  const handleExport = (format: 'excel' | 'pdf') => {
    message.success(`数据已导出为${format === 'excel' ? 'Excel' : 'PDF'}格式`);
  };

  // 渲染查询结果状态标签
  const renderStatusTag = (status: ManholeStatus) => {
    switch (status) {
      case ManholeStatus.Normal:
        return <Tag color="success">正常</Tag>;
      case ManholeStatus.Warning:
        return <Tag color="warning">警告</Tag>;
      case ManholeStatus.Alarm:
        return <Tag color="error">告警</Tag>;
      case ManholeStatus.Offline:
        return <Tag color="default">离线</Tag>;
      case ManholeStatus.Maintenance:
        return <Tag color="processing">维护中</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  // 历史数据查询
  const handleHistorySearch = (values: any) => {
    setLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      // 生成模拟历史数据结果
      const startDate = values.dateRange[0].startOf('day');
      const endDate = values.dateRange[1].endOf('day');
      const daysDiff = endDate.diff(startDate, 'days');
      
      const mockHistoryResults: QueryResult[] = [];
      
      // 为每一天生成数据
      for (let i = 0; i <= daysDiff; i++) {
        const currentDate = dayjs(startDate).add(i, 'day');
        
        // 每天生成几个时间点的数据
        for (let hour = 0; hour < 24; hour += 4) {
          const timestamp = dayjs(currentDate).add(hour, 'hours');
          
          // 只为选中的井盖生成数据
          if (values.manholeId) {
            const manhole = manholes.find(m => m.id === values.manholeId);
            if (manhole) {
              // 添加温度数据
              mockHistoryResults.push({
                timestamp: timestamp.format('YYYY-MM-DD HH:mm:ss'),
                manholeId: manhole.id,
                manholeName: manhole.name,
                status: randomStatus(),
                parameter: '温度',
                value: 20 + Math.random() * 10,
                unit: '°C'
              });
              
              // 添加湿度数据
              mockHistoryResults.push({
                timestamp: timestamp.format('YYYY-MM-DD HH:mm:ss'),
                manholeId: manhole.id,
                manholeName: manhole.name,
                status: randomStatus(),
                parameter: '湿度',
                value: 50 + Math.random() * 30,
                unit: '%'
              });
            }
          }
        }
      }
      
      setResults(mockHistoryResults);
      setLoading(false);
      message.success(`历史查询完成，共找到 ${mockHistoryResults.length} 条记录`);
    }, 1500);
  };

  // 随机状态生成辅助函数
  const randomStatus = (): ManholeStatus => {
    const statuses = [
      ManholeStatus.Normal,
      ManholeStatus.Warning,
      ManholeStatus.Alarm,
      ManholeStatus.Offline,
      ManholeStatus.Maintenance
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  // 保存当前搜索
  const saveCurrentSearch = () => {
    const values = form.getFieldsValue();
    const searchName = prompt('请输入搜索名称：');
    
    if (searchName) {
      const newSavedSearch = {
        id: savedSearches.length + 1,
        name: searchName,
        criteria: generateCriteriaString(values),
        schedule: '手动'
      };
      
      setSavedSearches([...savedSearches, newSavedSearch]);
      message.success('搜索条件已保存');
    }
  };

  // 删除已保存的搜索
  const deleteSavedSearch = (id: number) => {
    setSavedSearches(savedSearches.filter(search => search.id !== id));
    message.success('已删除保存的搜索');
  };

  // 表格列定义
  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      sorter: (a: QueryResult, b: QueryResult) => a.timestamp.localeCompare(b.timestamp),
    },
    {
      title: '井盖ID',
      dataIndex: 'manholeId',
      key: 'manholeId',
      width: 100,
    },
    {
      title: '井盖名称',
      dataIndex: 'manholeName',
      key: 'manholeName',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ManholeStatus) => renderStatusTag(status),
    },
    {
      title: '参数',
      dataIndex: 'parameter',
      key: 'parameter',
      width: 100,
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      width: 100,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
  ];

  return (
    <div className="data-search-container" style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Breadcrumb>
          <Breadcrumb.Item>智慧井盖</Breadcrumb.Item>
          <Breadcrumb.Item>数据查询</Breadcrumb.Item>
        </Breadcrumb>
      </div>
      
      <Title level={4}>数据查询</Title>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        tabBarExtraContent={
          <Space>
            <Button 
              icon={<FileExcelOutlined />} 
              onClick={() => handleExport('excel')}
              disabled={results.length === 0}
            >
              导出Excel
            </Button>
            <Button 
              icon={<FilePdfOutlined />} 
              onClick={() => handleExport('pdf')}
              disabled={results.length === 0}
            >
              导出PDF
            </Button>
          </Space>
        }
        items={[
          {
            label: '实时数据查询',
            key: 'realTime',
            children: <Card style={{ marginBottom: '16px' }}>
            <Form 
              form={form}
              layout="vertical" 
              onFinish={handleRealTimeSearch}
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="井盖ID" name="manholeId">
                    <Select
                      allowClear
                      placeholder="选择井盖ID"
                      showSearch
                      optionFilterProp="children"
                    >
                      {manholes.map(manhole => (
                        <Option key={manhole.id} value={manhole.id}>
                          {manhole.id} - {manhole.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="井盖状态" name="status">
                    <Select allowClear placeholder="选择状态">
                      {Object.values(ManholeStatus).map(status => (
                        <Option key={status} value={status}>
                          {status}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="温度范围 (°C)" name="temperatureRange">
                    <Select
                      allowClear
                      placeholder="选择温度范围"
                      options={[
                        { value: [0, 20], label: '0-20°C' },
                        { value: [20, 30], label: '20-30°C' },
                        { value: [30, 40], label: '30-40°C' },
                        { value: [40, 100], label: '40°C以上' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="湿度范围 (%)" name="humidityRange">
                    <Select
                      allowClear
                      placeholder="选择湿度范围"
                      options={[
                        { value: [0, 30], label: '0-30%' },
                        { value: [30, 60], label: '30-60%' },
                        { value: [60, 80], label: '60-80%' },
                        { value: [80, 100], label: '80-100%' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="水位范围 (%)" name="waterLevelRange">
                    <Select
                      allowClear
                      placeholder="选择水位范围"
                      options={[
                        { value: [0, 20], label: '0-20%' },
                        { value: [20, 50], label: '20-50%' },
                        { value: [50, 80], label: '50-80%' },
                        { value: [80, 100], label: '80-100%' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="井盖状态" name="coverStatus">
                    <Select allowClear placeholder="选择井盖状态">
                      {Object.values(CoverStatus).map(status => (
                        <Option key={status} value={status}>
                          {status}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item style={{ textAlign: 'right', marginTop: '30px' }}>
                    <Space>
                      <Button 
                        type="primary" 
                        icon={<SearchOutlined />} 
                        htmlType="submit"
                        loading={loading}
                      >
                        查询
                      </Button>
                      <Button 
                        icon={<SaveOutlined />} 
                        onClick={saveCurrentSearch}
                      >
                        保存查询
                      </Button>
                      <Button 
                        icon={<ReloadOutlined />} 
                        onClick={() => form.resetFields()}
                      >
                        重置
                      </Button>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
          },
          {
            label: '历史数据查询',
            key: 'history',
            children: <Card style={{ marginBottom: '16px' }}>
            <Form 
              form={historyForm}
              layout="vertical" 
              onFinish={handleHistorySearch}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item 
                    label="日期范围" 
                    name="dateRange" 
                    rules={[{ required: true, message: '请选择查询日期范围' }]}
                  >
                    <RangePicker 
                      style={{ width: '100%' }}
                      ranges={{
                        '今天': [dayjs().startOf('day'), dayjs().endOf('day')],
                        '昨天': [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')],
                        '本周': [dayjs().startOf('week'), dayjs().endOf('week')],
                        '本月': [dayjs().startOf('month'), dayjs().endOf('month')],
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item 
                    label="井盖ID" 
                    name="manholeId"
                    rules={[{ required: true, message: '请选择井盖ID' }]}
                  >
                    <Select
                      placeholder="选择井盖ID"
                      showSearch
                      optionFilterProp="children"
                    >
                      {manholes.map(manhole => (
                        <Option key={manhole.id} value={manhole.id}>
                          {manhole.id} - {manhole.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="数据类型" name="dataType">
                    <Select
                      mode="multiple"
                      allowClear
                      placeholder="选择数据类型"
                      defaultValue={['temperature', 'humidity', 'waterLevel']}
                      options={[
                        { value: 'temperature', label: '温度' },
                        { value: 'humidity', label: '湿度' },
                        { value: 'waterLevel', label: '水位' },
                        { value: 'gasConcentration', label: '气体浓度' },
                        { value: 'batteryLevel', label: '电池电量' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row>
                <Col span={24}>
                  <Form.Item style={{ textAlign: 'right' }}>
                    <Space>
                      <Button 
                        type="primary" 
                        icon={<SearchOutlined />} 
                        htmlType="submit"
                        loading={loading}
                      >
                        查询历史数据
                      </Button>
                      <Button 
                        icon={<ReloadOutlined />} 
                        onClick={() => historyForm.resetFields()}
                      >
                        重置
                      </Button>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
          },
          {
            label: <span>
              <HistoryOutlined />
              搜索历史
              <Badge count={searchHistory.length} offset={[5, -5]} size="small" />
            </span>,
            key: 'searchHistory',
            children: <Card>
            <Table
              dataSource={searchHistory}
              rowKey="id"
              columns={[
                {
                  title: '查询名称',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: '查询时间',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                },
                {
                  title: '查询条件',
                  dataIndex: 'criteria',
                  key: 'criteria',
                },
                {
                  title: '操作',
                  key: 'action',
                  render: (_, record) => (
                    <Space size="middle">
                      <Button type="link" size="small" icon={<SearchOutlined />}>
                        重新查询
                      </Button>
                      <Button type="link" size="small" icon={<SaveOutlined />}>
                        保存
                      </Button>
                    </Space>
                  ),
                },
              ]}
              pagination={{ pageSize: 5 }}
            />
          </Card>
          },
          {
            label: <span>
              <SaveOutlined />
              已保存查询
              <Badge count={savedSearches.length} offset={[5, -5]} size="small" />
            </span>,
            key: 'savedSearches',
            children: <Card>
            <Table
              dataSource={savedSearches}
              rowKey="id"
              columns={[
                {
                  title: '查询名称',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: '查询条件',
                  dataIndex: 'criteria',
                  key: 'criteria',
                },
                {
                  title: '执行频率',
                  dataIndex: 'schedule',
                  key: 'schedule',
                  render: (schedule) => (
                    <Tag color={schedule === '手动' ? 'default' : 'blue'}>
                      {schedule}
                    </Tag>
                  )
                },
                {
                  title: '操作',
                  key: 'action',
                  render: (_, record) => (
                    <Space size="middle">
                      <Button type="link" size="small" icon={<SearchOutlined />}>
                        执行
                      </Button>
                      <Button type="link" size="small" icon={<DeleteOutlined />} danger
                        onClick={() => deleteSavedSearch(record.id)}
                      >
                        删除
                      </Button>
                    </Space>
                  ),
                },
              ]}
              pagination={{ pageSize: 5 }}
            />
          </Card>
          },
        ]}
      />
      
      <Card title="查询结果" extra={<Text type="secondary">共 {results.length} 条记录</Text>}>
        <Table
          dataSource={results}
          columns={columns}
          rowKey={(record) => `${record.manholeId}-${record.parameter}-${record.timestamp}`}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ y: 400 }}
        />
      </Card>
    </div>
  );
};

export default DataSearch; 