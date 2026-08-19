import api from './api';
import type { VehiclePartMonitor } from '../types';

export const partMonitorService = {
  getPartMonitors: async (vehicleId: string): Promise<VehiclePartMonitor[]> => {
    const res = await api.get<VehiclePartMonitor[]>(`/vehicles/${vehicleId}/part-monitors`);
    return res.data || [];
  },

  updatePartMonitor: async (
    vehicleId: string,
    monitorId: string,
    data: { is_enabled?: boolean; ideal_lifespan_km?: number }
  ): Promise<void> => {
    await api.put(`/vehicles/${vehicleId}/part-monitors/${monitorId}`, data);
  },

  replacePart: async (
    vehicleId: string,
    monitorId: string,
    data?: { mileage?: number; date?: string }
  ): Promise<void> => {
    await api.post(`/vehicles/${vehicleId}/part-monitors/${monitorId}/replace`, data || {});
  },
};
