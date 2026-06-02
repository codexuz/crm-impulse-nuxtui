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
  type: 'in' | 'out' | 'absent';
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

// ---------------------------------------------------------------------------
// Staff profile — no longer has in_time/out_time; shifts are separate
// ---------------------------------------------------------------------------

export type DayOfWeek =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday'
  | 'friday' | 'saturday' | 'sunday'
  | 'every_day' | 'odd' | 'even';

export interface StaffShift {
  id: string;
  profile_id: string;
  day_of_week: DayOfWeek;
  in_time: string;
  out_time: string | null;
  grace_period_minutes: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffShiftDto {
  day_of_week?: DayOfWeek;
  in_time: string;
  out_time?: string;
  grace_period_minutes?: number;
  is_active?: boolean;
}

export interface StaffProfile {
  id: string;
  staff_id: string;
  shifts?: StaffShift[];
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
}

export interface UpdateStaffProfileDto {
  // reserved for future fields
}

// ---------------------------------------------------------------------------
// Attendance policy
// ---------------------------------------------------------------------------

export interface AttendancePolicy {
  id: string;
  branch_id: string | null;
  role: string | null;
  grace_period_minutes: number;
  fine_tier1_amount: number;
  fine_tier1_max_minutes: number;
  fine_tier2_amount: number;
  max_fine_per_day: number;
  effective_from: string | null;
  effective_to: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendancePolicyDto {
  branch_id?: string;
  role?: string;
  grace_period_minutes?: number;
  fine_tier1_amount?: number;
  fine_tier1_max_minutes?: number;
  fine_tier2_amount?: number;
  max_fine_per_day?: number;
  effective_from?: string;
  effective_to?: string;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// Attendance summary (analytics)
// ---------------------------------------------------------------------------

export interface AttendanceSummaryItem {
  teacher: {
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
  total: number;
  early: number;
  on_time: number;
  late: number;
  absent?: number;
  total_fine: number;
  avg_minutes_late: number;
  attendance_rate: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Audit event log
// ---------------------------------------------------------------------------

export interface StaffAttendanceEvent {
  id: string;
  staff_id: string;
  attendance_id: string | null;
  method: 'qr_scan' | 'auto_scan' | 'manual' | 'cron_absent';
  type: 'in' | 'out' | 'absent';
  outcome: 'success' | 'rejected';
  note: string | null;
  raw_payload: object | null;
  createdAt: string;
  staff?: {
    user_id: string;
    first_name: string;
    last_name: string;
  };
}
