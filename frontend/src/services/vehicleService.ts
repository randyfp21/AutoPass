import api from './api';
import type { Vehicle, CreateVehicleData, UpdateVehicleData } from '../types';

// ─── Vehicle API Calls ────────────────────────────────────────────────────────

export async function getVehicles(): Promise<Vehicle[]> {
  const response = await api.get<Vehicle[]>('/vehicles');
  return response.data;
}

export async function getVehicleById(id: string): Promise<Vehicle> {
  const response = await api.get<Vehicle>(`/vehicles/${id}`);
  return response.data;
}

export async function createVehicle(data: CreateVehicleData): Promise<Vehicle> {
  const response = await api.post<Vehicle>('/vehicles', data);
  return response.data;
}

export async function updateVehicle(id: string, data: UpdateVehicleData): Promise<Vehicle> {
  const response = await api.put<Vehicle>(`/vehicles/${id}`, data);
  return response.data;
}

export async function deleteVehicle(id: string): Promise<void> {
  await api.delete(`/vehicles/${id}`);
}

export const vehicleService = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};

export default vehicleService;
