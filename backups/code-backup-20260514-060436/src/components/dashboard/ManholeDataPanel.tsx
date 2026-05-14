import React from 'react';
import { Card, Descriptions, Badge, Row, Col, Progress, Statistic } from 'antd';
import { AreaChartOutlined, ThunderboltOutlined, WarningOutlined, ExperimentOutlined, WifiOutlined } from '@ant-design/icons';
import ReactEcharts from 'echarts-for-react';
import { ManholeInfo, ManholeRealTimeData, CoverStatus, ManholeStatus } from '../../typings';
import { formatDateTime, getStatusColor, formatWithUnit } from '../../utils';

interface ManholeDataPanelProps {
  manholeInfo: ManholeInfo;
  realTimeData: ManholeRealTimeData | null;
  historicalData?: { timestamp: string; value: number }[];
  dataType?: 'temperature' | 'humidity' | 'gasConcentration' | 'waterLevel' | 'batteryLevel';
}

/**
 * 井盖数据面板组件
 */
const ManholeDataPanel: React.FC<ManholeDataPanelProps> = ({
  manholeInfo,
  realTimeData,
  historicalData = [],
  dataType = 'temperature'
}) => {
  // 获取井盖状态的显示信息
  const getStatusBadge = (status: ManholeStatus) => {
    switch (status) {
      case ManholeStatus.Normal:
        return <Badge status="success" text="正常" />;
      case ManholeStatus.Warning:
        return <Badge status="warning" text="警告" />;
      case ManholeStatus.Alarm:
        return <Badge status="error" text="报警" />;
      case ManholeStatus.Maintenance:
        return <Badge status="processing" text="维护中" />;
      case ManholeStatus.Offline:
        return <Badge status="default" text="离线" />;
      default:
        return <Badge status="default" text="未知" />;
    }
  };

  // 获取井盖开关状态的显示信息
  const getCoverStatusBadge = (status?: CoverStatus) => {
    if (!status) return <Badge status="default" text="未知" />;
    
    switch (status) {
      case CoverStatus.Closed:
        return <Badge status="success" text="关闭" />;
      case CoverStatus.Open:
        return <Badge status="error" text="打开" />;
      case CoverStatus.PartialOpen:
        return <Badge status="warning" text="部分打开" />;
      case CoverStatus.Unknown:
      default:
        return <Badge status="default" text="未知" />;
    }
  };

  // 获取历史数据图表配置
  const getChartOptions = () => {
    const timestamps = historicalData.map(item => formatDateTime(item.timestamp, 'time'));
    const values = historicalData.map(item => item.value);
    
    let yAxisName = '温度(°C)';
    let seriesName = '温度';
    let color = ['#f5222d', '#ffd666'];
    
    switch (dataType) {
      case 'temperature':
        yAxisName = '温度(°C)';
        seriesName = '温度';
        color = ['#f5222d', '#ffd666'];
        break;
      case 'humidity':
        yAxisName = '湿度(%)';
        seriesName = '湿度';
        color = ['#1890ff', '#bae7ff'];
        break;
      case 'gasConcentration':
        yAxisName = '气体浓度(ppm)';
        seriesName = '气体浓度';
        color = ['#722ed1', '#d3adf7'];
        break;
      case 'waterLevel':
        yAxisName = '水位(mm)';
        seriesName = '水位';
        color = ['#13c2c2', '#87e8de'];
        break;
      case 'batteryLevel':
        yAxisName = '电池电量(%)';
        seriesName = '电池电量';
        color = ['#52c41a', '#b7eb8f'];
        break;
    }
    
    return {
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timestamps
      },
      yAxis: {
        type: 'value',
        name: yAxisName
      },
      series: [
        {
          name: seriesName,
          type: 'line',
          data: values,
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: color[0]
                },
                {
                  offset: 1,
                  color: color[1]
                }
              ]
            }
          }
        }
      ]
    };
  };

  return (
    <Card 
      title={manholeInfo.name} 
      variant="borderless"
      style={{ height: '100%' }}
    >
      <Descriptions
        bordered
        size="small"
        column={2}
        title="基本信息"
      >
        <Descriptions.Item label="井盖编号">{manholeInfo.id}</Descriptions.Item>
        <Descriptions.Item label="安装时间">{formatDateTime(manholeInfo.installationDate, 'date')}</Descriptions.Item>
        <Descriptions.Item label="位置">{manholeInfo.location.address}</Descriptions.Item>
        <Descriptions.Item label="经纬度">
          {manholeInfo.location.longitude.toFixed(4)}, {manholeInfo.location.latitude.toFixed(4)}
        </Descriptions.Item>
        <Descriptions.Item label="型号">{manholeInfo.model}</Descriptions.Item>
        <Descriptions.Item label="材料">{manholeInfo.material}</Descriptions.Item>
        <Descriptions.Item label="状态">{getStatusBadge(manholeInfo.status)}</Descriptions.Item>
        <Descriptions.Item label="盖子状态">
          {getCoverStatusBadge(realTimeData?.coverStatus)}
        </Descriptions.Item>
      </Descriptions>
      
      <Card 
        title="实时数据" 
        style={{ marginTop: 16 }}
        styles={{ body: { padding: '12px' } }}
        size="small"
      >
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card variant="borderless">
              <Statistic
                title="温度"
                value={realTimeData?.temperature || 0}
                precision={1}
                valueStyle={{ color: getStatusColor(realTimeData?.temperature || 0, { warning: 35, error: 50 }) }}
                prefix={<ExperimentOutlined />}
                suffix="°C"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card variant="borderless">
              <Statistic
                title="湿度"
                value={realTimeData?.humidity || 0}
                precision={1}
                valueStyle={{ color: getStatusColor(realTimeData?.humidity || 0, { warning: 75, error: 90 }) }}
                prefix={<AreaChartOutlined />}
                suffix="%"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card variant="borderless">
              <Statistic
                title="气体浓度"
                value={realTimeData?.gasConcentration.ch4 || 0}
                precision={1}
                valueStyle={{ color: getStatusColor(realTimeData?.gasConcentration.ch4 || 0, { warning: 80, error: 120 }) }}
                prefix={<WarningOutlined />}
                suffix="ppm"
              />
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Card variant="borderless" title="电池电量">
              <Progress
                type="dashboard"
                percent={realTimeData?.batteryLevel || 0}
                status={
                  (realTimeData?.batteryLevel || 0) < 20
                    ? 'exception'
                    : (realTimeData?.batteryLevel || 0) < 50
                    ? 'normal'
                    : 'success'
                }
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card variant="borderless" title="信号强度">
              <Progress
                type="dashboard"
                percent={realTimeData?.signalStrength || 0}
                status={
                  (realTimeData?.signalStrength || 0) < 20
                    ? 'exception'
                    : (realTimeData?.signalStrength || 0) < 50
                    ? 'normal'
                    : 'success'
                }
                format={percent => (
                  <>
                    <WifiOutlined /> {percent}%
                  </>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Card>
      
      <Card 
        title={`历史${dataType === 'temperature' ? '温度' : 
               dataType === 'humidity' ? '湿度' : 
               dataType === 'gasConcentration' ? '气体浓度' : 
               dataType === 'waterLevel' ? '水位' : '电池电量'}数据`} 
        style={{ marginTop: 16 }}
        size="small"
      >
        <ReactEcharts
          option={getChartOptions()}
          style={{ height: '250px' }}
        />
      </Card>
    </Card>
  );
};

export default ManholeDataPanel; 
