import { apiClient } from './client';
import { ManholeInfo, ManholeRealTimeData, ManholeStatus, CoverStatus } from '../../typings';

function mapStatus(status: string): ManholeStatus {
  switch (status) {
    case 'normal': return ManholeStatus.Normal;
    case 'warning': return ManholeStatus.Warning;
    case 'alarm': return ManholeStatus.Alarm;
    case 'offline': return ManholeStatus.Offline;
    case 'maintenance': return ManholeStatus.Maintenance;
    default: return ManholeStatus.Normal;
  }
}

function mapCoverStatus(status: string): CoverStatus {
  switch (status) {
    case 'closed': return CoverStatus.Closed;
    case 'open': return CoverStatus.Open;
    case 'half_open': return CoverStatus.PartialOpen;
    default: return CoverStatus.Unknown;
  }
}

export function transformRealtimeData(raw: any): ManholeRealTimeData {
  return {
    id: String(raw.id ?? ''),
    manholeId: raw.manhole_id ?? raw.manholeId ?? '',
    timestamp: raw.recorded_at ?? raw.timestamp ?? '',
    waterLevel: raw.water_level ?? raw.waterLevel ?? 0,
    gasConcentration: {
      ch4: raw.ch4 ?? 0,
      co: raw.co ?? 0,
      h2s: raw.h2s ?? 0,
      o2: raw.o2 ?? 0,
    },
    temperature: raw.temperature ?? 0,
    humidity: raw.humidity ?? 0,
    batteryLevel: raw.battery_level ?? raw.batteryLevel ?? 0,
    signalStrength: raw.signal_strength ?? raw.signalStrength ?? 0,
    coverStatus: mapCoverStatus(raw.cover_status ?? raw.coverStatus ?? 'closed'),
    accelerometer: {
      x: raw.accelerometer_x ?? raw.accelerometer?.x ?? 0,
      y: raw.accelerometer_y ?? raw.accelerometer?.y ?? 0,
      z: raw.accelerometer_z ?? raw.accelerometer?.z ?? 0,
    },
    tilt: {
      pitch: raw.tilt_x ?? raw.tilt?.pitch ?? 0,
      roll: raw.tilt_y ?? raw.tilt?.roll ?? 0,
    },
    accuracy: {
      temperature: raw.accuracy_temperature ?? raw.accuracy?.temperature ?? 0,
      waterLevel: raw.accuracy_water_level ?? raw.accuracy?.waterLevel ?? 0,
    },
  };
}

function transformManholeInfo(raw: any): ManholeInfo {
  return {
    id: raw.id,
    name: raw.name,
    status: mapStatus(raw.status),
    location: {
      latitude: raw.latitude ?? 0,
      longitude: raw.longitude ?? 0,
      address: raw.address ?? '',
      district: raw.district ?? '',
      city: raw.city ?? '',
      province: raw.province ?? '',
    },
    model: raw.model ?? '',
    manufacturer: raw.manufacturer ?? '',
    installationDate: raw.installation_date ?? raw.installationDate ?? '',
    material: raw.material ?? '',
    diameter: raw.diameter ?? 0,
    depth: raw.depth ?? 0,
    manager: raw.manager ?? '',
    contactPhone: raw.contact_phone ?? raw.contactPhone ?? '',
    lastMaintenanceTime: raw.last_maintenance_time ?? raw.lastMaintenanceTime,
    nextMaintenanceTime: raw.next_maintenance_time ?? raw.nextMaintenanceTime,
    deviceId: raw.device_id ?? raw.deviceId ?? '',
    sensorTypes: raw.sensor_types ?? raw.sensorTypes ?? [],
    latestAlarm: raw.latestAlarm,
    latestMaintenance: raw.latestMaintenance,
    latestData: raw.latestData ? transformRealtimeData(raw.latestData) : undefined,
    healthScore: raw.healthScore,
  };
}

export const fetchManholes = async (): Promise<ManholeInfo[]> => {
  const res = await apiClient.get<{ data: any[] }>('/manholes');
  return (res.data.data || []).map(transformManholeInfo);
};

export const fetchManholeById = async (id: string): Promise<ManholeInfo> => {
  const res = await apiClient.get<{ data: any }>(`/manholes/${id}`);
  return transformManholeInfo(res.data.data);
};

export const fetchRealtimeByManhole = async (id: string): Promise<ManholeRealTimeData> => {
  const res = await apiClient.get<{ data: any }>(`/realtime/${id}`);
  return transformRealtimeData(res.data.data);
};

export const fetchAllLatestRealtime = async (): Promise<ManholeRealTimeData[]> => {
  const res = await apiClient.get<{ data: any[] }>('/realtime');
  return (res.data.data || []).map(transformRealtimeData);
};

export const fetchRealtimeHistory = async (manholeId: string, limit: number = 100): Promise<ManholeRealTimeData[]> => {
  const res = await apiClient.get<{ data: any[] }>(`/realtime/${manholeId}/history?limit=${limit}`);
  return (res.data.data || []).map(transformRealtimeData);
};
