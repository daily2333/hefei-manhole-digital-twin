import {
  MaintenanceRecord,
  ManholeAlarm,
  ManholeInfo
} from '../../typings';

export interface DashboardBootstrapResponse {
  manholes: ManholeInfo[];
  alarms: ManholeAlarm[];
  maintenanceRecords: MaintenanceRecord[];
}
