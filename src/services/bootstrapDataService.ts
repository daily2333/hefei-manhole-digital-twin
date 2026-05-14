import { MaintenanceRecord, ManholeAlarm, ManholeInfo, ManholeRealTimeData } from '../typings';
import { fetchManholes, fetchAlarms, fetchMaintenanceRecords } from './api';

export interface BootstrapDataPayload {
  manholes: ManholeInfo[];
  alarms: ManholeAlarm[];
  maintenanceRecords: MaintenanceRecord[];
  realTimeDataMap: Map<string, ManholeRealTimeData>;
}

export const loadBootstrapData = async (): Promise<BootstrapDataPayload> => {
  const [manholes, alarms, maintenanceRecords] = await Promise.all([
    fetchManholes(),
    fetchAlarms(),
    fetchMaintenanceRecords(),
  ]);
  const realTimeDataMap = new Map<string, ManholeRealTimeData>();
  manholes.forEach((m) => {
    if ((m as any).latestData) realTimeDataMap.set(m.id, (m as any).latestData);
  });
  return { manholes, alarms, maintenanceRecords, realTimeDataMap };
};
