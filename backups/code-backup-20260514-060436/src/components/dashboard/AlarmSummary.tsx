import React, { memo, useMemo } from 'react';
import { Card, Statistic, Row, Col, Progress, Badge, Divider } from 'antd';
import { ManholeAlarm, AlarmLevel } from '../../typings';
import { AlertOutlined } from '@ant-design/icons';

interface AlarmSummaryProps {
  alarms: ManholeAlarm[];
}

/**
 * 警报摘要组件
 * 显示不同等级的警报统计和最新严重警报
 */
const AlarmSummary: React.FC<AlarmSummaryProps> = memo(({ alarms }) => {
  
  // 使用useMemo缓存计算结果，避免不必要的重复计算
  const alarmStats = useMemo(() => {
    const unresolved = alarms.filter(a => !a.isResolved);
    const totalAlarms = unresolved.length;
    const emergencyAlarms = unresolved.filter(a => a.level === AlarmLevel.Emergency).length;
    const alertAlarms = unresolved.filter(a => a.level === AlarmLevel.Alert).length;
    const warningAlarms = unresolved.filter(a => a.level === AlarmLevel.Warning).length;
    
    // 计算百分比
    const emergencyPercent = totalAlarms ? Math.round((emergencyAlarms / totalAlarms) * 100) : 0;
    const alertPercent = totalAlarms ? Math.round((alertAlarms / totalAlarms) * 100) : 0;
    const warningPercent = totalAlarms ? Math.round((warningAlarms / totalAlarms) * 100) : 0;
    
    return {
      totalAlarms,
      emergencyAlarms,
      alertAlarms,
      warningAlarms,
      emergencyPercent,
      alertPercent,
      warningPercent
    };
  }, [alarms]); // 只有当alarms变化时才重新计算
  
  return (
    <Card 
      title={
        <div className="card-header-with-icon">
          <AlertOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
          <span>告警统计</span>
          <div className="card-header-extra">
            <Badge count={alarmStats.totalAlarms} overflowCount={999} />
          </div>
        </div>
      } 
      className="glass-card"
      variant="borderless"
    >
      <Row gutter={16}>
        <Col span={24}>
          <Statistic 
            title="未处理告警总数" 
            value={alarmStats.totalAlarms} 
            valueStyle={{ color: '#ff4d4f' }} 
          />
        </Col>
      </Row>
      
      <Divider style={{ margin: '16px 0' }}/>
      
      <div className="alarm-stats">
        <div className="alarm-stat-item">
          <div className="alarm-stat-header">
            <div className="alarm-stat-title">
              <Badge color="#ff4d4f" text="紧急告警" />
            </div>
            <div className="alarm-stat-count">{alarmStats.emergencyAlarms}</div>
          </div>
          <Progress 
            percent={alarmStats.emergencyPercent} 
            showInfo={false} 
            strokeColor="#ff4d4f" 
            trailColor="rgba(255,255,255,0.1)"
          />
        </div>
        
        <div className="alarm-stat-item">
          <div className="alarm-stat-header">
            <div className="alarm-stat-title">
              <Badge color="#fa8c16" text="严重告警" />
            </div>
            <div className="alarm-stat-count">{alarmStats.alertAlarms}</div>
          </div>
          <Progress 
            percent={alarmStats.alertPercent} 
            showInfo={false} 
            strokeColor="#fa8c16" 
            trailColor="rgba(255,255,255,0.1)"
          />
        </div>
        
        <div className="alarm-stat-item">
          <div className="alarm-stat-header">
            <div className="alarm-stat-title">
              <Badge color="#faad14" text="警告告警" />
            </div>
            <div className="alarm-stat-count">{alarmStats.warningAlarms}</div>
          </div>
          <Progress 
            percent={alarmStats.warningPercent} 
            showInfo={false} 
            strokeColor="#faad14" 
            trailColor="rgba(255,255,255,0.1)"
          />
        </div>
      </div>
      
      <div className="alarm-tip">
        <p>单击地图上的井盖以查看详细告警信息</p>
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只有当告警数量或状态发生变化时才重新渲染
  if (prevProps.alarms.length !== nextProps.alarms.length) return false;
  
  // 比较未解决告警数量
  const prevUnresolved = prevProps.alarms.filter(a => !a.isResolved).length;
  const nextUnresolved = nextProps.alarms.filter(a => !a.isResolved).length;
  
  if (prevUnresolved !== nextUnresolved) return false;
  
  // 比较各级别告警数量
  const prevEmergency = prevProps.alarms.filter(a => !a.isResolved && a.level === AlarmLevel.Emergency).length;
  const nextEmergency = nextProps.alarms.filter(a => !a.isResolved && a.level === AlarmLevel.Emergency).length;
  
  if (prevEmergency !== nextEmergency) return false;
  
  return true; // 如果以上检查都通过，则不需要重新渲染
});

export default AlarmSummary; 
