import { apiClient } from './client';
import { MaintenanceRecord, MaintenanceType } from '../../typings';

function mapMaintenanceType(type: string): MaintenanceType {
  switch (type) {
    case 'inspection': return MaintenanceType.Routine;
    case 'repair': return MaintenanceType.Repair;
    case 'replacement': return MaintenanceType.Replacement;
    case 'calibration': return MaintenanceType.Calibration;
    case 'cleaning': return MaintenanceType.Cleaning;
    case 'upgrade': return MaintenanceType.SystemUpgrade;
    default: return MaintenanceType.Routine;
  }
}

function mapMaintenanceStatus(status: string): 'pending' | 'inProgress' | 'completed' | 'cancelled' {
  switch (status) {
    case 'pending': return 'pending';
    case 'in_progress':
    case 'inProgress': return 'inProgress';
    case 'completed': return 'completed';
    case 'cancelled': return 'cancelled';
    default: return 'pending';
  }
}

function transformMaintenanceRecord(raw: any): MaintenanceRecord {
  return {
    id: raw.id,
    manholeId: raw.manhole_id ?? raw.manholeId ?? '',
    time: raw.created_at ?? raw.time ?? '',
    type: mapMaintenanceType(raw.type),
    description: raw.description ?? '',
    operatorName: raw.operator_name ?? raw.operatorName ?? '',
    contactPhone: raw.operator_phone ?? raw.contactPhone ?? '',
    completionTime: raw.completed_at ?? raw.completionTime,
    status: mapMaintenanceStatus(raw.status),
    notes: raw.notes,
    images: raw.images || [],
  };
}

export const fetchMaintenanceRecords = async (status?: string): Promise<MaintenanceRecord[]> => {
  const params = status ? { status } : undefined;
  const res = await apiClient.get<{ data: any[] }>('/maintenance', { params });
  return (res.data.data || []).map(transformMaintenanceRecord);
};
