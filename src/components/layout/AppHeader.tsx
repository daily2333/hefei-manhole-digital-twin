import React from 'react';
import { Badge, Button, Space, Tooltip } from 'antd';
import {
  BellOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  QuestionCircleOutlined,
  RadarChartOutlined,
  UserOutlined
} from '@ant-design/icons';
import { SystemStatusPanel } from './SystemStatusPanel';

interface AppHeaderProps {
  currentTime: Date;
  notifications: number;
  onClearNotifications: () => void;
  isFullscreen: boolean;
  toggleFullScreen: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTime,
  notifications,
  onClearNotifications,
  isFullscreen,
  toggleFullScreen
}) => {
  return (
    <header className="header-shell">
      <div className="brand-lockup">
        <div className="brand-mark">
          <RadarChartOutlined />
        </div>
        <div>
          <div className="brand-eyebrow">Smart Infrastructure Twin</div>
          <h1 className="brand-title">城市井盖数字孪生指挥台</h1>
          <div className="brand-subtitle">一体化态势监控、空间分析、告警响应与现场运维</div>
        </div>
      </div>

      <div className="header-side">
        <SystemStatusPanel currentTime={currentTime} />
        <Space size={8}>
          <Tooltip title={isFullscreen ? '退出全屏' : '进入全屏'}>
            <Button
              type="text"
              className="header-action"
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullScreen}
            />
          </Tooltip>
          <Tooltip title="清空通知">
            <Badge count={notifications} size="small">
              <Button
                type="text"
                className="header-action"
                icon={<BellOutlined />}
                onClick={onClearNotifications}
              />
            </Badge>
          </Tooltip>
          <Tooltip title="帮助中心">
            <Button type="text" className="header-action" icon={<QuestionCircleOutlined />} />
          </Tooltip>
          <Tooltip title="运维账号">
            <Button type="text" className="header-action" icon={<UserOutlined />} />
          </Tooltip>
        </Space>
      </div>
    </header>
  );
};
