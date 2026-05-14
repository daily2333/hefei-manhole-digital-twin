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
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography
} from 'antd';
import { CloudOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import { ManholeInfo, ManholeRealTimeData } from '../../typings';

const { RangePicker } = DatePicker;
const { Text } = Typography;

type DataType = 'hourly' | 'daily' | 'weekly';
type TabKey = 'temperature' | 'humidity' | 'pressure' | 'gas' | 'rainfall';

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

type GasPoint = {
  timestamp: string;
  formattedTime: string;
  ch4: number;
  co: number;
  h2s: number;
  o2: number;
};

const DEFAULT_RANGE: [Date, Date] = [
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  new Date()
];

const deterministicRandom = (seed: number) => {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
};

const buildLabel = (date: Date, dataType: DataType, index: number) => {
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

const createMetricData = (
  metric: TabKey,
  range: [Date, Date],
  dataType: DataType,
  selectedArea: string,
  seedOffset = 0
): MetricPoint[] => {
  const [start, end] = range;
  const totalHours = Math.max(24, Math.floor((end.getTime() - start.getTime()) / (60 * 60 * 1000)));
  const step = dataType === 'hourly' ? 6 : dataType === 'daily' ? 24 : 24 * 7;
  const baseSeed = parseInt(selectedArea.replace(/\D/g, ''), 10) || 11;
  const points: MetricPoint[] = [];

  for (let hour = 0, index = 0; hour <= totalHours; hour += step, index += 1) {
    const date = new Date(start.getTime() + hour * 60 * 60 * 1000);
    const seed = baseSeed * 1000 + hour + seedOffset * 97;
    const dayCycle = Math.sin((date.getHours() - 6) * Math.PI / 12);
    const weatherCycle = Math.sin(hour / 12);
    const random = deterministicRandom(seed) - 0.5;

    let value = 0;
    let label = '';
    let unitMetric = '';

    switch (metric) {
      case 'temperature':
        value = 19 + dayCycle * 6 + weatherCycle * 3 + random * 2;
        label = '温度';
        unitMetric = '°C';
        break;
      case 'humidity':
        value = 62 - dayCycle * 10 + weatherCycle * 8 + random * 8;
        label = '湿度';
        unitMetric = '%';
        break;
      case 'pressure':
        value = 1012 + weatherCycle * 6 + random * 3;
        label = '气压';
        unitMetric = 'hPa';
        break;
      case 'rainfall':
        value = deterministicRandom(seed + 9) > 0.72 ? deterministicRandom(seed + 21) * 18 : 0;
        label = '降雨量';
        unitMetric = 'mm';
        break;
      default:
        break;
    }

    points.push({
      timestamp: date.toISOString(),
      formattedTime: buildLabel(date, dataType, index),
      value: Number(value.toFixed(metric === 'pressure' ? 1 : 2)),
      metric: `${label}${unitMetric ? ` (${unitMetric})` : ''}`
    });
  }

  return points;
};

const createGasData = (
  range: [Date, Date],
  dataType: DataType,
  selectedArea: string,
  seedOffset = 0
): GasPoint[] => {
  const [start, end] = range;
  const totalHours = Math.max(24, Math.floor((end.getTime() - start.getTime()) / (60 * 60 * 1000)));
  const step = dataType === 'hourly' ? 6 : dataType === 'daily' ? 24 : 24 * 7;
  const baseSeed = parseInt(selectedArea.replace(/\D/g, ''), 10) || 17;
  const points: GasPoint[] = [];

  for (let hour = 0, index = 0; hour <= totalHours; hour += step, index += 1) {
    const date = new Date(start.getTime() + hour * 60 * 60 * 1000);
    const seed = baseSeed * 2000 + hour + seedOffset * 131;
    const wave = Math.sin(hour / 10);

    points.push({
      timestamp: date.toISOString(),
      formattedTime: buildLabel(date, dataType, index),
      ch4: Number((4.5 + wave * 1.4 + deterministicRandom(seed) * 1.2).toFixed(1)),
      co: Number((1.8 + wave * 0.8 + deterministicRandom(seed + 1) * 0.8).toFixed(1)),
      h2s: Number((0.3 + wave * 0.12 + deterministicRandom(seed + 2) * 0.08).toFixed(2)),
      o2: Number((20.8 - wave * 0.18 + deterministicRandom(seed + 3) * 0.1).toFixed(1))
    });
  }

  return points;
};

const EnvironmentData: React.FC<EnvironmentDataProps> = ({ manholes, realTimeDataMap }) => {
  const [timeRange, setTimeRange] = useState<[Date, Date]>(DEFAULT_RANGE);
  const [dataType, setDataType] = useState<DataType>('hourly');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabKey>('temperature');
  const [reloadToken, setReloadToken] = useState(0);

  const areaOptions = useMemo(() => {
    return manholes.map((item) => ({
      label: item.location?.address || item.name,
      value: item.id
    }));
  }, [manholes]);

  const latestRealTimeData = useMemo(() => {
    if (selectedArea !== 'all' && realTimeDataMap.has(selectedArea)) {
      return realTimeDataMap.get(selectedArea) || null;
    }
    return null;
  }, [realTimeDataMap, selectedArea]);

  useEffect(() => {
    if (selectedArea === 'all' || areaOptions.some((item) => item.value === selectedArea)) {
      return;
    }

    setSelectedArea('all');
  }, [areaOptions, selectedArea]);

  const temperatureData = useMemo(
    () => createMetricData('temperature', timeRange, dataType, selectedArea, reloadToken),
    [dataType, reloadToken, selectedArea, timeRange]
  );

  const humidityData = useMemo(
    () => createMetricData('humidity', timeRange, dataType, selectedArea, reloadToken),
    [dataType, reloadToken, selectedArea, timeRange]
  );

  const pressureData = useMemo(
    () => createMetricData('pressure', timeRange, dataType, selectedArea, reloadToken),
    [dataType, reloadToken, selectedArea, timeRange]
  );

  const rainfallData = useMemo(
    () => createMetricData('rainfall', timeRange, dataType, selectedArea, reloadToken),
    [dataType, reloadToken, selectedArea, timeRange]
  );

  const gasData = useMemo(
    () => createGasData(timeRange, dataType, selectedArea, reloadToken),
    [dataType, reloadToken, selectedArea, timeRange]
  );

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
    if (!latestRealTimeData?.gasConcentration || gasData.length === 0) {
      return gasData;
    }

    const next = [...gasData];
    next[next.length - 1] = {
      ...next[next.length - 1],
      ch4: Number(latestRealTimeData.gasConcentration.ch4.toFixed(1)),
      co: Number(latestRealTimeData.gasConcentration.co.toFixed(1)),
      h2s: Number(latestRealTimeData.gasConcentration.h2s.toFixed(2)),
      o2: Number(latestRealTimeData.gasConcentration.o2.toFixed(1))
    };
    return next;
  }, [gasData, latestRealTimeData]);

  const activeData = useMemo(() => {
    switch (activeTab) {
      case 'temperature':
        return mergedTemperatureData;
      case 'humidity':
        return mergedHumidityData;
      case 'pressure':
        return pressureData;
      case 'rainfall':
        return rainfallData;
      case 'gas':
        return mergedGasData;
      default:
        return [];
    }
  }, [activeTab, mergedGasData, mergedHumidityData, mergedTemperatureData, pressureData, rainfallData]);

  const summaryCards = useMemo(() => {
    return [
      {
        title: '当前温度',
        value: latestRealTimeData?.temperature ?? (mergedTemperatureData.at(-1)?.value ?? 0),
        suffix: '°C',
        color: '#ff7a45'
      },
      {
        title: '当前湿度',
        value: latestRealTimeData?.humidity ?? (mergedHumidityData.at(-1)?.value ?? 0),
        suffix: '%',
        color: '#1890ff'
      },
      {
        title: '当前水位',
        value: latestRealTimeData?.waterLevel ?? 0,
        suffix: '%',
        color: '#13c2c2'
      },
      {
        title: 'CH4',
        value: latestRealTimeData?.gasConcentration?.ch4 ?? (mergedGasData.at(-1)?.ch4 ?? 0),
        suffix: 'ppm',
        color: '#faad14'
      }
    ];
  }, [latestRealTimeData, mergedGasData, mergedHumidityData, mergedTemperatureData]);

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

  const renderGasTable = (data: GasPoint[]) => (
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

  const gasChartData = useMemo(() => {
    return mergedGasData.flatMap((item) => ([
      { formattedTime: item.formattedTime, metric: 'CH4', value: item.ch4 },
      { formattedTime: item.formattedTime, metric: 'CO', value: item.co },
      { formattedTime: item.formattedTime, metric: 'H2S', value: item.h2s },
      { formattedTime: item.formattedTime, metric: 'O2', value: item.o2 }
    ]));
  }, [mergedGasData]);

  const rainfallRate = useMemo(() => {
    if (!rainfallData.length) {
      return 0;
    }

    return (rainfallData.filter((item) => item.value > 0).length / rainfallData.length) * 100;
  }, [rainfallData]);

  const tabItems = [
    {
      key: 'temperature',
      label: '温度数据',
      children: (
        <>
          <Card>
            <Line {...metricSeriesConfig(mergedTemperatureData, '#ff7a45', '°C')} height={300} />
          </Card>
          <Card title="温度统计" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}><Statistic title="平均温度" value={(mergedTemperatureData.reduce((sum, item) => sum + item.value, 0) / Math.max(1, mergedTemperatureData.length)).toFixed(1)} suffix="°C" /></Col>
              <Col span={8}><Statistic title="最高温度" value={Math.max(...mergedTemperatureData.map((item) => item.value)).toFixed(1)} suffix="°C" valueStyle={{ color: '#f5222d' }} /></Col>
              <Col span={8}><Statistic title="最低温度" value={Math.min(...mergedTemperatureData.map((item) => item.value)).toFixed(1)} suffix="°C" valueStyle={{ color: '#1890ff' }} /></Col>
            </Row>
          </Card>
          <Card title="温度记录" style={{ marginTop: 16 }}>{renderMetricTable(mergedTemperatureData, '°C')}</Card>
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
          <Card title="湿度统计" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}><Statistic title="平均湿度" value={(mergedHumidityData.reduce((sum, item) => sum + item.value, 0) / Math.max(1, mergedHumidityData.length)).toFixed(1)} suffix="%" /></Col>
              <Col span={8}><Statistic title="最高湿度" value={Math.max(...mergedHumidityData.map((item) => item.value)).toFixed(1)} suffix="%" valueStyle={{ color: '#1890ff' }} /></Col>
              <Col span={8}><Statistic title="最低湿度" value={Math.min(...mergedHumidityData.map((item) => item.value)).toFixed(1)} suffix="%" valueStyle={{ color: '#faad14' }} /></Col>
            </Row>
          </Card>
          <Card title="湿度记录" style={{ marginTop: 16 }}>{renderMetricTable(mergedHumidityData, '%')}</Card>
        </>
      )
    },
    {
      key: 'pressure',
      label: '气压数据',
      children: (
        <>
          <Card>
            <Line {...metricSeriesConfig(pressureData, '#722ed1', 'hPa')} height={300} />
          </Card>
          <Card title="气压统计" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}><Statistic title="平均气压" value={(pressureData.reduce((sum, item) => sum + item.value, 0) / Math.max(1, pressureData.length)).toFixed(1)} suffix="hPa" /></Col>
              <Col span={8}><Statistic title="最高气压" value={Math.max(...pressureData.map((item) => item.value)).toFixed(1)} suffix="hPa" /></Col>
              <Col span={8}><Statistic title="最低气压" value={Math.min(...pressureData.map((item) => item.value)).toFixed(1)} suffix="hPa" /></Col>
            </Row>
          </Card>
          <Card title="气压记录" style={{ marginTop: 16 }}>{renderMetricTable(pressureData, 'hPa')}</Card>
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
          <Card title="气体安全概览" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic title="CH4 均值" value={(mergedGasData.reduce((sum, item) => sum + item.ch4, 0) / Math.max(1, mergedGasData.length)).toFixed(1)} suffix="ppm" />
                <Progress percent={Math.min(100, ((mergedGasData.at(-1)?.ch4 ?? 0) / 10) * 100)} status={(mergedGasData.at(-1)?.ch4 ?? 0) > 8 ? 'exception' : 'normal'} />
              </Col>
              <Col span={6}>
                <Statistic title="CO 均值" value={(mergedGasData.reduce((sum, item) => sum + item.co, 0) / Math.max(1, mergedGasData.length)).toFixed(1)} suffix="ppm" />
                <Progress percent={Math.min(100, ((mergedGasData.at(-1)?.co ?? 0) / 5) * 100)} status={(mergedGasData.at(-1)?.co ?? 0) > 4 ? 'exception' : 'normal'} />
              </Col>
              <Col span={6}>
                <Statistic title="H2S 均值" value={(mergedGasData.reduce((sum, item) => sum + item.h2s, 0) / Math.max(1, mergedGasData.length)).toFixed(2)} suffix="ppm" />
                <Progress percent={Math.min(100, ((mergedGasData.at(-1)?.h2s ?? 0) / 1) * 100)} status={(mergedGasData.at(-1)?.h2s ?? 0) > 0.8 ? 'exception' : 'normal'} />
              </Col>
              <Col span={6}>
                <Statistic title="O2 均值" value={(mergedGasData.reduce((sum, item) => sum + item.o2, 0) / Math.max(1, mergedGasData.length)).toFixed(1)} suffix="%" />
                <Tag color={(mergedGasData.at(-1)?.o2 ?? 20.9) < 19.5 ? 'error' : 'success'} style={{ marginTop: 12 }}>
                  {(mergedGasData.at(-1)?.o2 ?? 20.9) < 19.5 ? '偏低' : '正常'}
                </Tag>
              </Col>
            </Row>
          </Card>
          <Card title="气体记录" style={{ marginTop: 16 }}>{renderGasTable(mergedGasData)}</Card>
        </>
      )
    },
    {
      key: 'rainfall',
      label: '降雨量',
      children: (
        <>
          <Card>
            <Line {...metricSeriesConfig(rainfallData, '#13c2c2', 'mm')} height={300} />
          </Card>
          <Card title="降雨统计" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={6}><Statistic title="累计雨量" value={rainfallData.reduce((sum, item) => sum + item.value, 0).toFixed(1)} suffix="mm" /></Col>
              <Col span={6}><Statistic title="峰值雨量" value={Math.max(...rainfallData.map((item) => item.value)).toFixed(1)} suffix="mm" /></Col>
              <Col span={6}><Statistic title="降雨天次" value={rainfallData.filter((item) => item.value > 0).length} suffix="次" /></Col>
              <Col span={6}><Statistic title="降雨频率" value={rainfallRate.toFixed(1)} suffix="%" /></Col>
            </Row>
          </Card>
          <Card title="降雨记录" style={{ marginTop: 16 }}>{renderMetricTable(rainfallData, 'mm')}</Card>
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
          <Tag color="processing">已加载 {activeData.length} 条</Tag>
          <ReloadOutlined onClick={handleReload} style={{ cursor: 'pointer' }} />
          <DownloadOutlined />
        </Space>
      }
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {summaryCards.map((item) => (
          <Col span={6} key={item.title}>
            <Card size="small">
              <Statistic title={item.title} value={Number(item.value.toFixed ? item.value.toFixed(1) : item.value)} suffix={item.suffix} valueStyle={{ color: item.color }} />
            </Card>
          </Col>
        ))}
      </Row>

      {activeData.length === 0 ? (
        <Empty description="暂无环境数据" />
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">
              数据口径: {selectedArea === 'all' ? '全区域聚合模拟数据' : '单井盖环境趋势数据'}
            </Text>
          </div>
          <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as TabKey)} items={tabItems} />
        </>
      )}
    </Card>
  );
};

export default EnvironmentData;
