import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  Col,
  DatePicker,
  Empty,
  Progress,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography
} from 'antd';
import { CloudOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import { ManholeInfo, ManholeRealTimeData } from '../../typings';
import {
  fetchEnvironmentSummary,
  EnvironmentSummary
} from '../../services/api/environmentService';

const { RangePicker } = DatePicker;
const { Text } = Typography;

type DataType = 'hourly' | 'daily' | 'weekly';
type TabKey = 'temperature' | 'humidity' | 'gas';

interface EnvironmentDataProps {
  manholes: ManholeInfo[];
  realTimeDataMap: Map<string, ManholeRealTimeData>;
}

type MetricPoint = {
  timestamp: string;
  formattedTime: string;
  value: number;
  metric: string;
};

const DEFAULT_RANGE: [Date, Date] = [
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  new Date()
];

const periodMap: Record<DataType, string> = {
  hourly: '24h',
  daily: '7d',
  weekly: '30d'
};

const formatTime = (isoString: string, dataType: DataType, index: number): string => {
  const date = new Date(isoString);
  if (dataType === 'hourly') {
    return `${date.getMonth() + 1}-${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:00`;
  }
  if (dataType === 'daily') {
    return `${date.getMonth() + 1}-${date.getDate()}`;
  }
  return `第 ${index + 1} 周`;
};

const metricSeriesConfig = (data: MetricPoint[], color: string, unit: string) => ({
  data,
  xField: 'formattedTime',
  yField: 'value',
  seriesField: 'metric',
  smooth: true,
  color: [color],
  point: { size: 4, shape: 'circle' },
  legend: false,
  yAxis: {
    label: {
      formatter: (value: string) => `${value}${unit}`
    }
  },
  tooltip: {
    formatter: (datum: MetricPoint) => ({
      name: datum.metric,
      value: `${datum.value.toFixed(1)}${unit}`
    })
  }
});

const gasSeriesConfig = (data: Array<{ formattedTime: string; metric: string; value: number }>) => ({
  data,
  xField: 'formattedTime',
  yField: 'value',
  seriesField: 'metric',
  smooth: true,
  color: ['#13c2c2', '#faad14', '#f5222d', '#52c41a'],
  point: { size: 3, shape: 'circle' }
});

const EnvironmentData: React.FC<EnvironmentDataProps> = ({ manholes, realTimeDataMap }) => {
  const [, setTimeRange] = useState<[Date, Date]>(DEFAULT_RANGE);
  const [dataType, setDataType] = useState<DataType>('hourly');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabKey>('temperature');
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<EnvironmentSummary | null>(null);

  const areaOptions = useMemo(() => {
    return manholes.map((item) => ({
      label: item.location?.address || item.name,
      value: item.id
    }));
  }, [manholes]);

  useEffect(() => {
    if (selectedArea === 'all' || areaOptions.some((item) => item.value === selectedArea)) {
      return;
    }
    setSelectedArea('all');
  }, [areaOptions, selectedArea]);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const period = periodMap[dataType];
        const data = await fetchEnvironmentSummary(period);
        if (!cancelled) {
          setSummaryData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError('加载环境数据失败，请稍后重试');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, [dataType, reloadToken]);

  const temperatureData = useMemo(() => {
    if (!summaryData) return [];
    return summaryData.temperatureData.map((item, idx) => ({
      timestamp: item.time,
      formattedTime: formatTime(item.time, dataType, idx),
      value: item.value,
      metric: '温度 (°C)'
    }));
  }, [summaryData, dataType]);

  const humidityData = useMemo(() => {
    if (!summaryData) return [];
    return summaryData.humidityData.map((item, idx) => ({
      timestamp: item.time,
      formattedTime: formatTime(item.time, dataType, idx),
      value: item.value,
      metric: '湿度 (%)'
    }));
  }, [summaryData, dataType]);

  const gasRawData = useMemo(() => {
    if (!summaryData) return [];
    return summaryData.gasData.map((item, idx) => ({
      timestamp: item.time,
      formattedTime: formatTime(item.time, dataType, idx),
      ch4: item.ch4,
      co: item.co,
      h2s: item.h2s,
      o2: item.o2
    }));
  }, [summaryData, dataType]);

  const gasChartData = useMemo(() => {
    return gasRawData.flatMap((item) => [
      { formattedTime: item.formattedTime, metric: 'CH4', value: item.ch4 },
      { formattedTime: item.formattedTime, metric: 'CO', value: item.co },
      { formattedTime: item.formattedTime, metric: 'H2S', value: item.h2s },
      { formattedTime: item.formattedTime, metric: 'O2', value: item.o2 }
    ]);
  }, [gasRawData]);

  const latestRealTimeData = useMemo(() => {
    if (selectedArea !== 'all' && realTimeDataMap.has(selectedArea)) {
      return realTimeDataMap.get(selectedArea) || null;
    }
    return null;
  }, [realTimeDataMap, selectedArea]);

  const mergedTemperatureData = useMemo(() => {
    if (!latestRealTimeData || temperatureData.length === 0) {
      return temperatureData;
    }
    const next = [...temperatureData];
    next[next.length - 1] = {
      ...next[next.length - 1],
      value: Number(latestRealTimeData.temperature.toFixed(1))
    };
    return next;
  }, [latestRealTimeData, temperatureData]);

  const mergedHumidityData = useMemo(() => {
    if (!latestRealTimeData || humidityData.length === 0) {
      return humidityData;
    }
    const next = [...humidityData];
    next[next.length - 1] = {
      ...next[next.length - 1],
      value: Number(latestRealTimeData.humidity.toFixed(1))
    };
    return next;
  }, [humidityData, latestRealTimeData]);

  const mergedGasData = useMemo(() => {
    if (!latestRealTimeData?.gasConcentration || gasRawData.length === 0) {
      return gasRawData;
    }
    const next = [...gasRawData];
    next[next.length - 1] = {
      ...next[next.length - 1],
      ch4: Number(latestRealTimeData.gasConcentration.ch4.toFixed(1)),
      co: Number(latestRealTimeData.gasConcentration.co.toFixed(1)),
      h2s: Number(latestRealTimeData.gasConcentration.h2s.toFixed(2)),
      o2: Number(latestRealTimeData.gasConcentration.o2.toFixed(1))
    };
    return next;
  }, [gasRawData, latestRealTimeData]);

  const activeData = useMemo(() => {
    switch (activeTab) {
      case 'temperature':
        return mergedTemperatureData;
      case 'humidity':
        return mergedHumidityData;
      case 'gas':
        return gasChartData;
      default:
        return [];
    }
  }, [activeTab, mergedTemperatureData, mergedHumidityData, gasChartData]);

  const summaryCards = useMemo(() => {
    const lastTemp = temperatureData.length > 0 ? temperatureData[temperatureData.length - 1].value : 0;
    const lastHumidity = humidityData.length > 0 ? humidityData[humidityData.length - 1].value : 0;
    const lastGas = gasRawData.length > 0 ? gasRawData[gasRawData.length - 1] : null;

    const entries = Array.from(realTimeDataMap.values());
    const avgWaterLevel = entries.length > 0
      ? entries.reduce((sum, item) => sum + item.waterLevel, 0) / entries.length
      : 0;

    return [
      {
        title: '当前温度',
        value: latestRealTimeData?.temperature ?? lastTemp,
        suffix: '°C',
        color: '#ff7a45'
      },
      {
        title: '当前湿度',
        value: latestRealTimeData?.humidity ?? lastHumidity,
        suffix: '%',
        color: '#1890ff'
      },
      {
        title: '平均水位',
        value: avgWaterLevel,
        suffix: '%',
        color: '#13c2c2'
      },
      {
        title: 'CH4',
        value: latestRealTimeData?.gasConcentration?.ch4 ?? lastGas?.ch4 ?? 0,
        suffix: 'ppm',
        color: '#faad14'
      }
    ];
  }, [latestRealTimeData, temperatureData, humidityData, gasRawData, realTimeDataMap]);

  const handleReload = useCallback(() => {
    setReloadToken((previous) => previous + 1);
  }, []);

  const renderMetricTable = (data: MetricPoint[], unit: string) => (
    <Table
      rowKey="timestamp"
      pagination={{ pageSize: 8 }}
      dataSource={data}
      columns={[
        { title: '时间', dataIndex: 'formattedTime', key: 'formattedTime' },
        {
          title: '数值',
          dataIndex: 'value',
          key: 'value',
          render: (value: number) => `${value.toFixed(1)}${unit}`
        }
      ]}
    />
  );

  const renderGasTable = (data: Array<{ timestamp: string; formattedTime: string; ch4: number; co: number; h2s: number; o2: number }>) => (
    <Table
      rowKey="timestamp"
      pagination={{ pageSize: 8 }}
      dataSource={data}
      columns={[
        { title: '时间', dataIndex: 'formattedTime', key: 'formattedTime' },
        { title: 'CH4', dataIndex: 'ch4', key: 'ch4', render: (value: number) => `${value.toFixed(1)} ppm` },
        { title: 'CO', dataIndex: 'co', key: 'co', render: (value: number) => `${value.toFixed(1)} ppm` },
        { title: 'H2S', dataIndex: 'h2s', key: 'h2s', render: (value: number) => `${value.toFixed(2)} ppm` },
        { title: 'O2', dataIndex: 'o2', key: 'o2', render: (value: number) => `${value.toFixed(1)} %` }
      ]}
    />
  );

  const tabItems = [
    {
      key: 'temperature',
      label: '温度数据',
      children: (
        <>
          <Card>
            <Line {...metricSeriesConfig(mergedTemperatureData, '#ff7a45', '°C')} height={300} />
          </Card>
          {mergedTemperatureData.length > 0 && (
            <>
              <Card title="温度统计" style={{ marginTop: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col span={8}><Statistic title="平均温度" value={(mergedTemperatureData.reduce((sum, item) => sum + item.value, 0) / mergedTemperatureData.length).toFixed(1)} suffix="°C" /></Col>
                  <Col span={8}><Statistic title="最高温度" value={Math.max(...mergedTemperatureData.map((item) => item.value)).toFixed(1)} suffix="°C" valueStyle={{ color: '#f5222d' }} /></Col>
                  <Col span={8}><Statistic title="最低温度" value={Math.min(...mergedTemperatureData.map((item) => item.value)).toFixed(1)} suffix="°C" valueStyle={{ color: '#1890ff' }} /></Col>
                </Row>
              </Card>
              <Card title="温度记录" style={{ marginTop: 16 }}>{renderMetricTable(mergedTemperatureData, '°C')}</Card>
            </>
          )}
        </>
      )
    },
    {
      key: 'humidity',
      label: '湿度数据',
      children: (
        <>
          <Card>
            <Line {...metricSeriesConfig(mergedHumidityData, '#1890ff', '%')} height={300} />
          </Card>
          {mergedHumidityData.length > 0 && (
            <>
              <Card title="湿度统计" style={{ marginTop: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col span={8}><Statistic title="平均湿度" value={(mergedHumidityData.reduce((sum, item) => sum + item.value, 0) / mergedHumidityData.length).toFixed(1)} suffix="%" /></Col>
                  <Col span={8}><Statistic title="最高湿度" value={Math.max(...mergedHumidityData.map((item) => item.value)).toFixed(1)} suffix="%" valueStyle={{ color: '#1890ff' }} /></Col>
                  <Col span={8}><Statistic title="最低湿度" value={Math.min(...mergedHumidityData.map((item) => item.value)).toFixed(1)} suffix="%" valueStyle={{ color: '#faad14' }} /></Col>
                </Row>
              </Card>
              <Card title="湿度记录" style={{ marginTop: 16 }}>{renderMetricTable(mergedHumidityData, '%')}</Card>
            </>
          )}
        </>
      )
    },
    {
      key: 'gas',
      label: '气体浓度',
      children: (
        <>
          <Card>
            <Line {...gasSeriesConfig(gasChartData)} height={300} />
          </Card>
          {mergedGasData.length > 0 && (
            <>
              <Card title="气体安全概览" style={{ marginTop: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col span={6}>
                    <Statistic title="CH4 均值" value={(mergedGasData.reduce((sum, item) => sum + item.ch4, 0) / mergedGasData.length).toFixed(1)} suffix="ppm" />
                    <Progress percent={Math.min(100, ((mergedGasData.at(-1)?.ch4 ?? 0) / 10) * 100)} status={(mergedGasData.at(-1)?.ch4 ?? 0) > 8 ? 'exception' : 'normal'} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="CO 均值" value={(mergedGasData.reduce((sum, item) => sum + item.co, 0) / mergedGasData.length).toFixed(1)} suffix="ppm" />
                    <Progress percent={Math.min(100, ((mergedGasData.at(-1)?.co ?? 0) / 5) * 100)} status={(mergedGasData.at(-1)?.co ?? 0) > 4 ? 'exception' : 'normal'} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="H2S 均值" value={(mergedGasData.reduce((sum, item) => sum + item.h2s, 0) / mergedGasData.length).toFixed(2)} suffix="ppm" />
                    <Progress percent={Math.min(100, ((mergedGasData.at(-1)?.h2s ?? 0) / 1) * 100)} status={(mergedGasData.at(-1)?.h2s ?? 0) > 0.8 ? 'exception' : 'normal'} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="O2 均值" value={(mergedGasData.reduce((sum, item) => sum + item.o2, 0) / mergedGasData.length).toFixed(1)} suffix="%" />
                    <Tag color={(mergedGasData.at(-1)?.o2 ?? 20.9) < 19.5 ? 'error' : 'success'} style={{ marginTop: 12 }}>
                      {(mergedGasData.at(-1)?.o2 ?? 20.9) < 19.5 ? '偏低' : '正常'}
                    </Tag>
                  </Col>
                </Row>
              </Card>
              <Card title="气体记录" style={{ marginTop: 16 }}>{renderGasTable(mergedGasData)}</Card>
            </>
          )}
        </>
      )
    }
  ];

  return (
    <Card
      title={<><CloudOutlined /> 环境数据</>}
      extra={
        <Space wrap>
          <Select value={selectedArea} onChange={setSelectedArea} style={{ width: 180 }}>
            <Select.Option value="all">全部区域</Select.Option>
            {areaOptions.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
          <RangePicker
            onChange={(dates) => {
              if (dates?.[0] && dates?.[1]) {
                setTimeRange([dates[0].toDate(), dates[1].toDate()]);
              }
            }}
          />
          <Radio.Group value={dataType} onChange={(event) => setDataType(event.target.value)}>
            <Radio.Button value="hourly">小时</Radio.Button>
            <Radio.Button value="daily">天</Radio.Button>
            <Radio.Button value="weekly">周</Radio.Button>
          </Radio.Group>
          {!loading && <Tag color="processing">已加载 {activeData.length} 条</Tag>}
          <ReloadOutlined onClick={handleReload} style={{ cursor: 'pointer' }} />
          <DownloadOutlined />
        </Space>
      }
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {summaryCards.map((item) => (
          <Col span={6} key={item.title}>
            <Card size="small">
              <Statistic title={item.title} value={Number(typeof item.value === 'number' ? item.value.toFixed(1) : item.value)} suffix={item.suffix} valueStyle={{ color: item.color }} />
            </Card>
          </Col>
        ))}
      </Row>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" tip="加载环境数据中..." />
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Text type="danger">{error}</Text>
        </div>
      ) : activeData.length === 0 ? (
        <Empty description="暂无环境数据" />
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">
              数据口径: {selectedArea === 'all' ? '全区域聚合数据' : '单井盖环境趋势数据'}
            </Text>
          </div>
          <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as TabKey)} items={tabItems} />
        </>
      )}
    </Card>
  );
};

export default EnvironmentData;
