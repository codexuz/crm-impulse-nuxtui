export interface ScanStaffAttendanceDto {
  group_id: string;
  type?: 'in' | 'out';
  description?: string;
}

export interface AttendanceRecord {
  id: string;
  teacher_id: string;
  group_id: string;
  type: 'in' | 'out';
  scanned_at: string;
  fine_amount?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type StaffAttendanceStatus = 'early' | 'on_time' | 'late';

export interface StaffAttendanceRecord {
  id: string;
  teacher_id: string;
  group_id: string | null;
  status: StaffAttendanceStatus;
  type: 'in' | 'out';
  fine_amount: number;
  minutes_late: number;
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  teacher?: {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  group?: {
    id: string;
    name: string;
    lesson_start: string | null;
  } | null;
}

export interface StaffAttendanceListParams {
  page?: number;
  limit?: number;
  query?: string;
  teacherId?: string;
  groupId?: string;
  status?: StaffAttendanceStatus | '';
  type?: 'in' | 'out' | '';
  startDate?: string;
  endDate?: string;
}

export interface StaffAttendanceListResponse {
  data: StaffAttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StaffProfile {
  id: string;
  staff_id: string;
  in_time: string | null;
  out_time: string | null;
  createdAt: string;
  updatedAt: string;
  staff?: {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface CreateStaffProfileDto {
  staff_id: string;
  in_time?: string;
  out_time?: string;
}

export interface UpdateStaffProfileDto {
  in_time?: string;
  out_time?: string;
}
