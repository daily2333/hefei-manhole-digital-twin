import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  DatePicker,
  Space,
  Table,
  Radio,
  Tag,
  Tooltip,
  Statistic,
  Alert,
  Spin,
} from 'antd';
import {
  AreaChartOutlined,
  ReloadOutlined,
  PrinterOutlined,
  PieChartOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  LineChartOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { fetchReportData, ReportData } from '../../services/api/analyticsService';
import { fetchOverview } from '../../services/api/statsService';
import { ManholeInfo } from '../../typings';

interface StatisticalReportsProps {
  manholes?: ManholeInfo[];
}

const { Option } = Select;
const { RangePicker } = DatePicker;

enum ReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

enum StatDimension {
  DEVICE = 'device',
  AREA = 'area',
  STATUS = 'status',
  ALARM = 'alarm',
  MAINTENANCE = 'maintenance',
}

const dayMap: Record<ReportType, number | null> = {
  [ReportType.DAILY]: 1,
  [ReportType.WEEKLY]: 7,
  [ReportType.MONTHLY]: 30,
  [ReportType.CUSTOM]: null,
};

const levelColorMap: Record<string, string> = {
  info: 'blue',
  notice: 'orange',
  warning: 'red',
  alert: 'purple',
  emergency: 'magenta',
};

const levelLabelMap: Record<string, string> = {
  info: '低',
  notice: '中',
  warning: '高',
  alert: '严重',
  emergency: '紧急',
};

const StatisticalReports: React.FC<StatisticalReportsProps> = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<ReportType>(ReportType.WEEKLY);
  const [timeRange, setTimeRange] = useState<[Date, Date]>([
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    new Date(),
  ]);
  const [dimension, setDimension] = useState<StatDimension>(StatDimension.DEVICE);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [overview, setOverview] = useState<{
    totalManholes: number;
    statusDistribution: Record<string, number>;
    unresolvedAlarms: number;
    pendingMaintenance: number;
    averageHealthScore: number;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const days = dayMap[reportType];
      const daysParam = days ?? Math.ceil((timeRange[1].getTime() - timeRange[0].getTime()) / (1000 * 60 * 60 * 24));
      const [report, ov] = await Promise.all([
        fetchReportData(daysParam),
        fetchOverview(),
      ]);
      setReportData(report);
      setOverview(ov);
    } catch (err: any) {
      setError(err?.message || '加载报表数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, dimension]);

  const exportReport = (type: 'excel' | 'pdf') => {
    alert(`导出${type === 'excel' ? 'Excel' : 'PDF'}报表成功！`);
  };

  const printReport = () => {
    window.print();
  };

  const statusOption = useMemo(() => {
    if (!reportData?.statusReport) return null;
    const { normal, warning, alarm, offline } = reportData.statusReport;
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
      legend: {
        orient: 'vertical' as const,
        right: 10,
        top: 'center',
        textStyle: { color: '#ccc' },
      },
      color: ['#52c41a', '#faad14', '#ff4d4f', '#8c8c8c'],
      series: [
        {
          name: '设备状态',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 4, borderColor: '#0c1b30', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
          },
          labelLine: { show: false },
          data: [
            { value: normal, name: '正常' },
            { value: warning, name: '警告' },
            { value: alarm, name: '告警' },
            { value: offline, name: '离线' },
          ],
        },
      ],
    };
  }, [reportData]);

  const alarmOption = useMemo(() => {
    if (!reportData?.alarmReport?.byLevel) return null;
    const levels = Object.entries(reportData.alarmReport.byLevel);
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: levels.map(([k]) => levelLabelMap[k] || k),
        axisLabel: { color: '#ccc' },
        axisLine: { lineStyle: { color: '#2a3f5d' } },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { color: '#ccc' },
        splitLine: { lineStyle: { color: '#1a2f4d' } },
      },
      color: ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1'],
      series: [
        {
          name: '告警数量',
          type: 'bar',
          barWidth: '50%',
          data: levels.map(([, v]) => v),
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [reportData]);

  const maintenanceOption = useMemo(() => {
    if (!reportData?.maintenanceReport?.byType) return null;
    const types = Object.entries(reportData.maintenanceReport.byType);
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: types.map(([k]) => k),
        axisLabel: { color: '#ccc' },
        axisLine: { lineStyle: { color: '#2a3f5d' } },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { color: '#ccc' },
        splitLine: { lineStyle: { color: '#1a2f4d' } },
      },
      color: ['#13c2c2'],
      series: [
        {
          name: '维护数量',
          type: 'bar',
          barWidth: '50%',
          data: types.map(([, v]) => v),
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [reportData]);

  const deviceColumns = [
    { title: '设备名称', dataIndex: 'name', key: 'name', width: 140 },
    {
      title: '在线率',
      dataIndex: 'uptime',
      key: 'uptime',
      width: 100,
      render: (v: number) => `${v}%`,
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
      render: (v: number) => `${v}%`,
    },
    {
      title: '最后数据时间',
      dataIndex: 'lastDataTime',
      key: 'lastDataTime',
      width: 180,
      render: (v: string) => v || 'N/A',
    },
  ];

  const areaColumns = [
    { title: '区域', dataIndex: 'area', key: 'area', width: 100 },
    { title: '设备数量', dataIndex: 'deviceCount', key: 'deviceCount', width: 100 },
    {
      title: '在线率',
      dataIndex: 'onlineRate',
      key: 'onlineRate',
      width: 100,
      render: (v: number) => `${(v * 100).toFixed(1)}%`,
      sorter: (a: any, b: any) => a.onlineRate - b.onlineRate,
    },
    { title: '告警数量', dataIndex: 'alarms', key: 'alarms', width: 100 },
    {
      title: '平均健康分',
      dataIndex: 'avgHealth',
      key: 'avgHealth',
      width: 120,
      render: (v: number) => (v != null ? v.toFixed(1) : 'N/A'),
    },
  ];

  const statusColumns = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = { normal: 'green', warning: 'orange', alarm: 'red', offline: 'gray' };
        const labelMap: Record<string, string> = { normal: '正常', warning: '警告', alarm: '告警', offline: '离线' };
        return <Tag color={colorMap[status] || ''}>{labelMap[status] || status}</Tag>;
      },
    },
    { title: '设备数量', dataIndex: 'count', key: 'count', width: 100 },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 100,
      render: (v: string) => `${v}%`,
    },
  ];

  const alarmColumns = [
    {
      title: '告警级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => (
        <Tag color={levelColorMap[level] || ''}>{levelLabelMap[level] || level}</Tag>
      ),
    },
    { title: '告警总数', dataIndex: 'count', key: 'count', width: 100 },
  ];

  const maintenanceColumns = [
    { title: '维护类型', dataIndex: 'type', key: 'type', width: 120 },
    { title: '总数', dataIndex: 'count', key: 'count', width: 80 },
  ];

  const getColumns = () => {
    switch (dimension) {
      case StatDimension.DEVICE:
        return deviceColumns;
      case StatDimension.AREA:
        return areaColumns;
      case StatDimension.STATUS:
        return statusColumns;
      case StatDimension.ALARM:
        return alarmColumns;
      case StatDimension.MAINTENANCE:
        return maintenanceColumns;
      default:
        return [];
    }
  };

  const getTableData = (): any[] => {
    if (!reportData) return [];
    switch (dimension) {
      case StatDimension.DEVICE:
        return reportData.deviceReport.map((d, i) => ({ ...d, key: `device-${i}` }));
      case StatDimension.AREA:
        return reportData.areaReport.map((a, i) => ({ ...a, key: `area-${i}` }));
      case StatDimension.STATUS: {
        const { normal, warning, alarm, offline } = reportData.statusReport;
        const total = normal + warning + alarm + offline;
        return [
          { key: 'normal', status: 'normal', count: normal, percentage: total > 0 ? ((normal / total) * 100).toFixed(1) : '0' },
          { key: 'warning', status: 'warning', count: warning, percentage: total > 0 ? ((warning / total) * 100).toFixed(1) : '0' },
          { key: 'alarm', status: 'alarm', count: alarm, percentage: total > 0 ? ((alarm / total) * 100).toFixed(1) : '0' },
          { key: 'offline', status: 'offline', count: offline, percentage: total > 0 ? ((offline / total) * 100).toFixed(1) : '0' },
        ];
      }
      case StatDimension.ALARM:
        return Object.entries(reportData.alarmReport.byLevel).map(([level, count], i) => ({
          key: `alarm-${i}`,
          level,
          count,
        }));
      case StatDimension.MAINTENANCE:
        return Object.entries(reportData.maintenanceReport.byType).map(([type, count], i) => ({
          key: `maint-${i}`,
          type,
          count,
        }));
      default:
        return [];
    }
  };

  const renderCharts = () => {
    if (dimension === StatDimension.STATUS && statusOption) {
      return (
        <Col span={24}>
          <Row gutter={16}>
            <Col span={6}>
              <Card className="dark-card" styles={{ body: { padding: 16 } }}>
                <Statistic title="设备总数" value={overview?.totalManholes ?? '-'} prefix={<AreaChartOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="dark-card" styles={{ body: { padding: 16 } }}>
                <Statistic title="平均电池电量" value={reportData?.statusReport.batteryAvg ?? '-'} suffix="%" prefix={<LineChartOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="dark-card" styles={{ body: { padding: 16 } }}>
                <Statistic title="平均信号强度" value={reportData?.statusReport.signalAvg ?? '-'} suffix="dBm" prefix={<PieChartOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="dark-card" styles={{ body: { padding: 16 } }}>
                <Statistic
                  title="周环比变化"
                  value={reportData?.statusReport.weekOverWeek ?? 0}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: (reportData?.statusReport.weekOverWeek ?? 0) >= 0 ? '#ff4d4f' : '#52c41a' }}
                  prefix={reportData?.statusReport.weekOverWeek != null && reportData.statusReport.weekOverWeek >= 0 ? <WarningOutlined /> : <CheckCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Card title="设备状态分布" className="dark-card">
                <ReactECharts option={statusOption} style={{ height: 300 }} className="react-echarts" />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="状态统计明细" className="dark-card">
                <Table
                  dataSource={getTableData()}
                  columns={getColumns()}
                  rowKey="key"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </Col>
      );
    }

    if (dimension === StatDimension.ALARM && alarmOption) {
      return (
        <Col span={24}>
          <Row gutter={16}>
            <Col span={6}>
              <Card className="dark-card" styles={{ body: { padding: 16 } }}>
                <Statistic title="告警总数" value={reportData?.alarmReport.total ?? '-'} prefix={<WarningOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="dark-card" styles={{ body: { padding: 16 } }}>
                <Statistic title="已处理" value={reportData?.alarmReport.resolved ?? '-'} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="dark-card" styles={{ body: { padding: 16 } }}>
                <Statistic title="处理率" value={reportData?.alarmReport.resolveRate ?? '-'} suffix="%" prefix={<PieChartOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="dark-card" styles={{ body: { padding: 16 } }}>
                <Statistic title="平均响应时间" value={reportData?.alarmReport.avgResponseTime ?? '-'} suffix="分钟" prefix={<ClockCircleOutlined />} />
              </Card>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Card title="告警级别分布" className="dark-card">
                <ReactECharts option={alarmOption} style={{ height: 300 }} className="react-echarts" />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="告警级别明细" className="dark-card">
                <Table
                  dataSource={getTableData()}
                  columns={getColumns()}
                  rowKey="key"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </Col>
      );
    }

    if (dimension === StatDimension.MAINTENANCE && maintenanceOption) {
      return (
        <Col span={24}>
          <Row gutter={16}>
            <Col span={6}>
              <Card className="dark-card" styles={{ body: { padding: 16 } }}>
                <Statistic title="维护总数" value={reportData?.maintenanceReport.total ?? '-'} prefix={<AreaChartOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="dark-card" styles={{ body: { padding: 16 } }}>
                <Statistic title="已完成" value={reportData?.maintenanceReport.completed ?? '-'} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="dark-card" styles={{ body: { padding: 16 } }}>
                <Statistic title="完成率" value={reportData?.maintenanceReport.completionRate ?? '-'} suffix="%" prefix={<PieChartOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="dark-card" styles={{ body: { padding: 16 } }}>
                <Statistic title="平均用时" value={reportData?.maintenanceReport.avgDuration ?? '-'} suffix="小时" prefix={<ClockCircleOutlined />} />
              </Card>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Card title="维护类型分布" className="dark-card">
                <ReactECharts option={maintenanceOption} style={{ height: 300 }} className="react-echarts" />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="维护类型明细" className="dark-card">
                <Table
                  dataSource={getTableData()}
                  columns={getColumns()}
                  rowKey="key"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </Col>
      );
    }

    return null;
  };

  const renderSummaryCards = () => {
    if (!overview) return null;
    return (
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card className="dark-card" styles={{ body: { padding: 16 } }}>
            <Statistic title="井盖总数" value={overview.totalManholes} prefix={<AreaChartOutlined />} />
          </Card>
        </Col>
        <Col span={5}>
          <Card className="dark-card" styles={{ body: { padding: 16 } }}>
            <Statistic title="未处理告警" value={overview.unresolvedAlarms} prefix={<WarningOutlined />} valueStyle={{ color: overview.unresolvedAlarms > 0 ? '#ff4d4f' : '#52c41a' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card className="dark-card" styles={{ body: { padding: 16 } }}>
            <Statistic title="待处理维护" value={overview.pendingMaintenance} prefix={<ClockCircleOutlined />} valueStyle={{ color: overview.pendingMaintenance > 0 ? '#faad14' : '#52c41a' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card className="dark-card" styles={{ body: { padding: 16 } }}>
            <Statistic title="平均健康分" value={overview.averageHealthScore} precision={1} prefix={<PieChartOutlined />} />
          </Card>
        </Col>
        <Col span={5}>
          <Card className="dark-card" styles={{ body: { padding: 16 } }}>
            <Statistic title="报表天数" value={dayMap[reportType] ?? '自定义'} suffix="天" prefix={<LineChartOutlined />} />
          </Card>
        </Col>
      </Row>
    );
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
      <Spin spinning={loading}>
        {error ? (
          <Alert message="加载失败" description={error} type="error" showIcon style={{ marginBottom: 16 }} />
        ) : null}

        {renderSummaryCards()}

        <Card
          title={`${
            reportType === ReportType.DAILY ? '日报表' :
            reportType === ReportType.WEEKLY ? '周报表' :
            reportType === ReportType.MONTHLY ? '月报表' : '自定义报表'
          } - ${
            dimension === StatDimension.DEVICE ? '设备维度' :
            dimension === StatDimension.AREA ? '区域维度' :
            dimension === StatDimension.STATUS ? '状态维度' :
            dimension === StatDimension.ALARM ? '告警维度' : '维护维度'
          }`}
        >
          <Row gutter={[16, 16]}>
            {dimension === StatDimension.DEVICE || dimension === StatDimension.AREA ? (
              <Col span={24}>
                <Table
                  dataSource={getTableData()}
                  columns={getColumns()}
                  rowKey="key"
                  pagination={{ pageSize: 10 }}
                />
              </Col>
            ) : null}

            {renderCharts()}
          </Row>
        </Card>
      </Spin>
    </Card>
  );
};

export default StatisticalReports;
