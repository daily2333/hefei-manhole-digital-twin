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
  DatePicker, 
  Popconfirm, 
  message, 
  Row, 
  Col, 
  Statistic, 
  Divider, 
  Tooltip,
  Tag,
  Progress,
  InputNumber,
  Tabs,
  Spin,
  Empty
} from 'antd';
import { 
  AppstoreOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SyncOutlined, 
  ToolOutlined, 
  SettingOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  StopOutlined,
  EnvironmentOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ManholeInfo, ManholeStatus, ManholeRealTimeData } from '../../typings';
import { formatDateTime, generateUniqueId } from '../../utils';
import { fetchManholes, fetchRealtimeByManhole } from '../../services/api';

// 获取设备状态对应的颜色
const getDeviceStatusColor = (status: ManholeStatus): string => {
  switch (status) {
    case ManholeStatus.Normal:
      return '#52c41a'; // 绿色
    case ManholeStatus.Warning:
      return '#faad14'; // 黄色
    case ManholeStatus.Alarm:
      return '#ff4d4f'; // 红色
    case ManholeStatus.Maintenance:
      return '#1890ff'; // 蓝色
    case ManholeStatus.Offline:
      return '#bfbfbf'; // 灰色
    default:
      return '#bfbfbf';
  }
};

// 设备批量操作类型
enum BatchOperation {
  Upgrade = '批量升级',
  Restart = '批量重启',
  Check = '批量检查',
  Reset = '批量重置',
  Calibrate = '批量校准'
}

/**
 * 设备管理组件
 */
const DeviceManagement: React.FC = () => {
  // 状态定义
  const [devices, setDevices] = useState<ManholeInfo[]>([]);
  const [realTimeDataMap, setRealTimeDataMap] = useState<Map<string, ManholeRealTimeData>>(new Map());

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('添加设备');
  const [editingDevice, setEditingDevice] = useState<ManholeInfo | null>(null);
  const [form] = Form.useForm();
  const [activeTabKey, setActiveTabKey] = useState('1');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  
  // 筛选状态
  const [statusFilter, setStatusFilter] = useState<ManholeStatus | null>(null);
  const [searchText, setSearchText] = useState('');
  
  // 加载API数据
  useEffect(() => {
    setLoading(true);

    const loadDevices = async () => {
      try {
        const devicesData = await fetchManholes();
        setDevices(devicesData);

        const dataMap = new Map<string, ManholeRealTimeData>();
        const realtimeResults = await Promise.all(
          devicesData.map(device => fetchRealtimeByManhole(device.id).catch(() => null))
        );
        devicesData.forEach((device, idx) => {
          const data = realtimeResults[idx];
          if (data) dataMap.set(device.id, data);
        });
        setRealTimeDataMap(dataMap);
      } catch (error) {
        console.error('加载设备数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDevices();
  }, []);
  
  // 定期从API更新实时数据
  useEffect(() => {
    if (devices.length === 0) return;
    
    const intervalId = setInterval(() => {
      Promise.all(
        devices.map(device => fetchRealtimeByManhole(device.id).catch(() => null))
      ).then(results => {
        setRealTimeDataMap(prev => {
          const newMap = new Map(prev);
          devices.forEach((device, idx) => {
            if (results[idx]) newMap.set(device.id, results[idx]!);
          });
          return newMap;
        });
      }).catch(error => {
        console.error('更新实时数据失败:', error);
      });
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [devices]);
  
  // 过滤设备列表
  const filteredDevices = devices.filter(device => {
    // 状态过滤
    if (statusFilter && device.status !== statusFilter) {
      return false;
    }
    
    // 搜索文本过滤
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      return (
        device.id.toLowerCase().includes(searchLower) ||
        device.name.toLowerCase().includes(searchLower) ||
        device.location.address.toLowerCase().includes(searchLower) ||
        device.model.toLowerCase().includes(searchLower) ||
        device.manufacturer.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // 设备状态统计
  const deviceStats = {
    total: devices.length,
    normal: devices.filter(d => d.status === ManholeStatus.Normal).length,
    warning: devices.filter(d => d.status === ManholeStatus.Warning).length,
    alarm: devices.filter(d => d.status === ManholeStatus.Alarm).length,
    offline: devices.filter(d => d.status === ManholeStatus.Offline).length,
    maintenance: devices.filter(d => d.status === ManholeStatus.Maintenance).length
  };
  
  // 显示添加设备模态框
  const showAddModal = () => {
    setEditingDevice(null);
    setModalTitle('添加设备');
    form.resetFields();
    setIsModalVisible(true);
  };
  
  // 显示编辑设备模态框
  const showEditModal = (device: ManholeInfo) => {
    setEditingDevice(device);
    setModalTitle('编辑设备');
    
    // 设置表单初始值
    form.setFieldsValue({
      ...device,
      installationDate: device.installationDate ? dayjs(device.installationDate) : undefined,
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
      // 转换日期对象为字符串
      const formattedValues = {
        ...values,
        installationDate: values.installationDate?.toISOString(),
        batteryReplaceDate: values.batteryReplaceDate?.toISOString()
      };
      
      if (editingDevice) {
        // 更新设备
        const updatedDevices = devices.map(device => 
          device.id === editingDevice.id ? { ...device, ...formattedValues } : device
        );
        setDevices(updatedDevices);
        message.success('设备信息已更新');
      } else {
        // 添加新设备
        const newDevice: ManholeInfo = {
          id: `device-${generateUniqueId()}`,
          ...formattedValues,
          status: ManholeStatus.Normal,
          deviceId: `sensor-${generateUniqueId()}`,
          sensorTypes: ['水位', '气体', '温湿度'],
        };
        setDevices([...devices, newDevice]);
        message.success('设备已添加');
        
        // 为新设备获取实时数据
        fetchRealtimeByManhole(newDevice.id).then(realTimeData => {
          setRealTimeDataMap(prev => {
            const newMap = new Map(prev);
            newMap.set(newDevice.id, realTimeData);
            return newMap;
          });
        }).catch(() => {});
      }
      
      setIsModalVisible(false);
    });
  };
  
  // 删除设备
  const handleDelete = (deviceId: string) => {
    setDevices(devices.filter(device => device.id !== deviceId));
    
    // 同时删除对应的实时数据
    const newDataMap = new Map(realTimeDataMap);
    newDataMap.delete(deviceId);
    setRealTimeDataMap(newDataMap);
    
    message.success('设备已删除');
  };
  
  // 远程重启设备
  const handleRestart = (deviceId: string) => {
    // 模拟重启过程
    message.loading('正在重启设备...', 2.5);
    
    setTimeout(() => {
      message.success('设备已重启');
      
      // 更新设备状态为正常
      const updatedDevices = devices.map(device => 
        device.id === deviceId ? { ...device, status: ManholeStatus.Normal } : device
      );
      setDevices(updatedDevices);
    }, 3000);
  };
  
  // 批量操作处理
  const handleBatchOperation = (operation: BatchOperation) => {
    if (selectedDevices.length === 0) {
      message.warning('请选择要操作的设备');
      return;
    }
    
    // 显示不同操作的确认信息
    Modal.confirm({
      title: `确认${operation}`,
      content: `确定要对选中的 ${selectedDevices.length} 台设备执行${operation}操作吗？`,
      onOk: () => {
        message.loading(`正在执行${operation}...`, 2.5);
        
        setTimeout(() => {
          message.success(`${operation}成功完成`);
          
          // 如果是重启操作，将设备状态改为正常
          if (operation === BatchOperation.Restart) {
            const updatedDevices = devices.map(device => 
              selectedDevices.includes(device.id) ? { ...device, status: ManholeStatus.Normal } : device
            );
            setDevices(updatedDevices);
          }
          
          // 清除选择
          setSelectedDevices([]);
        }, 3000);
      }
    });
  };
  
  // 将设备加入维护模式
  const toggleMaintenanceMode = (deviceId: string, enterMaintenance: boolean) => {
    const updatedDevices = devices.map(device => {
      if (device.id === deviceId) {
        return {
          ...device,
          status: enterMaintenance ? ManholeStatus.Maintenance : ManholeStatus.Normal
        };
      }
      return device;
    });
    
    setDevices(updatedDevices);
    message.success(enterMaintenance ? '设备已进入维护模式' : '设备已退出维护模式');
  };
  
  // 渲染设备状态标签
  const renderStatusTag = (status: ManholeStatus) => {
    switch (status) {
      case ManholeStatus.Normal:
        return <Tag icon={<CheckCircleOutlined />} color="success">正常</Tag>;
      case ManholeStatus.Warning:
        return <Tag icon={<WarningOutlined />} color="warning">警告</Tag>;
      case ManholeStatus.Alarm:
        return <Tag icon={<WarningOutlined />} color="error">告警</Tag>;
      case ManholeStatus.Offline:
        return <Tag icon={<StopOutlined />} color="default">离线</Tag>;
      case ManholeStatus.Maintenance:
        return <Tag icon={<ToolOutlined />} color="processing">维护中</Tag>;
      default:
        return <Tag color="default">未知</Tag>;
    }
  };
  
  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys: selectedDevices,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedDevices(selectedRowKeys as string[]);
    }
  };
  
  // 设备列表列定义
  const deviceColumns = [
    {
      title: '设备ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ManholeStatus) => renderStatusTag(status),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 200,
      render: (location: any) => (
        <div>
          <div>{location.address}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {location.district}, {location.city}
          </div>
        </div>
      ),
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 120,
    },
    {
      title: '生产商',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 150,
    },
    {
      title: '安装日期',
      dataIndex: 'installationDate',
      key: 'installationDate',
      width: 120,
      render: (date: string) => formatDateTime(date, 'date'),
    },
    {
      title: '传感器',
      dataIndex: 'sensorTypes',
      key: 'sensorTypes',
      width: 200,
      render: (sensorTypes: string[]) => (
        <div>
          {sensorTypes.map(type => (
            <Tag key={type}>{type}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: '电池状态',
      key: 'batteryStatus',
      width: 120,
      render: (_: any, record: ManholeInfo) => {
        const batteryLevel = realTimeDataMap.get(record.id)?.batteryLevel || 0;
        return (
          <div>
            <Progress 
              percent={batteryLevel} 
              size="small" 
              status={batteryLevel < 20 ? 'exception' : undefined}
              style={{ width: 80 }}
            />
          </div>
        );
      },
    },
    {
      title: '信号强度',
      key: 'signalStrength',
      width: 120,
      render: (_: any, record: ManholeInfo) => {
        const signal = realTimeDataMap.get(record.id)?.signalStrength || -100;
        const signalPercent = Math.max(0, Math.min(100, (signal + 100) * 1.25));
        
        return (
          <div>
            <Progress 
              percent={signalPercent} 
              size="small" 
              status={signalPercent < 20 ? 'exception' : undefined}
              style={{ width: 80 }}
            />
          </div>
        );
      },
    },
    {
      title: '上次维护',
      dataIndex: 'lastMaintenanceTime',
      key: 'lastMaintenanceTime',
      width: 120,
      render: (date: string) => date ? formatDateTime(date, 'date') : '无记录',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: ManholeInfo) => (
        <Space size="small">
          <Tooltip title="编辑设备">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => showEditModal(record)} 
            />
          </Tooltip>
          
          <Tooltip title="重启设备">
            <Button 
              type="text" 
              icon={<SyncOutlined />} 
              onClick={() => handleRestart(record.id)}
              disabled={record.status === ManholeStatus.Offline}
            />
          </Tooltip>
          
          <Tooltip title={record.status === ManholeStatus.Maintenance ? "退出维护模式" : "进入维护模式"}>
            <Button 
              type="text" 
              icon={<ToolOutlined />}
              style={{ color: record.status === ManholeStatus.Maintenance ? '#1890ff' : undefined }}
              onClick={() => toggleMaintenanceMode(
                record.id, 
                record.status !== ManholeStatus.Maintenance
              )}
              disabled={record.status === ManholeStatus.Offline}
            />
          </Tooltip>
          
          <Tooltip title="删除设备">
            <Popconfirm
              title="确定要删除此设备吗？"
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
  
  // 设备详情列表
  const renderDeviceDetails = (device: ManholeInfo) => {
    const realTimeData = realTimeDataMap.get(device.id);
    
    // 如果没有实时数据，显示加载中
    if (!realTimeData) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
          <div>加载数据中...</div>
        </div>
      );
    }
    
    return (
      <Card title="设备详细信息">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Statistic 
              title="设备ID" 
              value={device.id} 
              groupSeparator=""
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="设备名称" 
              value={device.name} 
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="状态" 
              value={device.status} 
              valueStyle={{ color: getDeviceStatusColor(device.status) }}
            />
          </Col>
          
          <Col span={8}>
            <Statistic 
              title="型号" 
              value={device.model} 
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="生产商" 
              value={device.manufacturer} 
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="安装日期" 
              value={formatDateTime(device.installationDate, 'date')} 
            />
          </Col>
          
          <Col span={24}>
            <Divider orientation="left">实时数据</Divider>
          </Col>
          
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="水位" 
                value={realTimeData.waterLevel} 
                suffix="mm"
                precision={1}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="温度" 
                value={realTimeData.temperature} 
                suffix="°C"
                precision={1}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="湿度" 
                value={realTimeData.humidity} 
                suffix="%"
                precision={1}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="电池电量" 
                value={realTimeData.batteryLevel} 
                suffix="%"
                valueStyle={{ 
                  color: realTimeData.batteryLevel < 20 ? '#ff4d4f' :
                          realTimeData.batteryLevel < 50 ? '#faad14' : '#52c41a'
                }}
              />
            </Card>
          </Col>
          
          <Col span={8}>
            <Card size="small" title="气体浓度">
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Statistic 
                    title="CH4" 
                    value={realTimeData.gasConcentration.ch4} 
                    suffix="ppm"
                    precision={1}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="CO" 
                    value={realTimeData.gasConcentration.co} 
                    suffix="ppm"
                    precision={1}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="H2S" 
                    value={realTimeData.gasConcentration.h2s} 
                    suffix="ppm"
                    precision={1}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="O2" 
                    value={realTimeData.gasConcentration.o2} 
                    suffix="%"
                    precision={1}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card size="small" title="加速度计">
              <Row gutter={[8, 8]}>
                <Col span={8}>
                  <Statistic 
                    title="X" 
                    value={realTimeData.accelerometer.x} 
                    precision={2}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="Y" 
                    value={realTimeData.accelerometer.y} 
                    precision={2}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="Z" 
                    value={realTimeData.accelerometer.z} 
                    precision={2}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card size="small" title="倾斜角度">
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Statistic 
                    title="俯仰角" 
                    value={realTimeData.tilt.pitch} 
                    suffix="°"
                    precision={1}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="滚转角" 
                    value={realTimeData.tilt.roll} 
                    suffix="°"
                    precision={1}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
          
          <Col span={24}>
            <Divider orientation="left">位置信息</Divider>
          </Col>
          
          <Col span={24}>
            <Card size="small">
              <p><EnvironmentOutlined /> {device.location.address}</p>
              <p>
                {device.location.district}, {device.location.city}, {device.location.province}
              </p>
              <p>
                坐标: {device.location.latitude.toFixed(6)}, {device.location.longitude.toFixed(6)}
              </p>
            </Card>
          </Col>
        </Row>
      </Card>
    );
  };
  
  return (
    <Card 
      title={
        <Space>
          <AppstoreOutlined />
          <span>设备管理</span>
        </Space>
      }
      extra={
        <Space>
          <Input.Search
            placeholder="搜索设备..."
            allowClear
            onSearch={setSearchText}
            style={{ width: 250 }}
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showAddModal}
          >
            添加设备
          </Button>
        </Space>
      }
      style={{ width: '100%' }}
    >
      <Tabs 
        activeKey={activeTabKey} 
        onChange={setActiveTabKey}
        items={[
          {
            key: '1',
            label: (
              <span>
                <AppstoreOutlined />
                设备列表
              </span>
            ),
            children: (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic 
                        title="总设备数" 
                        value={deviceStats.total} 
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic 
                        title="正常" 
                        value={deviceStats.normal} 
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic 
                        title="警告" 
                        value={deviceStats.warning} 
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Card>
                  </Col>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic 
                        title="告警" 
                        value={deviceStats.alarm} 
                        valueStyle={{ color: '#ff4d4f' }}
                      />
                    </Card>
                  </Col>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic 
                        title="离线" 
                        value={deviceStats.offline} 
                        valueStyle={{ color: '#bfbfbf' }}
                      />
                    </Card>
                  </Col>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic 
                        title="维护中" 
                        value={deviceStats.maintenance} 
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                </Row>
                
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={24}>
                    <Space>
                      <span>状态筛选:</span>
                      <Select
                        placeholder="选择状态"
                        style={{ width: 150 }}
                        allowClear
                        value={statusFilter || undefined}
                        onChange={(value) => setStatusFilter(value)}
                      >
                        {Object.values(ManholeStatus).map(status => (
                          <Select.Option key={status} value={status}>{status}</Select.Option>
                        ))}
                      </Select>
                      
                      <span style={{ marginLeft: 16 }}>批量操作:</span>
                      <Button 
                        onClick={() => handleBatchOperation(BatchOperation.Restart)}
                        disabled={selectedDevices.length === 0}
                      >
                        批量重启
                      </Button>
                      <Button 
                        onClick={() => handleBatchOperation(BatchOperation.Upgrade)}
                        disabled={selectedDevices.length === 0}
                      >
                        批量升级
                      </Button>
                      <Button 
                        onClick={() => handleBatchOperation(BatchOperation.Calibrate)}
                        disabled={selectedDevices.length === 0}
                      >
                        批量校准
                      </Button>
                    </Space>
                  </Col>
                </Row>
                
                <Table
                  columns={deviceColumns}
                  dataSource={filteredDevices}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条记录`
                  }}
                  rowSelection={rowSelection}
                  scroll={{ x: 1500 }}
                  expandable={{
                    expandedRowRender: (record) => renderDeviceDetails(record),
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
                设备日志
              </span>
            ),
            children: (
              <Empty description="设备日志功能正在开发中" />
            )
          },
          {
            key: '3',
            label: (
              <span>
                <SettingOutlined />
                批量配置
              </span>
            ),
            children: (
              <Empty description="批量配置功能正在开发中" />
            )
          }
        ]}
      />
      
      {/* 添加/编辑设备模态框 */}
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
                name="name"
                label="设备名称"
                rules={[{ required: true, message: '请输入设备名称' }]}
              >
                <Input placeholder="设备名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="model"
                label="设备型号"
                rules={[{ required: true, message: '请输入设备型号' }]}
              >
                <Input placeholder="设备型号" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="manufacturer"
                label="生产商"
                rules={[{ required: true, message: '请输入生产商' }]}
              >
                <Input placeholder="生产商" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="installationDate"
                label="安装日期"
                rules={[{ required: true, message: '请选择安装日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="material"
                label="材质"
                rules={[{ required: true, message: '请输入材质' }]}
              >
                <Input placeholder="材质" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="diameter"
                label="直径(mm)"
                rules={[{ required: true, message: '请输入直径' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} precision={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="depth"
                label="深度(mm)"
                rules={[{ required: true, message: '请输入深度' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} precision={0} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="manager"
                label="管理员"
                rules={[{ required: true, message: '请输入管理员姓名' }]}
              >
                <Input placeholder="管理员姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contactPhone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="联系电话" />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider>位置信息</Divider>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name={['location', 'address']}
                label="详细地址"
                rules={[{ required: true, message: '请输入详细地址' }]}
              >
                <Input placeholder="详细地址" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name={['location', 'district']}
                label="区县"
                rules={[{ required: true, message: '请输入区县' }]}
              >
                <Input placeholder="区县" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={['location', 'city']}
                label="城市"
                rules={[{ required: true, message: '请输入城市' }]}
              >
                <Input placeholder="城市" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={['location', 'province']}
                label="省份"
                rules={[{ required: true, message: '请输入省份' }]}
              >
                <Input placeholder="省份" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['location', 'latitude']}
                label="纬度"
                rules={[{ required: true, message: '请输入纬度' }]}
              >
                <InputNumber style={{ width: '100%' }} precision={6} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['location', 'longitude']}
                label="经度"
                rules={[{ required: true, message: '请输入经度' }]}
              >
                <InputNumber style={{ width: '100%' }} precision={6} />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider>备注信息</Divider>
          
          <Form.Item
            name="notes"
            label="备注"
          >
            <Input.TextArea rows={4} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default DeviceManagement; 