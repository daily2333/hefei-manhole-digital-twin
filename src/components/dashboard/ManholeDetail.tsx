import React, { memo } from 'react';
import { Card, Divider } from 'antd';
import { ManholeInfo, ManholeRealTimeData, CoverStatus } from '../../typings';
import { formatDateTime } from '../../utils';
import { ErrorBoundary } from '../layout/ErrorBoundary';

interface ManholeDetailProps {
  selectedManhole: ManholeInfo | null;
  realTimeData: ManholeRealTimeData | null;
}

// 使用React.memo包装组件，并增强自定义比较函数以避免不必要的重渲染
const ManholeDetail: React.FC<ManholeDetailProps> = memo(({
  selectedManhole,
  realTimeData
}) => {
  if (!selectedManhole) {
    return (
      <Card className="glass-card" title="井盖详情">
        <div className="placeholder-message">请选择一个井盖查看详情</div>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <Card className="glass-card" title="井盖详情">
        <div className="manhole-detail-panel">
          <div className="details-panel">
            <h3>基本信息</h3>
            <div className="detail-item">
              <span className="detail-label">井盖ID</span>
              <span className="detail-value">{selectedManhole.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">位置</span>
              <span className="detail-value">{selectedManhole.location.address}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">状态</span>
              <span className={`detail-value status-${selectedManhole.status.toLowerCase()}`}>
                {selectedManhole.status}
              </span>
            </div>
          </div>
          
          {realTimeData && (
            <div className="realtime-data">
              <Divider style={{ margin: '12px 0' }}/>
              <h3>实时数据</h3>
              <div className="detail-item">
                <span className="detail-label">井盖状态</span>
                <span className={`detail-value status-${realTimeData.coverStatus.toLowerCase()}`}>
                  {realTimeData.coverStatus === CoverStatus.Closed ? '关闭' : 
                   realTimeData.coverStatus === CoverStatus.PartialOpen ? '部分开启' : '开启'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">温度</span>
                <span className="detail-value">{realTimeData.temperature.toFixed(1)}°C</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">湿度</span>
                <span className="detail-value">{realTimeData.humidity.toFixed(1)}%</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">气体浓度</span>
                <span className="detail-value">CH4: {realTimeData.gasConcentration.ch4.toFixed(1)} ppm</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">水位</span>
                <span className="detail-value">{realTimeData.waterLevel.toFixed(1)} mm</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">电池电量</span>
                <span className="detail-value">{realTimeData.batteryLevel}%</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">信号强度</span>
                <span className="detail-value">{realTimeData.signalStrength} dBm</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">上次更新</span>
                <span className="detail-value">{formatDateTime(realTimeData.timestamp)}</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </ErrorBoundary>
  );
}, (prevProps, nextProps) => {
  // 扩展的自定义比较函数，更精细地比较实际内容，避免不必要的重渲染
  
  // 比较 selectedManhole
  const prevManhole = prevProps.selectedManhole;
  const nextManhole = nextProps.selectedManhole;
  
  // 如果两个都是 null 或 undefined，则视为相等
  if (!prevManhole && !nextManhole) return true;
  
  // 如果其中一个是 null 或 undefined，另一个不是，则视为不等
  if (!prevManhole || !nextManhole) return false;
  
  // 比较关键属性
  const isManholeEqual = prevManhole.id === nextManhole.id && 
                         prevManhole.status === nextManhole.status;
  
  if (!isManholeEqual) return false;
  
  // 比较 realTimeData
  const prevData = prevProps.realTimeData;
  const nextData = nextProps.realTimeData;
  
  // 如果两个都是 null 或 undefined，则视为相等
  if (!prevData && !nextData) return true;
  
  // 如果其中一个是 null 或 undefined，另一个不是，则视为不等
  if (!prevData || !nextData) return false;
  
  // 只比较重要的属性，减少不必要的渲染
  return prevData.id === nextData.id &&
         prevData.timestamp === nextData.timestamp &&
         prevData.coverStatus === nextData.coverStatus &&
         prevData.temperature === nextData.temperature &&
         prevData.humidity === nextData.humidity &&
         prevData.waterLevel === nextData.waterLevel;
});

export default ManholeDetail; 