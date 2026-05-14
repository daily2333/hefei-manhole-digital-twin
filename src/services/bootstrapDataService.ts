import { isApiMode } from '../config/runtimeConfig';
import {
  generateEnhancedManholes,
  generateMockAlarms,
  generateMockMaintenanceRecords
} from '../mock-data/manholes';
import { MaintenanceRecord, ManholeAlarm, ManholeInfo, ManholeRealTimeData } from '../typings';
import { fetchDashboardBootstrap } from './api';

export interface BootstrapDataPayload {
  manholes: ManholeInfo[];
  alarms: ManholeAlarm[];
  maintenanceRecords: MaintenanceRecord[];
  realTimeDataMap: Map<string, ManholeRealTimeData>;
  source: 'api' | 'mock';
}

const buildRealTimeDataMap = (manholes: ManholeInfo[]) => {
  const map = new Map<string, ManholeRealTimeData>();
  manholes.forEach((manhole) => {
    if (manhole.latestData) {
      map.set(manhole.id, manhole.latestData);
    }
  });
  return map;
};

const buildMockPayload = (): BootstrapDataPayload => {
  const manholes = generateEnhancedManholes(30);
  return {
    manholes,
    alarms: generateMockAlarms(manholes),
    maintenanceRecords: generateMockMaintenanceRecords(manholes),
    realTimeDataMap: buildRealTimeDataMap(manholes),
    source: 'mock'
  };
};

export const loadBootstrapData = async (): Promise<BootstrapDataPayload> => {
  if (!isApiMode) {
    return buildMockPayload();
  }

  try {
    const response = await fetchDashboardBootstrap();
    return {
      manholes: response.manholes,
      alarms: response.alarms,
      maintenanceRecords: response.maintenanceRecords,
      realTimeDataMap: buildRealTimeDataMap(response.manholes),
      source: 'api'
    };
  } catch (error) {
    console.warn('API bootstrap failed, falling back to mock data.', error);
    return buildMockPayload();
  }
};
