import React, { useState } from 'react';
import { Table, Tag, Button, Space, Modal, Badge, Input, DatePicker, Select, Card } from 'antd';
import { SearchOutlined, ExclamationCircleOutlined, CheckCircleOutlined, BellOutlined } from '@ant-design/icons';
import { ManholeAlarm, AlarmType, AlarmLevel } from '../../typings';
import { formatDateTime, getAlarmLevelColor } from '../../utils';

const { confirm } = Modal;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface AlarmListProps {
  alarms: ManholeAlarm[];
  onAcknowledge?: (alarmId: string) => void;
  onResolve?: (alarmId: string) => void;
}

/**
 * 告警列表组件
 */
const AlarmList: React.FC<AlarmListProps> = ({
  alarms,
  onAcknowledge,
  onResolve
}) => {
  // 筛选状态
  const [filters, setFilters] = useState({
    manholeId: '',
    alarmType: undefined as AlarmType | undefined,
    alarmLevel: undefined as AlarmLevel | undefined,
    isAcknowledged: undefined as boolean | undefined,
    isResolved: undefined as boolean | undefined,
    dateRange: undefined as [string, string] | undefined
  });

  // 告警类型转换为显示文本
  const alarmTypeText = (type: AlarmType) => {
    switch (type) {
      case AlarmType.CoverOpen:
        return '井盖打开';
      case AlarmType.Temperature:
        return '温度过高';
      case AlarmType.WaterLevel:
        return '水位过高';
      case AlarmType.GasLevel:
        return '气体浓度高';
      case AlarmType.BatteryLow:
        return '电池电量低';
      case AlarmType.SignalLoss:
        return '信号丢失';
      case AlarmType.Vibration:
        return '检测到篡改';
      case AlarmType.Tilt:
        return '设备故障';
      default:
        return '未知';
    }
  };

  // 告警级别转换为显示标签
  const renderAlarmLevel = (level: AlarmLevel) => {
    const color = getAlarmLevelColor(level);
    let text = '';
    switch (level) {
      case AlarmLevel.Info:
        text = '信息';
        break;
      case AlarmLevel.Notice:
        text = '提醒';
        break;
      case AlarmLevel.Warning:
        text = '警告';
        break;
      case AlarmLevel.Alert:
        text = '严重';
        break;
      case AlarmLevel.Emergency:
        text = '紧急';
        break;
      default:
        text = '未知';
    }
    
    return <Tag color={color}>{text}</Tag>;
  };

  // 确认告警弹窗
  const showAcknowledgeConfirm = (alarmId: string) => {
    confirm({
      title: '确认告警',
      icon: <ExclamationCircleOutlined />,
      content: '您确定要确认该告警吗？确认后将标记为已知晓。',
      onOk() {
        if (onAcknowledge) {
          onAcknowledge(alarmId);
        }
      }
    });
  };

  // 解决告警弹窗
  const showResolveConfirm = (alarmId: string) => {
    confirm({
      title: '解决告警',
      icon: <CheckCircleOutlined />,
      content: '您确定该告警已解决吗？解决后将标记为已处理。',
      onOk() {
        if (onResolve) {
          onResolve(alarmId);
        }
      }
    });
  };

  // 应用筛选条件
  const applyFilters = (alarms: ManholeAlarm[]) => {
    return alarms.filter(alarm => {
      // 筛选井盖ID
      if (filters.manholeId && !alarm.manholeId.includes(filters.manholeId)) {
        return false;
      }
      
      // 筛选告警类型
      if (filters.alarmType && alarm.type !== filters.alarmType) {
        return false;
      }
      
      // 筛选告警级别
      if (filters.alarmLevel && alarm.level !== filters.alarmLevel) {
        return false;
      }
      
      // 筛选确认状态
      if (filters.isAcknowledged !== undefined && alarm.isResolved !== filters.isAcknowledged) {
        return false;
      }
      
      // 筛选解决状态
      if (filters.isResolved !== undefined && alarm.isResolved !== filters.isResolved) {
        return false;
      }
      
      // 筛选日期范围
      if (filters.dateRange) {
        const alarmDate = new Date(alarm.time).getTime();
        const startDate = new Date(filters.dateRange[0]).getTime();
        const endDate = new Date(filters.dateRange[1]).getTime();
        
        if (alarmDate < startDate || alarmDate > endDate) {
          return false;
        }
      }
      
      return true;
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '告警ID',
      dataIndex: 'id',
      key: 'id',
      width: 120
    },
    {
      title: '井盖ID',
      dataIndex: 'manholeId',
      key: 'manholeId',
      width: 120
    },
    {
      title: '告警时间',
      dataIndex: 'time',
      key: 'time',
      render: (text: string) => formatDateTime(text),
      width: 180,
      sorter: (a: ManholeAlarm, b: ManholeAlarm) => 
        new Date(a.time).getTime() - new Date(b.time).getTime()
    },
    {
      title: '告警类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: AlarmType) => alarmTypeText(type),
      width: 120
    },
    {
      title: '告警级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: AlarmLevel) => renderAlarmLevel(level),
      width: 100
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200
    },
    {
      title: '状态',
      key: 'status',
      width: 150,
      render: (text: string, record: ManholeAlarm) => (
        <Space>
          {record.isResolved ? (
            <Badge status="success" text="已解决" />
          ) : (
            <Badge status="error" text="未处理" />
          )}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (text: string, record: ManholeAlarm) => (
        <Space size="small">
          {!record.isResolved && (
            <Button
              size="small"
              type="primary"
              onClick={() => showAcknowledgeConfirm(record.id)}
            >
              确认
            </Button>
          )}
          {!record.isResolved && (
            <Button
              size="small"
              type="primary"
              danger
              onClick={() => showResolveConfirm(record.id)}
            >
              解决
            </Button>
          )}
        </Space>
      )
    }
  ];

  // 筛选过的告警数据
  const filteredAlarms = applyFilters(alarms);

  return (
    <Card 
      title={
        <Space>
          <BellOutlined />
          <span>告警管理</span>
          <Tag color="#f50">{filteredAlarms.length}</Tag>
        </Space>
      }
      style={{ width: '100%' }}
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="输入井盖ID"
          value={filters.manholeId}
          onChange={e => setFilters({ ...filters, manholeId: e.target.value })}
          style={{ width: 150 }}
          prefix={<SearchOutlined />}
        />
        
        <Select
          placeholder="告警类型"
          style={{ width: 150 }}
          allowClear
          value={filters.alarmType}
          onChange={value => setFilters({ ...filters, alarmType: value })}
        >
          {Object.values(AlarmType).map(type => (
            <Option key={type} value={type}>{alarmTypeText(type)}</Option>
          ))}
        </Select>
        
        <Select
          placeholder="告警级别"
          style={{ width: 130 }}
          allowClear
          value={filters.alarmLevel}
          onChange={value => setFilters({ ...filters, alarmLevel: value })}
        >
          <Option value={AlarmLevel.Info}>信息</Option>
          <Option value={AlarmLevel.Notice}>提醒</Option>
          <Option value={AlarmLevel.Warning}>警告</Option>
          <Option value={AlarmLevel.Alert}>严重</Option>
          <Option value={AlarmLevel.Emergency}>紧急</Option>
        </Select>
        
        <Select
          placeholder="确认状态"
          style={{ width: 130 }}
          allowClear
          value={filters.isAcknowledged}
          onChange={value => setFilters({ ...filters, isAcknowledged: value })}
        >
          <Option value={true}>已确认</Option>
          <Option value={false}>未确认</Option>
        </Select>
        
        <Select
          placeholder="解决状态"
          style={{ width: 130 }}
          allowClear
          value={filters.isResolved}
          onChange={value => setFilters({ ...filters, isResolved: value })}
        >
          <Option value={true}>已解决</Option>
          <Option value={false}>未解决</Option>
        </Select>
        
        <RangePicker
          placeholder={['开始时间', '结束时间']}
          onChange={(dates) => {
            if (dates) {
              setFilters({
                ...filters,
                dateRange: [dates[0]!.toISOString(), dates[1]!.toISOString()]
              });
            } else {
              setFilters({ ...filters, dateRange: undefined });
            }
          }}
        />
        
        <Button
          type="primary"
          onClick={() => setFilters({
            manholeId: '',
            alarmType: undefined,
            alarmLevel: undefined,
            isAcknowledged: undefined,
            isResolved: undefined,
            dateRange: undefined
          })}
        >
          重置
        </Button>
      </Space>
      
      <Table
        columns={columns}
        dataSource={filteredAlarms}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1100 }}
      />
    </Card>
  );
};

export default AlarmList; 