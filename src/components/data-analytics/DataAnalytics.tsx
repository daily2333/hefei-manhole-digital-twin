import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Row, Col, Select, Button, DatePicker, Space,
  Statistic, Tabs, Divider, message
} from 'antd';
import {
  BarChartOutlined, LineChartOutlined, PieChartOutlined,
  DownloadOutlined, ReloadOutlined, InfoCircleOutlined, DotChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ManholeInfo, ManholeAlarm } from '../../typings';
import Chart from '../common/Chart';
import type { ChartData } from '../common/Chart';
import { fetchAnalyticsData } from '../../services/api/analyticsService';
import type { AnalyticsData } from '../../services/api/analyticsService';
import { fetchAlarms, fetchManholes } from '../../services/api';

const { Option } = Select;
const { RangePicker } = DatePicker;

enum AnalysisType {
  TREND = 'trend',
  DISTRIBUTION = 'distribution',
  CORRELATION = 'correlation',
  ANOMALY = 'anomaly',
  COMPARISON = 'comparison'
}

const DATA_TYPES = [
  { value: 'alarm', label: '告警数据' },
  { value: 'status', label: '状态数据' },
  { value: 'battery', label: '电池数据' },
  { value: 'water', label: '水位数据' },
  { value: 'gas', label: '气体浓度数据' },
  { value: 'temperature', label: '温度数据' }
];

interface DataAnalyticsProps {
  manholes?: ManholeInfo[];
  alarms?: ManholeAlarm[];
}

const FIELD_LABELS: Record<string, string> = {
  temperature: '温度(°C)',
  humidity: '湿度(%)',
  waterLevel: '水位(cm)',
  gasConcentration: '气体浓度(ppm)',
  batteryLevel: '电池(%)'
};

const getNumericValues = (data: ChartData): number[] => {
  if (data.series?.length) {
    return data.series.flatMap((s: any) => {
      if (Array.isArray(s.data)) {
        return s.data
          .map((v: any) => (v && typeof v === 'object' ? v.value : v))
          .filter((v: any) => typeof v === 'number');
      }
      return [];
    });
  }
  if (data.points?.length) {
    return data.points.map((p: any) => p.value).filter((v: any) => typeof v === 'number');
  }
  return [];
};

const buildTrendChartData = (
  apiData: AnalyticsData, dataType: string, alarms: ManholeAlarm[]
): ChartData => {
  const labels: Record<string, string> = {
    alarm: '告警', status: '状态', battery: '电池',
    water: '水位', gas: '气体浓度', temperature: '温度'
  };
  const label = labels[dataType] || '数据';

  if (dataType === 'alarm') {
    const countByDate: Record<string, number> = {};
    alarms.forEach(a => {
      const d = dayjs(a.time).format('YYYY-MM-DD');
      countByDate[d] = (countByDate[d] || 0) + 1;
    });
    const entries = Object.entries(countByDate).sort(([a], [b]) => a.localeCompare(b));
    return {
      title: '告警趋势分析',
      xAxis: entries.map(([d]) => d),
      series: [{
        name: '告警数', type: 'line',
        data: entries.map(([, v]) => v),
        smooth: true, areaStyle: { opacity: 0.2 }
      }]
    };
  }

  if (dataType === 'status') {
    const { trendData } = apiData;
    return {
      title: '状态数据趋势分析',
      xAxis: trendData.map(d => d.date),
      legend: ['温度', '湿度', '水位', '气体浓度', '电池'],
      series: [
        { name: '温度', type: 'line', data: trendData.map(d => d.temperature), smooth: true },
        { name: '湿度', type: 'line', data: trendData.map(d => d.humidity), smooth: true },
        { name: '水位', type: 'line', data: trendData.map(d => d.waterLevel), smooth: true },
        { name: '气体浓度', type: 'line', data: trendData.map(d => d.gasConcentration), smooth: true },
        { name: '电池', type: 'line', data: trendData.map(d => d.batteryLevel), smooth: true },
      ]
    };
  }

  const fieldMap: Record<string, string> = {
    temperature: 'temperature', water: 'waterLevel',
    gas: 'gasConcentration', battery: 'batteryLevel',
  };
  const field = fieldMap[dataType];
  if (field && apiData.trendData.length > 0) {
    return {
      title: `${label}趋势分析`,
      xAxis: apiData.trendData.map(d => d.date),
      series: [{
        name: FIELD_LABELS[field] || label, type: 'line',
        data: apiData.trendData.map(d => d[field as keyof typeof d] as number),
        smooth: true, areaStyle: { opacity: 0.2 }
      }]
    };
  }

  return { title: `${label}趋势分析`, series: [] };
};

const buildDistributionChartData = (
  apiData: AnalyticsData, dataType: string,
  alarms: ManholeAlarm[], manholes: ManholeInfo[]
): ChartData => {
  const labels: Record<string, string> = {
    alarm: '告警', status: '状态', battery: '电池',
    water: '水位', gas: '气体浓度', temperature: '温度'
  };
  const label = labels[dataType] || '数据';

  if (dataType === 'alarm') {
    const manholeMap = new Map(manholes.map(m => [m.id, m]));
    const countByDistrict: Record<string, number> = {};
    alarms.forEach(a => {
      const m = manholeMap.get(a.manholeId);
      const district = m?.location?.district || '未知';
      countByDistrict[district] = (countByDistrict[district] || 0) + 1;
    });
    return {
      title: '告警区域分布',
      points: Object.entries(countByDistrict).map(([name, value]) => ({ name, value }))
    };
  }

  const fieldMap: Record<string, string> = {
    temperature: 'temperature', water: 'waterLevel', gas: 'gasConcentration',
  };
  const field = fieldMap[dataType];

  if (field && apiData.distributionData.length > 0) {
    return {
      title: `${label}区域分布`,
      points: apiData.distributionData.map(d => ({
        name: d.area, value: d[field as keyof typeof d] as number
      }))
    };
  }

  if (apiData.distributionData.length > 0) {
    return {
      title: `${label}区域分布`,
      legend: ['温度', '湿度', '水位', '气体浓度'],
      series: [
        { name: '温度', type: 'bar', data: apiData.distributionData.map(d => d.temperature) },
        { name: '湿度', type: 'bar', data: apiData.distributionData.map(d => d.humidity) },
        { name: '水位', type: 'bar', data: apiData.distributionData.map(d => d.waterLevel) },
        { name: '气体浓度', type: 'bar', data: apiData.distributionData.map(d => d.gasConcentration) },
      ]
    };
  }

  return { title: `${label}区域分布`, points: [] };
};

const buildCorrelationChartData = (apiData: AnalyticsData): ChartData => ({
  title: '指标相关性分析',
  xAxis: apiData.correlationData.map(d => `${d.metric1} vs ${d.metric2}`),
  series: [{
    name: '相关系数', type: 'bar',
    data: apiData.correlationData.map(d => ({
      value: parseFloat(d.coefficient.toFixed(2)),
      itemStyle: { color: d.coefficient >= 0 ? '#52c41a' : '#f5222d' }
    }))
  }]
});

const buildAnomalyChartData = (apiData: AnalyticsData): ChartData => {
  const { anomalyData } = apiData;
  return {
    title: '异常检测分析',
    xAxis: anomalyData.map(d => d.date),
    series: [{
      name: '数据值', type: 'line',
      data: anomalyData.map(d => d.value),
      smooth: true,
      markPoint: {
        data: anomalyData.filter(d => d.isAnomaly).map(d => ({
          name: '异常点', value: d.value, xAxis: d.date, yAxis: d.value,
          itemStyle: { color: '#ff4d4f' }
        }))
      }
    }]
  };
};

const buildComparisonChartData = (apiData: AnalyticsData): ChartData => {
  const { comparisonData } = apiData;
  if (!comparisonData.length) return { title: '同期对比分析', series: [] };
  const primaryMetric = comparisonData[0]?.metric || '';
  const areas = Array.from(new Set(comparisonData.map(d => d.area)));
  return {
    title: '同期对比分析',
    xAxis: areas,
    legend: ['当前值', '前值'],
    series: [
      {
        name: '当前值', type: 'bar',
        data: areas.map(area => {
          const item = comparisonData.find(d => d.area === area && d.metric === primaryMetric);
          return item?.current || 0;
        }),
        itemStyle: { borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '前值', type: 'bar',
        data: areas.map(area => {
          const item = comparisonData.find(d => d.area === area && d.metric === primaryMetric);
          return item?.previous || 0;
        }),
        itemStyle: { borderRadius: [4, 4, 0, 0] }
      }
    ]
  };
};

const buildChartData = (
  apiData: AnalyticsData, analysisType: AnalysisType, dataType: string,
  alarms: ManholeAlarm[], manholes: ManholeInfo[]
): ChartData => {
  switch (analysisType) {
    case AnalysisType.TREND:
      return buildTrendChartData(apiData, dataType, alarms);
    case AnalysisType.DISTRIBUTION:
      return buildDistributionChartData(apiData, dataType, alarms, manholes);
    case AnalysisType.CORRELATION:
      return buildCorrelationChartData(apiData);
    case AnalysisType.ANOMALY:
      return buildAnomalyChartData(apiData);
    case AnalysisType.COMPARISON:
      return buildComparisonChartData(apiData);
    default:
      return { title: '', series: [] };
  }
};

const DataAnalytics: React.FC<DataAnalyticsProps> = () => {
  const [loading, setLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState<AnalysisType>(AnalysisType.TREND);
  const [dataType, setDataType] = useState<string>('alarm');
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    new Date()
  ]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chartData, setChartData] = useState<ChartData>({ title: '', points: [] });
  const [apiData, setApiData] = useState<AnalyticsData | null>(null);
  const [fetchedAlarms, setFetchedAlarms] = useState<ManholeAlarm[]>([]);
  const [fetchedManholes, setFetchedManholes] = useState<ManholeInfo[]>([]);

  const days = useMemo(() => {
    const diff = dateRange[1].getTime() - dateRange[0].getTime();
    return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  }, [dateRange]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [analytics, alarmList, manholeList] = await Promise.all([
          fetchAnalyticsData(dataType, days),
          fetchAlarms(),
          fetchManholes()
        ]);
        if (cancelled) return;
        setApiData(analytics);
        setFetchedAlarms(alarmList);
        setFetchedManholes(manholeList);
      } catch {
        if (!cancelled) message.error('数据加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [dataType, days, refreshKey]);

  useEffect(() => {
    if (!apiData) return;
    setChartData(buildChartData(apiData, analysisType, dataType, fetchedAlarms, fetchedManholes));
  }, [apiData, analysisType, dataType, fetchedAlarms, fetchedManholes]);

  const getDataTypeLabel = (type: string): string => {
    const map: Record<string, string> = {
      alarm: '告警', status: '状态', battery: '电池',
      water: '水位', gas: '气体浓度', temperature: '温度'
    };
    return map[type] || '数据';
  };

  const handleAnalysisTypeChange = (type: string) => setAnalysisType(type as AnalysisType);
  const handleDataTypeChange = (type: string) => setDataType(type);
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setDateRange([dates[0].toDate(), dates[1].toDate()]);
    }
  };
  const handleExport = () => message.info('导出功能开发中');
  const handleRefresh = () => setRefreshKey(k => k + 1);

  const stats = useMemo(() => {
    if (!apiData) return {};
    const vals = getNumericValues(chartData);
    const count = vals.length;
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = count > 0 ? (sum / count).toFixed(2) : '0';
    const max = count > 0 ? Math.max(...vals).toFixed(2) : '0';
    const min = count > 0 ? Math.min(...vals).toFixed(2) : '0';

    switch (analysisType) {
      case AnalysisType.TREND:
        return { count, average: avg, max, min };
      case AnalysisType.DISTRIBUTION:
        return { count, total: sum, average: avg, max };
      case AnalysisType.CORRELATION: {
        const positive = vals.filter(v => v > 0).length;
        const negative = vals.filter(v => v < 0).length;
        return { count, positive, negative, neutral: count - positive - negative };
      }
      case AnalysisType.ANOMALY: {
        const anomalyCount = apiData?.anomalyData.filter(d => d.isAnomaly).length || 0;
        return {
          count,
          anomalyCount,
          anomalyRate: count > 0 ? ((anomalyCount / count) * 100).toFixed(2) : '0'
        };
      }
      case AnalysisType.COMPARISON: {
        const uniqueAreas = apiData?.comparisonData ? Array.from(new Set(apiData.comparisonData.map(d => d.area))).length : 0;
        const uniqueMetrics = apiData?.comparisonData ? Array.from(new Set(apiData.comparisonData.map(d => d.metric))).length : 0;
        return { count: uniqueAreas, metrics: uniqueMetrics };
      }
      default:
        return {};
    }
  }, [apiData, analysisType, chartData]);

  return (
    <div className="data-analytics-container">
      <Card
        title={<><BarChartOutlined /> 数据分析</>}
        extra={
          <Space>
            <Select
              value={dataType}
              onChange={handleDataTypeChange}
              style={{ width: 150 }}
            >
              {DATA_TYPES.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>

            <RangePicker
              onChange={handleDateRangeChange}
              allowClear={false}
            />

            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              刷新
            </Button>

            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={analysisType}
          onChange={handleAnalysisTypeChange}
          items={[
            {
              label: <span><LineChartOutlined /> 趋势分析</span>,
              key: AnalysisType.TREND,
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={18}>
                    <Card title={chartData.title} bodyStyle={{ height: 400 }}>
                      <Chart type="line" data={chartData} height={350} loading={loading} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card title="数据摘要" bodyStyle={{ height: 400, overflow: 'auto' }}>
                      <Statistic title="数据点数量" value={(stats as any).count || 0} suffix="个" />
                      <Divider style={{ margin: '12px 0' }} />
                      <Statistic title="平均值" value={(stats as any).average || 0} />
                      <Divider style={{ margin: '12px 0' }} />
                      <Statistic title="最大值" value={(stats as any).max || 0} valueStyle={{ color: '#cf1322' }} />
                      <Divider style={{ margin: '12px 0' }} />
                      <Statistic title="最小值" value={(stats as any).min || 0} valueStyle={{ color: '#3f8600' }} />
                      <Divider style={{ margin: '12px 0' }} />
                      <p><InfoCircleOutlined /> 趋势分析展示了{getDataTypeLabel(dataType)}数据随时间的变化趋势</p>
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              label: <span><PieChartOutlined /> 分布分析</span>,
              key: AnalysisType.DISTRIBUTION,
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={18}>
                    <Card title={chartData.title} bodyStyle={{ height: 400 }}>
                      <Chart type="bar" data={chartData} height={350} loading={loading} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card title="分布摘要" bodyStyle={{ height: 400, overflow: 'auto' }}>
                      <Statistic title="区域数量" value={(stats as any).count || 0} suffix="个" />
                      <Divider style={{ margin: '12px 0' }} />
                      <Statistic title={`总${getDataTypeLabel(dataType)}量`} value={(stats as any).total || 0} />
                      <Divider style={{ margin: '12px 0' }} />
                      <Statistic title="平均值" value={(stats as any).average || 0} />
                      <Divider style={{ margin: '12px 0' }} />
                      <Statistic title="最大值" value={(stats as any).max || 0} valueStyle={{ color: '#cf1322' }} />
                      <Divider style={{ margin: '12px 0' }} />
                      <p><InfoCircleOutlined /> 分布分析展示了不同区域的{getDataTypeLabel(dataType)}数据分布情况</p>
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              label: <span><DotChartOutlined /> 相关性分析</span>,
              key: AnalysisType.CORRELATION,
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={18}>
                    <Card title={chartData.title} bodyStyle={{ height: 400 }}>
                      <Chart type="bar" data={chartData} height={350} loading={loading} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card title="相关性摘要" bodyStyle={{ height: 400, overflow: 'auto' }}>
                      <Statistic title="指标数量" value={(stats as any).count || 0} suffix="个" />
                      <Divider style={{ margin: '12px 0' }} />
                      <Statistic title="正相关" value={(stats as any).positive || 0} suffix="个" valueStyle={{ color: '#3f8600' }} />
                      <Divider style={{ margin: '12px 0' }} />
                      <Statistic title="负相关" value={(stats as any).negative || 0} suffix="个" valueStyle={{ color: '#cf1322' }} />
                      <Divider style={{ margin: '12px 0' }} />
                      <Statistic title="无明显相关" value={(stats as any).neutral || 0} suffix="个" />
                      <Divider style={{ margin: '12px 0' }} />
                      <p><InfoCircleOutlined /> 相关性分析展示了{getDataTypeLabel(dataType)}数据与其他指标的相关性</p>
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              label: <span><LineChartOutlined /> 异常检测</span>,
              key: AnalysisType.ANOMALY,
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={18}>
                    <Card title={chartData.title} bodyStyle={{ height: 400 }}>
                      <Chart type="line" data={chartData} height={350} loading={loading} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card title="异常检测摘要" bodyStyle={{ height: 400, overflow: 'auto' }}>
                      <Statistic title="数据点数量" value={(stats as any).count || 0} suffix="个" />
                      <Divider style={{ margin: '12px 0' }} />
                      <Statistic title="异常点数量" value={(stats as any).anomalyCount || 0} suffix="个" valueStyle={{ color: '#cf1322' }} />
                      <Divider style={{ margin: '12px 0' }} />
                      <Statistic title="异常率" value={(stats as any).anomalyRate || 0} suffix="%" />
                      <Divider style={{ margin: '12px 0' }} />
                      <p><InfoCircleOutlined /> 异常检测分析展示了{getDataTypeLabel(dataType)}数据中的异常点</p>
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              label: <span><BarChartOutlined /> 对比分析</span>,
              key: AnalysisType.COMPARISON,
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={18}>
                    <Card title={chartData.title} bodyStyle={{ height: 400 }}>
                      <Chart type="bar" data={chartData} height={350} loading={loading} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card title="对比摘要" bodyStyle={{ height: 400, overflow: 'auto' }}>
                      <Statistic title="区域数量" value={(stats as any).count || 0} suffix="个" />
                      <Divider style={{ margin: '12px 0' }} />
                      <Statistic title="指标数量" value={(stats as any).metrics || 0} suffix="个" />
                      <Divider style={{ margin: '12px 0' }} />
                      {apiData?.comparisonData && Array.from(new Set(apiData.comparisonData.map(d => d.metric))).map((metric, i) => {
                        const values = apiData.comparisonData.filter(d => d.metric === metric);
                        const avg = (values.reduce((s, v) => s + v.current, 0) / values.length).toFixed(2);
                        return (
                          <React.Fragment key={i}>
                            <Statistic title={`${metric}平均值`} value={avg} />
                            <Divider style={{ margin: '12px 0' }} />
                          </React.Fragment>
                        );
                      })}
                      <p><InfoCircleOutlined /> 对比分析展示了不同区域{getDataTypeLabel(dataType)}数据的对比情况</p>
                    </Card>
                  </Col>
                </Row>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default DataAnalytics;
