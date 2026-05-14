import { MaintenanceRecord, ManholeAlarm, ManholeInfo, ManholeRealTimeData } from '../typings';
import { fetchManholes, fetchAlarms, fetchMaintenanceRecords, fetchAllLatestRealtime } from './api';

export interface BootstrapDataPayload {
  manholes: ManholeInfo[];
  alarms: ManholeAlarm[];
  maintenanceRecords: MaintenanceRecord[];
  realTimeDataMap: Map<string, ManholeRealTimeData>;
}

export const loadBootstrapData = async (): Promise<BootstrapDataPayload> => {
  const [manholes, alarms, maintenanceRecords, realtimeList] = await Promise.all([
    fetchManholes(),
    fetchAlarms(),
    fetchMaintenanceRecords(),
    fetchAllLatestRealtime().catch(() => [] as ManholeRealTimeData[]),
  ]);
  const realTimeDataMap = new Map<string, ManholeRealTimeData>();
  realtimeList.forEach((d) => realTimeDataMap.set(d.manholeId, d));
  return { manholes, alarms, maintenanceRecords, realTimeDataMap };
};
