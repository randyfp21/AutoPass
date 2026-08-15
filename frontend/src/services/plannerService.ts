import api from './api';
import type { ServicePlanner, CreatePlannerData, UpdatePlannerData, Workshop } from '../types';

export async function getPlanners(): Promise<ServicePlanner[]> {
  const response = await api.get<ServicePlanner[]>('/planners');
  return response.data;
}

export async function createPlanner(data: CreatePlannerData): Promise<ServicePlanner> {
  const response = await api.post<ServicePlanner>('/planners', data);
  return response.data;
}

export async function updatePlanner(id: string, data: UpdatePlannerData): Promise<ServicePlanner> {
  const response = await api.put<ServicePlanner>(`/planners/${id}`, data);
  return response.data;
}

export async function deletePlanner(id: string): Promise<void> {
  await api.delete(`/planners/${id}`);
}

export async function getWorkshops(): Promise<Workshop[]> {
  const response = await api.get<Workshop[]>('/workshops');
  return response.data;
}

export const plannerService = {
  getPlanners,
  createPlanner,
  updatePlanner,
  deletePlanner,
  getWorkshops,
};

export default plannerService;
