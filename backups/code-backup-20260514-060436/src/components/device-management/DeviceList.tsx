import React, { useState } from 'react';
import { Table, Tag, Button, Space, Input, Select, Card, Tooltip, Badge, Modal, Form, InputNumber } from 'antd';
import { SearchOutlined, EditOutlined, InfoCircleOutlined, ToolOutlined } from '@ant-design/icons';
import { ManholeInfo, ManholeStatus, MaintenanceRecord, MaintenanceType } from '../../typings';
import { formatDateTime, getDeviceStatusColor } from '../../utils';

const { Option } = Select;

interface DeviceListProps {
  devices: ManholeInfo[];
  maintenanceRecords: MaintenanceRecord[];
  onSelectDevice?: (deviceId: string) => void;
  onAddMaintenance?: (record: Omit<MaintenanceRecord, 'id'>) => void;
}

/**
 * 设备列表组件
 */
const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  maintenanceRecords,
  onSelectDevice,
  onAddMaintenance
}) => {
  // 筛选状态
  const [filters, setFilters] = useState({
    deviceId: '',
    status: undefined as ManholeStatus | undefined,
    model: '',
    material: ''
  });
  
  // 维护记录表单
  const [maintenanceForm] = Form.useForm();
  
  // 维护记录弹窗状态
  const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // 打开维护记录弹窗
  const showMaintenanceModal = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setMaintenanceModalVisible(true);
    maintenanceForm.resetFields();
    maintenanceForm.setFieldsValue({
      manholeId: deviceId,
      timestamp: new Date().toISOString(),
      operator: '当前用户'
    });
  };

  // 提交维护记录
  const handleMaintenanceSubmit = () => {
    maintenanceForm.validateFields().then(values => {
      if (onAddMaintenance) {
        onAddMaintenance({
          manholeId: values.manholeId,
          time: values.timestamp,
          type: values.type,
          description: values.description,
          operatorName: values.operator,
          contactPhone: '未填写',
          status: 'pending',
          notes: values.result,
          completionTime: values.nextMaintenanceTime
        });
      }
      setMaintenanceModalVisible(false);
    });
  };

  // 获取设备状态标签
  const renderStatusTag = (status: ManholeStatus) => {
    const color = getDeviceStatusColor(status);
    let text = '';
    
    switch (status) {
      case ManholeStatus.Normal:
        text = '正常';
        break;
      case ManholeStatus.Warning:
        text = '警告';
        break;
      case ManholeStatus.Alarm:
        text = '报警';
        break;
      case ManholeStatus.Maintenance:
        text = '维护中';
        break;
      case ManholeStatus.Offline:
        text = '离线';
        break;
      default:
        text = '未知';
        break;
    }
    
    return <Tag color={color}>{text}</Tag>;
  };

  // 应用筛选条件
  const applyFilters = (devices: ManholeInfo[]) => {
    return devices.filter(device => {
      // 筛选设备ID或名称
      if (filters.deviceId && 
          !device.id.includes(filters.deviceId) && 
          !device.name.includes(filters.deviceId)) {
        return false;
      }
      
      // 筛选状态
      if (filters.status && device.status !== filters.status) {
        return false;
      }
      
      // 筛选型号
      if (filters.model && !device.model.includes(filters.model)) {
        return false;
      }
      
      // 筛选材料
      if (filters.material && !device.material.includes(filters.material)) {
        return false;
      }
      
      return true;
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '井盖ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <Button type="link" onClick={() => onSelectDevice && onSelectDevice(id)}>
          {id}
        </Button>
      )
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '位置',
      dataIndex: ['location', 'address'],
      key: 'address',
      width: 200,
      ellipsis: {
        showTitle: false
      },
      render: (address: string) => (
        <Tooltip placement="topLeft" title={address}>
          {address}
        </Tooltip>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ManholeStatus) => renderStatusTag(status)
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 120
    },
    {
      title: '材料',
      dataIndex: 'material',
      key: 'material',
      width: 100
    },
    {
      title: '安装时间',
      dataIndex: 'installTime',
      key: 'installTime',
      width: 120,
      render: (time: string) => formatDateTime(time, 'date')
    },
    {
      title: '最后维护',
      dataIndex: 'lastMaintenanceTime',
      key: 'lastMaintenanceTime',
      width: 120,
      render: (time?: string) => time ? formatDateTime(time, 'date') : '-'
    },
    {
      title: '维护记录',
      key: 'maintenanceCount',
      width: 100,
      render: (text: string, record: ManholeInfo) => {
        const count = maintenanceRecords.filter(r => r.manholeId === record.id).length;
        return (
          <Badge count={count} color={count > 0 ? '#52c41a' : '#d9d9d9'} />
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (text: string, record: ManholeInfo) => (
        <Space size="small">
          <Button
            size="small"
            type="primary"
            icon={<InfoCircleOutlined />}
            onClick={() => onSelectDevice && onSelectDevice(record.id)}
          >
            详情
          </Button>
          <Button
            size="small"
            icon={<ToolOutlined />}
            onClick={() => showMaintenanceModal(record.id)}
          >
            维护
          </Button>
        </Space>
      )
    }
  ];

  // 筛选过的设备数据
  const filteredDevices = applyFilters(devices);

  // 获取设备型号和材料的唯一值，用于下拉选择
  const deviceModels = Array.from(new Set(devices.map(d => d.model)));
  const deviceMaterials = Array.from(new Set(devices.map(d => d.material)));

  return (
    <Card 
      title={
        <Space>
          <EditOutlined />
          <span>设备管理</span>
          <Tag color="#108ee9">{filteredDevices.length}</Tag>
        </Space>
      }
      style={{ width: '100%' }}
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="输入井盖ID或名称"
          value={filters.deviceId}
          onChange={e => setFilters({ ...filters, deviceId: e.target.value })}
          style={{ width: 180 }}
          prefix={<SearchOutlined />}
        />
        
        <Select
          placeholder="设备状态"
          style={{ width: 130 }}
          allowClear
          value={filters.status}
          onChange={value => setFilters({ ...filters, status: value })}
        >
          <Option value={ManholeStatus.Normal}>正常</Option>
          <Option value={ManholeStatus.Warning}>警告</Option>
          <Option value={ManholeStatus.Alarm}>报警</Option>
          <Option value={ManholeStatus.Maintenance}>维护中</Option>
          <Option value={ManholeStatus.Offline}>离线</Option>
        </Select>
        
        <Select
          placeholder="设备型号"
          style={{ width: 150 }}
          allowClear
          value={filters.model}
          onChange={value => setFilters({ ...filters, model: value })}
        >
          {deviceModels.map(model => (
            <Option key={model} value={model}>{model}</Option>
          ))}
        </Select>
        
        <Select
          placeholder="设备材料"
          style={{ width: 150 }}
          allowClear
          value={filters.material}
          onChange={value => setFilters({ ...filters, material: value })}
        >
          {deviceMaterials.map(material => (
            <Option key={material} value={material}>{material}</Option>
          ))}
        </Select>
        
        <Button
          type="primary"
          onClick={() => setFilters({
            deviceId: '',
            status: undefined,
            model: '',
            material: ''
          })}
        >
          重置
        </Button>
      </Space>
      
      <Table
        columns={columns}
        dataSource={filteredDevices}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1100 }}
      />
      
      {/* 维护记录表单弹窗 */}
      <Modal
        title="添加维护记录"
        open={maintenanceModalVisible}
        onOk={handleMaintenanceSubmit}
        onCancel={() => setMaintenanceModalVisible(false)}
        width={600}
      >
        <Form
          form={maintenanceForm}
          layout="vertical"
        >
          <Form.Item
            name="manholeId"
            label="井盖ID"
            rules={[{ required: true, message: '请选择井盖ID' }]}
          >
            <Input disabled />
          </Form.Item>
          
          <Form.Item
            name="timestamp"
            label="维护时间"
            rules={[{ required: true, message: '请选择维护时间' }]}
          >
            <Input type="datetime-local" />
          </Form.Item>
          
          <Form.Item
            name="operator"
            label="操作人"
            rules={[{ required: true, message: '请输入操作人' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="维护类型"
            rules={[{ required: true, message: '请选择维护类型' }]}
          >
            <Select placeholder="选择维护类型">
              <Option value={MaintenanceType.Routine}>常规检查</Option>
              <Option value={MaintenanceType.Repair}>修复工作</Option>
              <Option value={MaintenanceType.Replacement}>设备更换</Option>
              <Option value={MaintenanceType.SystemUpgrade}>软件更新</Option>
              <Option value={MaintenanceType.Replacement}>电池更换</Option>
              <Option value={MaintenanceType.Cleaning}>清洁</Option>
              <Option value={MaintenanceType.Calibration}>其他</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="维护描述"
            rules={[{ required: true, message: '请输入维护描述' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          
          <Form.Item
            name="result"
            label="维护结果"
            rules={[{ required: true, message: '请输入维护结果' }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          
          <Form.Item
            name="nextMaintenanceTime"
            label="下次维护时间"
          >
            <Input type="datetime-local" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default DeviceList; 