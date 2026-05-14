import React from 'react';
import { Statistic, Card, Progress, Tooltip } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

interface StatsCardProps {
  title: string;
  value: number | string;
  precision?: number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  change?: number; // 表示相比上一周期的变化百分比
  loading?: boolean;
  progressPercent?: number; // 进度条百分比
  progressStatus?: 'success' | 'exception' | 'normal' | 'active';
  cardType?: 'default' | 'primary' | 'danger' | 'warning' | 'success';
  tooltip?: string; // 提示文本
  footer?: React.ReactNode; // 底部内容，可以是文本或React元素
  icon?: React.ReactNode; // 自定义图标
  color?: string; // 自定义颜色
}

// 获取不同卡片类型的样式
const getCardStyle = (type: StatsCardProps['cardType'] = 'default') => {
  switch (type) {
    case 'primary':
      return { 
        gradient: 'linear-gradient(135deg, #1890ff, #096dd9)',
        textColor: '#fff',
        iconColor: 'rgba(255, 255, 255, 0.7)'
      };
    case 'danger':
      return { 
        gradient: 'linear-gradient(135deg, #ff4d4f, #cf1322)',
        textColor: '#fff',
        iconColor: 'rgba(255, 255, 255, 0.7)'
      };
    case 'warning':
      return { 
        gradient: 'linear-gradient(135deg, #faad14, #d48806)',
        textColor: '#fff',
        iconColor: 'rgba(255, 255, 255, 0.7)'
      };
    case 'success':
      return { 
        gradient: 'linear-gradient(135deg, #52c41a, #389e0d)',
        textColor: '#fff',
        iconColor: 'rgba(255, 255, 255, 0.7)'
      };
    default:
      return { 
        gradient: 'linear-gradient(135deg, #1f1f1f, #121212)',
        textColor: '#fff',
        iconColor: 'rgba(255, 255, 255, 0.7)'
      };
  }
};

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  precision = 0,
  prefix,
  suffix,
  change,
  loading = false,
  progressPercent,
  progressStatus = 'normal',
  cardType = 'default',
  tooltip,
  footer,
  icon,
  color
}) => {
  const style = getCardStyle(cardType);
  const isPositiveChange = change && change > 0;

  // 使用传入的自定义颜色覆盖默认颜色
  const cardBackground = color ? color : style.gradient;

  return (
    <Card 
      className="stats-card"
      loading={loading}
      style={{ 
        background: cardBackground,
        color: style.textColor,
        borderRadius: '8px',
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stats-card-title" style={{ marginBottom: '10px', opacity: 0.8 }}>
            {tooltip ? (
              <Tooltip title={tooltip}>
                {title} <span style={{ marginLeft: '4px', cursor: 'help' }}>ⓘ</span>
              </Tooltip>
            ) : (
              title
            )}
          </div>
          <Statistic 
            value={value} 
            precision={precision}
            valueStyle={{ 
              color: style.textColor,
              fontSize: '28px',
              fontWeight: 'bold'
            }}
            prefix={prefix}
            suffix={suffix}
          />
          
          {change !== undefined && (
            <div style={{ 
              marginTop: '8px', 
              color: isPositiveChange ? '#52c41a' : '#ff4d4f',
              display: 'flex',
              alignItems: 'center'
            }}>
              {isPositiveChange ? (
                <ArrowUpOutlined style={{ marginRight: '4px' }} />
              ) : (
                <ArrowDownOutlined style={{ marginRight: '4px' }} />
              )}
              <span>{Math.abs(change)}% 相比上期</span>
            </div>
          )}
        </div>
        
        <div className="stats-card-icon" style={{ opacity: 0.7 }}>
          {icon ? (
            icon
          ) : (
            <>
              {cardType === 'success' && <CheckCircleOutlined style={{ fontSize: '24px', color: style.iconColor }} />}
              {cardType === 'warning' && <WarningOutlined style={{ fontSize: '24px', color: style.iconColor }} />}
              {cardType === 'danger' && <WarningOutlined style={{ fontSize: '24px', color: style.iconColor }} />}
              {cardType === 'primary' && <ClockCircleOutlined style={{ fontSize: '24px', color: style.iconColor }} />}
            </>
          )}
        </div>
      </div>
      
      {progressPercent !== undefined && (
        <div style={{ marginTop: '15px' }}>
          <Progress 
            percent={progressPercent} 
            status={progressStatus}
            strokeColor={style.textColor}
            trailColor="rgba(255, 255, 255, 0.2)"
            showInfo={false}
            size="small"
          />
        </div>
      )}
      
      {footer && (
        <div style={{ marginTop: '15px', fontSize: '12px', opacity: 0.7 }}>
          {footer}
        </div>
      )}
    </Card>
  );
};

export default StatsCard; 