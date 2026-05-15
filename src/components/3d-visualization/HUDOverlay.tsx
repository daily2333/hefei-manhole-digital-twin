import React, { useState, useEffect, useMemo } from 'react';
import { ManholeInfo, ManholeRealTimeData } from '../../typings';

interface HUDOverlayProps {
  manholes: ManholeInfo[];
  isNightMode: boolean;
  onToggleNightMode: () => void;
  selectedManhole?: ManholeInfo | null;
  realTimeDataMap?: Map<string, ManholeRealTimeData>;
  onCloseDetail?: () => void;
}

const HUDOverlay: React.FC<HUDOverlayProps> = React.memo(
  ({ manholes, isNightMode, onToggleNightMode, selectedManhole, realTimeDataMap, onCloseDetail }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

    const stats = useMemo(() => {
      const s = (v: unknown) => v as string;
      const online = manholes.filter((m) => s(m.status) === 'normal').length;
      const warning = manholes.filter((m) => s(m.status) === 'warning').length;
      const alarm = manholes.filter((m) => s(m.status) === 'alarm').length;
      const offline = manholes.filter((m) => s(m.status) === 'offline').length;
      return { online, warning, alarm, offline };
    }, [manholes]);

    const timeStr = currentTime.toLocaleTimeString('zh-CN', { hour12: false });
    const dateStr = currentTime.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const overlayStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 10,
      fontFamily: "'JetBrains Mono', 'Consolas', monospace",
    };

    const panelBase: React.CSSProperties = {
      background: isNightMode
        ? 'rgba(10, 21, 37, 0.85)'
        : 'rgba(26, 37, 53, 0.8)',
      border: `1px solid ${isNightMode ? 'rgba(0, 255, 255, 0.3)' : 'rgba(74, 143, 255, 0.3)'}`,
      borderRadius: 4,
      padding: '8px 16px',
      color: isNightMode ? '#00ffff' : '#4a8fff',
      backdropFilter: 'blur(8px)',
    };

    return (
      <div style={overlayStyle}>
        {/* Top-left: Title + Time */}
        <div style={{ position: 'absolute', top: 16, left: 16 }}>
          <div style={panelBase}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>
              合肥智慧井盖数字孪生
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              {dateStr} {timeStr}
            </div>
          </div>
        </div>

        {/* Top-right: Stats */}
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <div style={{ ...panelBase, display: 'flex', gap: 16, alignItems: 'center' }}>
            <StatItem label="在线" value={stats.online} color="#00ff88" />
            <StatItem label="告警" value={stats.warning + stats.alarm} color="#ffaa00" />
            <StatItem label="离线" value={stats.offline} color="#666666" />
          </div>
        </div>

        {/* Bottom-center: Night mode toggle */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
          }}
        >
          <button
            onClick={onToggleNightMode}
            style={{
              ...panelBase,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = isNightMode
                ? 'rgba(0, 255, 255, 0.8)'
                : 'rgba(74, 143, 255, 0.8)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = isNightMode
                ? 'rgba(0, 255, 255, 0.3)'
                : 'rgba(74, 143, 255, 0.3)';
            }}
          >
            {isNightMode ? '🌙 夜间模式' : '☀️ 日间模式'}
          </button>
        </div>

        {/* Right panel: Selected manhole detail */}
        {selectedManhole && (
          <ManholeDetailPanel
            manhole={selectedManhole}
            realTimeData={realTimeDataMap?.get(selectedManhole.id)}
            isNightMode={isNightMode}
            onClose={onCloseDetail}
          />
        )}
      </div>
    );
  }
);

const StatItem: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 10, opacity: 0.7 }}>{label}</div>
  </div>
);

const STATUS_LABELS: Record<string, string> = {
  normal: '正常',
  warning: '警告',
  alarm: '告警',
  offline: '离线',
};

const STATUS_COLORS: Record<string, string> = {
  normal: '#00ff88',
  warning: '#ffaa00',
  alarm: '#ff3333',
  offline: '#666666',
};

const ManholeDetailPanel: React.FC<{
  manhole: ManholeInfo;
  realTimeData?: ManholeRealTimeData;
  isNightMode: boolean;
  onClose?: () => void;
}> = ({ manhole, realTimeData, isNightMode, onClose }) => {
  const status = (manhole.status || 'normal') as string;
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.normal;
  const statusLabel = STATUS_LABELS[status] || status;

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 280,
    background: isNightMode ? 'rgba(10, 21, 37, 0.92)' : 'rgba(26, 37, 53, 0.92)',
    border: `1px solid ${isNightMode ? 'rgba(0, 255, 255, 0.3)' : 'rgba(74, 143, 255, 0.3)'}`,
    borderRadius: 6,
    padding: 16,
    color: isNightMode ? '#00ffff' : '#4a8fff',
    fontFamily: "'JetBrains Mono', 'Consolas', monospace",
    fontSize: 12,
    backdropFilter: 'blur(12px)',
    maxHeight: 'calc(100vh - 120px)',
    overflowY: 'auto',
    pointerEvents: 'auto',
    zIndex: 20,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    borderBottom: `1px solid ${isNightMode ? 'rgba(0, 255, 255, 0.08)' : 'rgba(74, 143, 255, 0.08)'}`,
  };

  const labelStyle: React.CSSProperties = { opacity: 0.7, fontSize: 11 };
  const valueStyle: React.CSSProperties = { fontWeight: 600, fontSize: 12 };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{manhole.name}</div>
          <div style={{ fontSize: 10, opacity: 0.5 }}>ID: {manhole.id}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: statusColor,
            boxShadow: `0 0 6px ${statusColor}`,
          }} />
          <span style={{ color: statusColor, fontWeight: 700, fontSize: 13 }}>{statusLabel}</span>
        </div>
      </div>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'none',
            border: 'none',
            color: isNightMode ? 'rgba(0, 255, 255, 0.5)' : 'rgba(74, 143, 255, 0.5)',
            cursor: 'pointer',
            fontSize: 16,
            padding: '2px 6px',
          }}
        >
          ×
        </button>
      )}

      {/* Section: Device Info */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, marginBottom: 6, letterSpacing: 1 }}>设备信息</div>
        <div style={rowStyle}>
          <span style={labelStyle}>型号</span>
          <span style={valueStyle}>{manhole.model || '-'}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>厂商</span>
          <span style={valueStyle}>{manhole.manufacturer || '-'}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>材质</span>
          <span style={valueStyle}>{manhole.material || '-'}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>直径</span>
          <span style={valueStyle}>{manhole.diameter ? `${manhole.diameter}mm` : '-'}</span>
        </div>
      </div>

      {/* Section: Real-time Data */}
      {realTimeData && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, marginBottom: 6, letterSpacing: 1 }}>实时数据</div>
          <div style={rowStyle}>
            <span style={labelStyle}>温度</span>
            <span style={{ ...valueStyle, color: realTimeData.temperature > 40 ? '#ff3333' : undefined }}>
              {realTimeData.temperature?.toFixed(1) ?? '-'}°C
            </span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>湿度</span>
            <span style={valueStyle}>{realTimeData.humidity?.toFixed(1) ?? '-'}%</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>水位</span>
            <span style={{ ...valueStyle, color: realTimeData.waterLevel > 50 ? '#ff3333' : undefined }}>
              {realTimeData.waterLevel?.toFixed(1) ?? '-'}mm
            </span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>电池</span>
            <span style={{ ...valueStyle, color: realTimeData.batteryLevel < 20 ? '#ff3333' : undefined }}>
              {realTimeData.batteryLevel?.toFixed(0) ?? '-'}%
            </span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>信号</span>
            <span style={valueStyle}>{realTimeData.signalStrength?.toFixed(0) ?? '-'}dBm</span>
          </div>
        </div>
      )}

      {/* Section: Gas Concentration */}
      {realTimeData?.gasConcentration && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, marginBottom: 6, letterSpacing: 1 }}>气体浓度</div>
          <div style={rowStyle}>
            <span style={labelStyle}>CH₄</span>
            <span style={{ ...valueStyle, color: realTimeData.gasConcentration.ch4 > 1 ? '#ff3333' : undefined }}>
              {realTimeData.gasConcentration.ch4?.toFixed(2) ?? '-'}%
            </span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>CO</span>
            <span style={valueStyle}>{realTimeData.gasConcentration.co?.toFixed(1) ?? '-'}ppm</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>H₂S</span>
            <span style={valueStyle}>{realTimeData.gasConcentration.h2s?.toFixed(1) ?? '-'}ppm</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>O₂</span>
            <span style={valueStyle}>{realTimeData.gasConcentration.o2?.toFixed(1) ?? '-'}%</span>
          </div>
        </div>
      )}

      {/* Section: Status */}
      {realTimeData && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, marginBottom: 6, letterSpacing: 1 }}>状态信息</div>
          <div style={rowStyle}>
            <span style={labelStyle}>井盖状态</span>
            <span style={valueStyle}>{realTimeData.coverStatus || '-'}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>倾斜角</span>
            <span style={valueStyle}>
              P:{realTimeData.tilt?.pitch?.toFixed(1) ?? '-'}° R:{realTimeData.tilt?.roll?.toFixed(1) ?? '-'}°
            </span>
          </div>
        </div>
      )}

      {/* No real-time data */}
      {!realTimeData && (
        <div style={{ textAlign: 'center', padding: 12, opacity: 0.5, fontSize: 11 }}>
          暂无实时数据
        </div>
      )}
    </div>
  );
};

HUDOverlay.displayName = 'HUDOverlay';

export default HUDOverlay;
