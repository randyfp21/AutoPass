// ============================================
// ENUMS / UNION TYPES
// ============================================

export type UserRole = 'user' | 'workshop_owner' | 'admin';
export type VehicleCategory = 'motor' | 'mobil';
export type ItemCategory = 'part' | 'fluid' | 'service_fee';
export type AuthProvider = 'email' | 'google';

// ============================================
// USER
// ============================================

export interface User {
  id: string;
  email: string;
  username?: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  bio?: string;
  role: UserRole;
  auth_provider: AuthProvider;
  created_at: string;
}

// ============================================
// VEHICLE
// ============================================

export interface Vehicle {
  id: string;
  user_id: string;
  nickname?: string;
  category: VehicleCategory;
  license_plate: string;
  brand: string;
  model: string;
  variant_type?: string;
  manufacture_year: number;
  current_mileage: number;
  photo_url?: string;
  stnk_number?: string;
  stnk_expiry_date?: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleData {
  nickname?: string;
  category: VehicleCategory;
  license_plate: string;
  brand: string;
  model: string;
  variant_type?: string;
  manufacture_year: number;
  current_mileage?: number;
  photo_url?: string;
  stnk_number?: string;
  stnk_expiry_date?: string;
}

export interface UpdateVehicleData {
  nickname?: string;
  category?: VehicleCategory;
  license_plate?: string;
  brand?: string;
  model?: string;
  variant_type?: string;
  manufacture_year?: number;
  current_mileage?: number;
  photo_url?: string;
  stnk_number?: string;
  stnk_expiry_date?: string;
}

// ============================================
// WORKSHOP
// ============================================

export interface Workshop {
  id: string;
  owner_user_id: string;
  workshop_name: string;
  address?: string;
  phone_number?: string;
  is_verified: boolean;
  created_at: string;
}

// ============================================
// MASTER ITEM (catalog of parts/fluids/fees)
// ============================================

export interface MasterItem {
  id: string;
  item_name: string;
  category: ItemCategory;
  vehicle_category: VehicleCategory;
  description?: string;
}

// ============================================
// SERVICE RECORD
// ============================================

export interface ServiceDetail {
  id: string;
  service_record_id: string;
  master_item_id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CreateServiceDetailData {
  master_item_id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

export interface ServiceRecord {
  id: string;
  vehicle_id: string;
  workshop_id?: string;
  is_official_workshop: boolean;
  workshop_name_manual?: string;
  service_date: string;
  mileage_at_service: number;
  complaints?: string;
  total_cost: number;
  notes?: string;
  receipt_photo_url?: string;
  created_by_role: 'user' | 'workshop';
  items?: ServiceDetail[];
  details?: ServiceDetail[];
  created_at: string;
}

export interface CreateServiceRecordData {
  workshop_id?: string;
  is_official_workshop: boolean;
  workshop_name_manual?: string;
  service_date: string;
  mileage_at_service: number;
  complaints?: string;
  notes?: string;
  receipt_photo_url?: string;
  items: CreateServiceDetailData[];
}

// ============================================
// SERVICE PLANNER / SCHEDULER
// ============================================

export type PlannerStatus = 'planned' | 'completed' | 'cancelled';

export interface ServicePlanner {
  id: string;
  user_id: string;
  vehicle_id: string;
  vehicle_info?: Vehicle;
  workshop_id?: string;
  is_official_workshop?: boolean;
  workshop_name_manual?: string;
  workshop_info?: Workshop;
  title: string;
  planned_date: string; // YYYY-MM-DD
  target_mileage: number;
  notes?: string;
  status: PlannerStatus;
  created_at: string;
  updated_at: string;
}

export interface CreatePlannerData {
  vehicle_id: string;
  workshop_id?: string;
  workshop_name_manual?: string;
  title: string;
  planned_date: string;
  target_mileage?: number;
  notes?: string;
}

export interface UpdatePlannerData {
  workshop_id?: string;
  workshop_name_manual?: string;
  title?: string;
  planned_date?: string;
  target_mileage?: number;
  notes?: string;
  status?: PlannerStatus;
}

// ============================================
// ODO THREADS (SOCIAL MEDIA MODULE)
// ============================================

export type ThreadCategory =
  | 'kendala'
  | 'pengalaman'
  | 'tips'
  | 'general'
  | 'trip'
  | 'touring'
  | 'modifikasi'
  | 'ban'
  | 'ev'
  | 'audio'
  | 'biled'
  | 'aksesoris'
  | 'subscribed';

export interface ThreadComment {
  id: string;
  thread_id: string;
  user_id: string;
  user_name: string;
  user_username?: string;
  user_avatar?: string;
  user_role: string;
  content: string;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
}

export interface Thread {
  id: string;
  user_id: string;
  user_name: string;
  user_username?: string;
  user_avatar?: string;
  user_bio?: string;
  user_role: string;
  vehicle_id?: string;
  vehicle_name?: string;
  vehicle_plate?: string;
  content: string;
  photo_urls: string[];
  category: ThreadCategory;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  created_at: string;
  comments?: ThreadComment[];
}

export interface CreateThreadData {
  vehicle_id?: string;
  content: string;
  photo_urls?: string[];
  category?: ThreadCategory;
}

export interface NotificationItem {
  id: string;
  recipient_id: string;
  actor_id: string;
  actor_name: string;
  actor_username?: string;
  actor_avatar?: string;
  thread_id?: string;
  thread_preview?: string;
  comment_id?: string;
  type: 'like_thread' | 'comment_thread' | 'like_comment' | 'mention';
  is_read: boolean;
  created_at: string;
}

// ============================================
// AUTH & API
// ============================================

export interface RegisterData {
  email: string;
  username?: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone_number?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}
