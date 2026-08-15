import api from './api';
import type {
  ServiceRecord,
  CreateServiceRecordData,
  MasterItem,
  VehicleCategory,
} from '../types';

// ─── Service History ──────────────────────────────────────────────────────────

export async function getServiceHistory(vehicleId: string): Promise<ServiceRecord[]> {
  const response = await api.get<ServiceRecord[]>(`/vehicles/${vehicleId}/services`);
  return response.data;
}

export async function createServiceRecord(
  vehicleId: string,
  data: CreateServiceRecordData
): Promise<ServiceRecord> {
  const response = await api.post<ServiceRecord>(`/vehicles/${vehicleId}/services`, data);
  return response.data;
}

export async function getServiceRecord(
  vehicleId: string,
  serviceId: string
): Promise<ServiceRecord> {
  const response = await api.get<ServiceRecord>(`/vehicles/${vehicleId}/services/${serviceId}`);
  return response.data;
}

export async function updateServiceRecord(
  vehicleId: string,
  serviceId: string,
  data: Partial<CreateServiceRecordData>
): Promise<ServiceRecord> {
  const response = await api.put<ServiceRecord>(
    `/vehicles/${vehicleId}/services/${serviceId}`,
    data
  );
  return response.data;
}

export async function deleteServiceRecord(
  vehicleId: string,
  serviceId: string
): Promise<void> {
  await api.delete(`/vehicles/${vehicleId}/services/${serviceId}`);
}

// ─── Master Items (catalog) ───────────────────────────────────────────────────

export async function getMasterItems(vehicleCategory?: VehicleCategory): Promise<MasterItem[]> {
  const params = vehicleCategory ? { vehicle_category: vehicleCategory } : {};
  const response = await api.get<MasterItem[]>('/master/items', { params });
  return response.data;
}

export const maintenanceService = {
  getServiceHistory,
  createServiceRecord,
  getServiceRecord,
  updateServiceRecord,
  deleteServiceRecord,
  getMasterItems,
};

export default maintenanceService;
