import { apiClient } from './client';
import { ManholeAlarm, AlarmType, AlarmLevel } from '../../typings';

function mapAlarmType(type: string): AlarmType {
  switch (type) {
    case 'water_level': return AlarmType.WaterLevel;
    case 'gas_leak': return AlarmType.GasLevel;
    case 'temperature': return AlarmType.Temperature;
    case 'battery_low': return AlarmType.BatteryLow;
    case 'cover_open': return AlarmType.CoverOpen;
    case 'tilt': return AlarmType.Tilt;
    default: return AlarmType.Custom;
  }
}

function mapAlarmLevel(level: string): AlarmLevel {
  switch (level) {
    case 'critical': return AlarmLevel.Emergency;
    case 'alert': return AlarmLevel.Alert;
    case 'warning': return AlarmLevel.Warning;
    case 'notice': return AlarmLevel.Notice;
    case 'info': return AlarmLevel.Info;
    default: return AlarmLevel.Warning;
  }
}

function transformAlarm(raw: any): ManholeAlarm {
  return {
    id: raw.id,
    manholeId: raw.manhole_id ?? raw.manholeId ?? '',
    time: raw.created_at ?? raw.time ?? '',
    type: mapAlarmType(raw.type),
    level: mapAlarmLevel(raw.level),
    description: raw.message ?? raw.description ?? '',
    isResolved: raw.is_resolved === 1 || raw.is_resolved === true || raw.isResolved === true,
    resolvedTime: raw.resolved_at ?? raw.resolvedTime,
    resolvedBy: raw.resolved_by ?? raw.resolvedBy,
    resolveNote: raw.resolve_note ?? raw.resolveNote,
    pushTime: raw.push_time ?? raw.pushTime,
    acknowledgeTime: raw.confirmed_at ?? raw.acknowledgeTime,
    anomalyScore: raw.anomaly_score ?? raw.anomalyScore,
    normalRange: raw.normal_range_min != null ? [raw.normal_range_min, raw.normal_range_max ?? 0] : undefined,
    actualValue: raw.actual_value ?? raw.actualValue,
  };
}

export const fetchAlarms = async (params?: {
  resolved?: boolean;
  level?: string;
  type?: string;
}): Promise<ManholeAlarm[]> => {
  const query: Record<string, string> = {};
  if (params?.resolved !== undefined) query.resolved = String(params.resolved);
  if (params?.level) query.level = params.level;
  if (params?.type) query.type = params.type;
  const res = await apiClient.get<{ data: any[] }>('/alarms', { params: query });
  return (res.data.data || []).map(transformAlarm);
};

export const resolveAlarm = async (id: string): Promise<void> => {
  await apiClient.put(`/alarms/${id}/resolve`);
};

export const acknowledgeAlarm = async (id: string): Promise<void> => {
  await apiClient.put(`/alarms/${id}/acknowledge`);
};
