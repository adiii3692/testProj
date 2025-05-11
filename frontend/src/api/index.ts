import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

export interface Service {
  id: number;
  name: string;
  type: string;
  url: string;
  config: string;
  status: 'up' | 'down';
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: number;
  service_id: number;
  service_name: string;
  status: 'active' | 'resolved';
  started_at: string;
  resolved_at: string | null;
  verification_status: 'pending' | 'verified';
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export const getServices = async (): Promise<Service[]> => {
  const response = await api.get<Service[]>('/services');
  return response.data;
};

export const getAlerts = async (): Promise<Alert[]> => {
  const response = await api.get<Alert[]>('/alerts');
  return response.data;
};

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users');
  return response.data;
};

export const createService = async (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service> => {
  const response = await api.post<Service>('/services', service);
  return response.data;
};

export const updateService = async (id: number, service: Partial<Service>): Promise<Service> => {
  const response = await api.put<Service>(`/services/${id}`, service);
  return response.data;
};

export const deleteService = async (id: number): Promise<void> => {
  await api.delete(`/services/${id}`);
};

export const resolveAlert = async (id: number): Promise<Alert> => {
  const response = await api.post<Alert>(`/alerts/${id}/resolve`);
  return response.data;
};

export const verifyAlert = async (id: number): Promise<Alert> => {
  const response = await api.post<Alert>(`/alerts/${id}/verify`);
  return response.data;
}; 