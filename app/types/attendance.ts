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
