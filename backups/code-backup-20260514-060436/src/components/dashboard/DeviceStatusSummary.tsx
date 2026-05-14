import React, { memo, useMemo } from 'react';
import { Card, Progress, Tooltip } from 'antd';
import { ManholeInfo, ManholeStatus } from '../../typings';
import { SafetyOutlined } from '@ant-design/icons';

interface DeviceStatusSummaryProps {
  manholes: ManholeInfo[];
}

/**
 * 设备状态摘要组件
 * 显示各种状态的设备数量统计
 */
const DeviceStatusSummary: React.FC<DeviceStatusSummaryProps> = memo(({ manholes }) => {
  // 使用useMemo缓存设备状态计算结果，避免不必要的重复计算
  const deviceStats = useMemo(() => {
    const totalDevices = manholes.length;
    const normalCount = manholes.filter(m => m.status === ManholeStatus.Normal).length;
    const warningCount = manholes.filter(m => m.status === ManholeStatus.Warning).length;
    const alarmCount = manholes.filter(m => m.status === ManholeStatus.Alarm).length;
    const maintenanceCount = manholes.filter(m => m.status === ManholeStatus.Maintenance).length;
    const offlineCount = manholes.filter(m => m.status === ManholeStatus.Offline).length;
    
    // 计算百分比
    const normalPercent = totalDevices ? Math.round((normalCount / totalDevices) * 100) : 0;
    const warningPercent = totalDevices ? Math.round((warningCount / totalDevices) * 100) : 0;
    const alarmPercent = totalDevices ? Math.round((alarmCount / totalDevices) * 100) : 0;
    const maintenancePercent = totalDevices ? Math.round((maintenanceCount / totalDevices) * 100) : 0;
    const offlinePercent = totalDevices ? Math.round((offlineCount / totalDevices) * 100) : 0;
    
    // 计算在线设备数
    const onlineDevices = totalDevices - offlineCount;
    const onlinePercent = totalDevices ? Math.round((onlineDevices / totalDevices) * 100) : 0;
    
    return {
      totalDevices,
      normalCount,
      warningCount,
      alarmCount,
      maintenanceCount,
      offlineCount,
      onlineDevices,
      normalPercent,
      warningPercent,
      alarmPercent,
      maintenancePercent,
      offlinePercent,
      onlinePercent
    };
  }, [manholes]); // 只在manholes变化时重新计算
  
  return (
    <Card 
      title={
        <div className="card-header-with-icon">
          <SafetyOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
          <span>设备状态</span>
        </div>
      } 
      className="glass-card"
      variant="borderless"
    >
      <div className="device-summary">
        <div className="main-status">
          <div className="circle-progress">
            <Tooltip title="在线率">
              <Progress 
                type="circle" 
                percent={deviceStats.onlinePercent} 
                format={() => `${deviceStats.onlineDevices}/${deviceStats.totalDevices}`} 
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                width={120}
                status="normal"
              />
            </Tooltip>
          </div>
          <div className="status-text">
            在线率: {deviceStats.onlinePercent}%
          </div>
        </div>
        
        <div className="status-details">
          <div className="status-row">
            <div className="status-label">正常</div>
            <div className="status-bar">
              <Progress 
                percent={deviceStats.normalPercent} 
                strokeColor="#52c41a" 
                showInfo={false}
                status="active"
              />
            </div>
            <div className="status-count">{deviceStats.normalCount}</div>
          </div>
          
          <div className="status-row">
            <div className="status-label">警告</div>
            <div className="status-bar">
              <Progress 
                percent={deviceStats.warningPercent} 
                strokeColor="#faad14" 
                showInfo={false}
                status="active"
              />
            </div>
            <div className="status-count">{deviceStats.warningCount}</div>
          </div>
          
          <div className="status-row">
            <div className="status-label">报警</div>
            <div className="status-bar">
              <Progress 
                percent={deviceStats.alarmPercent} 
                strokeColor="#ff4d4f" 
                showInfo={false}
                status="active"
              />
            </div>
            <div className="status-count">{deviceStats.alarmCount}</div>
          </div>
          
          <div className="status-row">
            <div className="status-label">维护</div>
            <div className="status-bar">
              <Progress 
                percent={deviceStats.maintenancePercent} 
                strokeColor="#1890ff" 
                showInfo={false}
                status="active"
              />
            </div>
            <div className="status-count">{deviceStats.maintenanceCount}</div>
          </div>
          
          <div className="status-row">
            <div className="status-label">离线</div>
            <div className="status-bar">
              <Progress 
                percent={deviceStats.offlinePercent} 
                strokeColor="#8c8c8c" 
                showInfo={false}
                status="active"
              />
            </div>
            <div className="status-count">{deviceStats.offlineCount}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在设备数量或状态变化时重新渲染
  if (prevProps.manholes.length !== nextProps.manholes.length) return false;
  
  // 比较设备各状态数量
  const prevNormal = prevProps.manholes.filter(m => m.status === ManholeStatus.Normal).length;
  const nextNormal = nextProps.manholes.filter(m => m.status === ManholeStatus.Normal).length;
  if (prevNormal !== nextNormal) return false;
  
  const prevWarning = prevProps.manholes.filter(m => m.status === ManholeStatus.Warning).length;
  const nextWarning = nextProps.manholes.filter(m => m.status === ManholeStatus.Warning).length;
  if (prevWarning !== nextWarning) return false;
  
  const prevAlarm = prevProps.manholes.filter(m => m.status === ManholeStatus.Alarm).length;
  const nextAlarm = nextProps.manholes.filter(m => m.status === ManholeStatus.Alarm).length;
  if (prevAlarm !== nextAlarm) return false;
  
  // 如果以上检查都通过，则不需要重新渲染
  return true;
});

export default DeviceStatusSummary; 
