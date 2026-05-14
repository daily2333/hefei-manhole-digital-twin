import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Select, 
  Button, 
  DatePicker, 
  Space, 
  Table, 
  Tabs,
  Typography,
  Divider,
  Statistic,
  Form,
  Radio,
  Input,
  Tag,
  Tooltip,
  Empty
} from 'antd';
import {
  AreaChartOutlined,
  DownloadOutlined,
  ReloadOutlined,
  PrinterOutlined,
  PieChartOutlined,
  BarChartOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { ManholeInfo, AlarmType, AlarmLevel } from '../../typings';

// 模拟图表组件
const Chart: React.FC<{ type: string, data: any, height?: number }> = ({ type, data, height = 300 }) => {
  return (
    <div 
      style={{ 
        height: height, 
        background: '#f0f2f5', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        borderRadius: '4px'
      }}
    >
      {type === 'bar' && <BarChartOutlined style={{ fontSize: 36, opacity: 0.5 }} />}
      {type === 'line' && <LineChartOutlined style={{ fontSize: 36, opacity: 0.5 }} />}
      {type === 'pie' && <PieChartOutlined style={{ fontSize: 36, opacity: 0.5 }} />}
      <div style={{ marginLeft: 10 }}>
        <p style={{ margin: 0 }}>{data.title || '统计图表'}</p>
        <p style={{ margin: 0, fontSize: 12, color: '#999' }}>数据点: {data?.points?.length || 0}</p>
      </div>
    </div>
  );
};

interface StatisticalReportsProps {
  manholes?: ManholeInfo[];
}

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

// 报表类型
enum ReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

// 统计维度
enum StatDimension {
  DEVICE = 'device',
  AREA = 'area',
  STATUS = 'status',
  ALARM = 'alarm',
  MAINTENANCE = 'maintenance'
}

interface ChartData {
  title: string;
  points: any[];
}

/**
 * 统计报表组件
 */
const StatisticalReports: React.FC<StatisticalReportsProps> = ({
  manholes = []
}) => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<ReportType>(ReportType.DAILY);
  const [timeRange, setTimeRange] = useState<[Date, Date]>([
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    new Date()
  ]);
  const [dimension, setDimension] = useState<StatDimension>(StatDimension.DEVICE);
  const [activeTab, setActiveTab] = useState<string>('device');
  const [reportData, setReportData] = useState<any[]>([]);
  
  // 加载数据
  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      // 生成模拟数据
      const data = generateReportData();
      setReportData(data);
      setLoading(false);
    }, 1000);
  };
  
  // 初始加载
  useEffect(() => {
    loadData();
  }, [reportType, timeRange, dimension]);
  
  // 生成模拟报表数据
  const generateReportData = () => {
    // 根据不同维度生成不同的报表数据
    switch(dimension) {
      case StatDimension.DEVICE:
        return generateDeviceReport();
      case StatDimension.AREA:
        return generateAreaReport();
      case StatDimension.STATUS:
        return generateStatusReport();
      case StatDimension.ALARM:
        return generateAlarmReport();
      case StatDimension.MAINTENANCE:
        return generateMaintenanceReport();
      default:
        return [];
    }
  };
  
  // 生成设备报表
  const generateDeviceReport = () => {
    const data = [];
    const startDate = new Date(timeRange[0]);
    const endDate = new Date(timeRange[1]);
    
    // 模拟设备数据
    for (let i = 1; i <= 20; i++) {
      const device = {
        key: `device-${i}`,
        deviceId: `MH-${String(i).padStart(4, '0')}`,
        deviceName: `井盖 ${i}`,
        area: i % 4 === 0 ? '北区' : i % 3 === 0 ? '南区' : i % 2 === 0 ? '东区' : '西区',
        status: i % 10 === 0 ? '离线' : i % 7 === 0 ? '告警' : i % 5 === 0 ? '异常' : '正常',
        uptime: Math.floor(Math.random() * 100) + 90, // 90-189%的在线率
        alarmCount: Math.floor(Math.random() * 10),
        maintenanceCount: Math.floor(Math.random() * 5),
        batteryAvg: Math.floor(Math.random() * 30) + 70, // 70-99%的电池电量
        lastDataTime: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toLocaleString(),
      };
      
      data.push(device);
    }
    
    return data;
  };
  
  // 生成区域报表
  const generateAreaReport = () => {
    const areas = ['北区', '南区', '东区', '西区'];
    const data = [];
    
    for (const area of areas) {
      const deviceCount = Math.floor(Math.random() * 30) + 20;
      const onlineCount = Math.floor(deviceCount * (0.8 + Math.random() * 0.2));
      const offlineCount = deviceCount - onlineCount;
      const alarmCount = Math.floor(Math.random() * 15);
      
      data.push({
        key: area,
        area,
        deviceCount,
        onlineCount,
        offlineCount,
        onlineRate: ((onlineCount / deviceCount) * 100).toFixed(1),
        alarmCount,
        maintenanceCount: Math.floor(Math.random() * 10),
        avgResponseTime: Math.floor(Math.random() * 60) + 10, // 10-69分钟的平均响应时间
        avgBatteryLevel: Math.floor(Math.random() * 20) + 80, // 80-99%的平均电池电量
      });
    }
    
    return data;
  };
  
  // 生成状态报表
  const generateStatusReport = () => {
    const totalDevices = 100;
    const normalCount = Math.floor(totalDevices * (0.7 + Math.random() * 0.2));
    const warningCount = Math.floor(totalDevices * (0.05 + Math.random() * 0.05));
    const alarmCount = Math.floor(totalDevices * (0.03 + Math.random() * 0.07));
    const offlineCount = totalDevices - normalCount - warningCount - alarmCount;
    
    return [
      {
        key: 'normal',
        status: '正常',
        count: normalCount,
        percentage: ((normalCount / totalDevices) * 100).toFixed(1),
        avgBatteryLevel: Math.floor(Math.random() * 10) + 85, // 85-94%的平均电池电量
        lastWeekChange: Math.floor(Math.random() * 10) - 5, // -5至4的变化量
      },
      {
        key: 'warning',
        status: '异常',
        count: warningCount,
        percentage: ((warningCount / totalDevices) * 100).toFixed(1),
        avgBatteryLevel: Math.floor(Math.random() * 15) + 70, // 70-84%的平均电池电量
        lastWeekChange: Math.floor(Math.random() * 10) - 3, // -3至6的变化量
      },
      {
        key: 'alarm',
        status: '告警',
        count: alarmCount,
        percentage: ((alarmCount / totalDevices) * 100).toFixed(1),
        avgBatteryLevel: Math.floor(Math.random() * 20) + 60, // 60-79%的平均电池电量
        lastWeekChange: Math.floor(Math.random() * 10) - 2, // -2至7的变化量
      },
      {
        key: 'offline',
        status: '离线',
        count: offlineCount,
        percentage: ((offlineCount / totalDevices) * 100).toFixed(1),
        avgBatteryLevel: Math.floor(Math.random() * 30) + 40, // 40-69%的平均电池电量
        lastWeekChange: Math.floor(Math.random() * 10) - 4, // -4至5的变化量
      }
    ];
  };
  
  // 生成告警报表
  const generateAlarmReport = () => {
    const alarmTypes = [
      { key: 'water', name: '水位告警', level: AlarmLevel.Alert },
      { key: 'gas', name: '气体告警', level: AlarmLevel.Emergency },
      { key: 'battery', name: '电池告警', level: AlarmLevel.Notice },
      { key: 'tilt', name: '倾斜告警', level: AlarmLevel.Alert },
      { key: 'open', name: '井盖打开', level: AlarmLevel.Notice },
      { key: 'comm', name: '通信告警', level: AlarmLevel.Info },
    ];
    
    const data = [];
    
    for (const type of alarmTypes) {
      const count = Math.floor(Math.random() * 50) + 10;
      const resolvedCount = Math.floor(count * (0.5 + Math.random() * 0.3));
      const unresolvedCount = count - resolvedCount;
      const avgResponseTime = Math.floor(Math.random() * 120) + 30; // 30-149分钟的平均响应时间
      
      data.push({
        key: type.key,
        alarmType: type.name,
        alarmLevel: type.level,
        count,
        resolvedCount,
        unresolvedCount,
        resolveRate: ((resolvedCount / count) * 100).toFixed(1),
        avgResponseTime,
        avgResolveTime: avgResponseTime + Math.floor(Math.random() * 180) + 60,
      });
    }
    
    return data;
  };
  
  // 生成维护报表
  const generateMaintenanceReport = () => {
    const maintenanceTypes = [
      { key: 'routine', name: '例行检查' },
      { key: 'repair', name: '故障维修' },
      { key: 'battery', name: '电池更换' },
      { key: 'sensor', name: '传感器更换' },
      { key: 'clean', name: '清理井内' },
    ];
    
    const data = [];
    
    for (const type of maintenanceTypes) {
      const count = Math.floor(Math.random() * 40) + 5;
      const completedCount = Math.floor(count * (0.6 + Math.random() * 0.4));
      const pendingCount = count - completedCount;
      const avgDuration = Math.floor(Math.random() * 120) + 60; // 60-179分钟的平均用时
      
      data.push({
        key: type.key,
        maintenanceType: type.name,
        count,
        completedCount,
        pendingCount,
        completionRate: ((completedCount / count) * 100).toFixed(1),
        avgDuration,
        avgCost: Math.floor(Math.random() * 200) + 100,
      });
    }
    
    return data;
  };
  
  // 获取表格列配置
  const getColumns = () => {
    switch(dimension) {
      case StatDimension.DEVICE:
        return [
          {
            title: '设备ID',
            dataIndex: 'deviceId',
            key: 'deviceId',
            width: 120,
          },
          {
            title: '设备名称',
            dataIndex: 'deviceName',
            key: 'deviceName',
            width: 120,
          },
          {
            title: '所属区域',
            dataIndex: 'area',
            key: 'area',
            width: 100,
          },
          {
            title: '设备状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => {
              let color = '';
              switch(status) {
                case '正常':
                  color = 'green';
                  break;
                case '异常':
                  color = 'orange';
                  break;
                case '告警':
                  color = 'red';
                  break;
                case '离线':
                  color = 'gray';
                  break;
                default:
                  color = '';
              }
              return <Tag color={color}>{status}</Tag>;
            }
          },
          {
            title: '在线率',
            dataIndex: 'uptime',
            key: 'uptime',
            width: 100,
            render: (uptime: number) => `${uptime}%`,
            sorter: (a: any, b: any) => a.uptime - b.uptime,
          },
          {
            title: '告警次数',
            dataIndex: 'alarmCount',
            key: 'alarmCount',
            width: 100,
            sorter: (a: any, b: any) => a.alarmCount - b.alarmCount,
          },
          {
            title: '维护次数',
            dataIndex: 'maintenanceCount',
            key: 'maintenanceCount',
            width: 100,
          },
          {
            title: '平均电量',
            dataIndex: 'batteryAvg',
            key: 'batteryAvg',
            width: 100,
            render: (battery: number) => `${battery}%`,
          },
          {
            title: '最后数据时间',
            dataIndex: 'lastDataTime',
            key: 'lastDataTime',
            width: 180,
          }
        ];
      case StatDimension.AREA:
        return [
          {
            title: '区域',
            dataIndex: 'area',
            key: 'area',
            width: 100,
          },
          {
            title: '设备数量',
            dataIndex: 'deviceCount',
            key: 'deviceCount',
            width: 100,
          },
          {
            title: '在线数量',
            dataIndex: 'onlineCount',
            key: 'onlineCount',
            width: 100,
          },
          {
            title: '离线数量',
            dataIndex: 'offlineCount',
            key: 'offlineCount',
            width: 100,
          },
          {
            title: '在线率',
            dataIndex: 'onlineRate',
            key: 'onlineRate',
            width: 100,
            render: (rate: string) => `${rate}%`,
            sorter: (a: any, b: any) => parseFloat(a.onlineRate) - parseFloat(b.onlineRate),
          },
          {
            title: '告警数量',
            dataIndex: 'alarmCount',
            key: 'alarmCount',
            width: 100,
          },
          {
            title: '维护次数',
            dataIndex: 'maintenanceCount',
            key: 'maintenanceCount',
            width: 100,
          },
          {
            title: '平均响应时间(分钟)',
            dataIndex: 'avgResponseTime',
            key: 'avgResponseTime',
            width: 150,
          },
          {
            title: '平均电池电量',
            dataIndex: 'avgBatteryLevel',
            key: 'avgBatteryLevel',
            width: 120,
            render: (level: number) => `${level}%`,
          }
        ];
      case StatDimension.STATUS:
        return [
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => {
              let color = '';
              switch(status) {
                case '正常':
                  color = 'green';
                  break;
                case '异常':
                  color = 'orange';
                  break;
                case '告警':
                  color = 'red';
                  break;
                case '离线':
                  color = 'gray';
                  break;
                default:
                  color = '';
              }
              return <Tag color={color}>{status}</Tag>;
            }
          },
          {
            title: '设备数量',
            dataIndex: 'count',
            key: 'count',
            width: 100,
          },
          {
            title: '占比',
            dataIndex: 'percentage',
            key: 'percentage',
            width: 100,
            render: (percentage: string) => `${percentage}%`,
          },
          {
            title: '平均电池电量',
            dataIndex: 'avgBatteryLevel',
            key: 'avgBatteryLevel',
            width: 150,
            render: (level: number) => `${level}%`,
          },
          {
            title: '与上周变化',
            dataIndex: 'lastWeekChange',
            key: 'lastWeekChange',
            width: 150,
            render: (change: number) => {
              if (change > 0) {
                return <span style={{ color: 'red' }}>+{change}</span>;
              } else if (change < 0) {
                return <span style={{ color: 'green' }}>{change}</span>;
              }
              return <span>0</span>;
            }
          }
        ];
      case StatDimension.ALARM:
        return [
          {
            title: '告警类型',
            dataIndex: 'alarmType',
            key: 'alarmType',
            width: 120,
          },
          {
            title: '告警级别',
            dataIndex: 'alarmLevel',
            key: 'alarmLevel',
            width: 100,
            render: (level: AlarmLevel) => {
              let color = '';
              let text = '';
              
              switch(level) {
                case AlarmLevel.Info:
                  color = 'blue';
                  text = '低';
                  break;
                case AlarmLevel.Notice:
                  color = 'orange';
                  text = '中';
                  break;
                case AlarmLevel.Warning:
                  color = 'red';
                  text = '高';
                  break;
                case AlarmLevel.Emergency:
                  color = 'purple';
                  text = '严重';
                  break;
                default:
                  color = '';
                  text = '未知';
              }
              
              return <Tag color={color}>{text}</Tag>;
            }
          },
          {
            title: '告警总数',
            dataIndex: 'count',
            key: 'count',
            width: 100,
          },
          {
            title: '已处理',
            dataIndex: 'resolvedCount',
            key: 'resolvedCount',
            width: 100,
          },
          {
            title: '未处理',
            dataIndex: 'unresolvedCount',
            key: 'unresolvedCount',
            width: 100,
          },
          {
            title: '处理率',
            dataIndex: 'resolveRate',
            key: 'resolveRate',
            width: 100,
            render: (rate: string) => `${rate}%`,
          },
          {
            title: '平均响应时间(分钟)',
            dataIndex: 'avgResponseTime',
            key: 'avgResponseTime',
            width: 150,
          },
          {
            title: '平均处理时间(分钟)',
            dataIndex: 'avgResolveTime',
            key: 'avgResolveTime',
            width: 150,
          }
        ];
      case StatDimension.MAINTENANCE:
        return [
          {
            title: '维护类型',
            dataIndex: 'maintenanceType',
            key: 'maintenanceType',
            width: 120,
          },
          {
            title: '总数',
            dataIndex: 'count',
            key: 'count',
            width: 80,
          },
          {
            title: '已完成',
            dataIndex: 'completedCount',
            key: 'completedCount',
            width: 100,
          },
          {
            title: '待完成',
            dataIndex: 'pendingCount',
            key: 'pendingCount',
            width: 100,
          },
          {
            title: '完成率',
            dataIndex: 'completionRate',
            key: 'completionRate',
            width: 100,
            render: (rate: string) => `${rate}%`,
          },
          {
            title: '平均用时(分钟)',
            dataIndex: 'avgDuration',
            key: 'avgDuration',
            width: 150,
          },
          {
            title: '平均成本(元)',
            dataIndex: 'avgCost',
            key: 'avgCost',
            width: 120,
            render: (cost: number) => `¥${cost}`,
          }
        ];
      default:
        return [];
    }
  };
  
  // 导出报表
  const exportReport = (type: 'excel' | 'pdf') => {
    console.log(`导出${type === 'excel' ? 'Excel' : 'PDF'}报表`, reportData);
    // 在实际应用中，这里会调用导出API
    alert(`导出${type === 'excel' ? 'Excel' : 'PDF'}报表成功！`);
  };
  
  // 打印报表
  const printReport = () => {
    console.log('打印报表', reportData);
    // 在实际应用中，这里会调用打印API
    window.print();
  };
  
  // 获取图表数据
  const getChartData = () => {
    const chartData: ChartData = {
      title: '',
      points: []
    };
    
    switch(dimension) {
      case StatDimension.DEVICE:
        chartData.title = '设备状态分布';
        // 简单起见，这里只是示例图表数据
        chartData.points = reportData;
        break;
      case StatDimension.AREA:
        chartData.title = '区域设备分布';
        chartData.points = reportData;
        break;
      case StatDimension.STATUS:
        chartData.title = '设备状态统计';
        chartData.points = reportData;
        break;
      case StatDimension.ALARM:
        chartData.title = '告警类型统计';
        chartData.points = reportData;
        break;
      case StatDimension.MAINTENANCE:
        chartData.title = '维护类型统计';
        chartData.points = reportData;
        break;
    }
    
    return chartData;
  };
  
  return (
    <Card
      title={<><AreaChartOutlined /> 统计报表</>}
      extra={
        <Space>
          <Radio.Group 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value={ReportType.DAILY}>日报表</Radio.Button>
            <Radio.Button value={ReportType.WEEKLY}>周报表</Radio.Button>
            <Radio.Button value={ReportType.MONTHLY}>月报表</Radio.Button>
            <Radio.Button value={ReportType.CUSTOM}>自定义</Radio.Button>
          </Radio.Group>
          
          {reportType === ReportType.CUSTOM && (
            <RangePicker 
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setTimeRange([dates[0].toDate(), dates[1].toDate()]);
                }
              }}
            />
          )}
          
          <Select
            value={dimension}
            onChange={setDimension}
            style={{ width: 150 }}
          >
            <Option value={StatDimension.DEVICE}>设备维度</Option>
            <Option value={StatDimension.AREA}>区域维度</Option>
            <Option value={StatDimension.STATUS}>状态维度</Option>
            <Option value={StatDimension.ALARM}>告警维度</Option>
            <Option value={StatDimension.MAINTENANCE}>维护维度</Option>
          </Select>
          
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadData}
            loading={loading}
          >
            刷新
          </Button>
          
          <Tooltip title="导出为Excel">
            <Button 
              icon={<FileExcelOutlined />}
              onClick={() => exportReport('excel')}
            >
              Excel
            </Button>
          </Tooltip>
          
          <Tooltip title="导出为PDF">
            <Button 
              icon={<FilePdfOutlined />}
              onClick={() => exportReport('pdf')}
            >
              PDF
            </Button>
          </Tooltip>
          
          <Tooltip title="打印报表">
            <Button 
              icon={<PrinterOutlined />}
              onClick={printReport}
            >
              打印
            </Button>
          </Tooltip>
        </Space>
      }
    >
      <Card title={`${
        reportType === ReportType.DAILY ? '日报表' : 
        reportType === ReportType.WEEKLY ? '周报表' : 
        reportType === ReportType.MONTHLY ? '月报表' : '自定义报表'
      } - ${
        dimension === StatDimension.DEVICE ? '设备维度' : 
        dimension === StatDimension.AREA ? '区域维度' : 
        dimension === StatDimension.STATUS ? '状态维度' : 
        dimension === StatDimension.ALARM ? '告警维度' : '维护维度'
      }`}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Row gutter={16}>
              <Col span={8}>
                <Chart type="bar" data={getChartData()} height={250} />
              </Col>
              <Col span={8}>
                <Chart type="pie" data={getChartData()} height={250} />
              </Col>
              <Col span={8}>
                <Chart type="line" data={getChartData()} height={250} />
              </Col>
            </Row>
          </Col>
          
          <Col span={24}>
            <Divider orientation="left">报表数据</Divider>
            
            <Table 
              dataSource={reportData} 
              columns={getColumns()}
              rowKey="key"
              pagination={{ pageSize: 10 }}
              loading={loading}
            />
          </Col>
        </Row>
      </Card>
    </Card>
  );
};

export default StatisticalReports; 