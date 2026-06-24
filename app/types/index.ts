export interface User {
  user_id: string;
  username: string;
  phone: string;
  first_name: string;
  last_name: string;
  roles: string[] | Role[];
  email?: string;
  is_active?: boolean;
  created_at?: string;
  updatedAt?: string;
}

export interface Teacher extends User {
  user_id: string;
  specialization?: string;
  bio?: string;
  level_id?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  currentSessionId?: string;
  roles: Role[];
}

export interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student extends User {
  level_id?: string;
  enrollment_date?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  currentSessionId?: string;
  roles: Role[];
  student_profile?: {
    user_id: string;
    points: number;
    coins: number;
    streaks: number;
  };
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  course_id: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  course_id: string;
  duration: number;
  order: number;
  is_mandatory: boolean;
  is_active: boolean;
  materials_count?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  level_id: string;
  teacher_id: string;
  isIELTS?: boolean;
  createdAt: string;
  updatedAt: string;
  enrolled_count?: number;
  max_students?: number;
  status?: string;
  schedule?: string;
  days?: string;
  lesson_start?: string;
  lesson_end?: string;
  start_date?: string | Date;
  end_date?: string | Date;
  teacher?: {
    first_name: string;
    last_name: string;
    user_id?: string;
  };
}

export interface GroupStudent {
  id: string;
  group_id: string;
  student_id: string;
  enrolled_at: string;
  status: "active" | "removed" | "completed" | "frozen";
  createdAt: string;
  updatedAt: string;
  group?: Group;
  student?: Student;
}

export interface GroupHomework {
  id: string;
  lesson_id: string;
  group_id: string;
  teacher_id: string;
  title: string;
  start_date: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  lesson?: Lesson;
}

export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  lesson_id: string;
  exercise_id?: string;
  percentage: number;
  status: "passed" | "failed" | "incomplete";
  section: "reading" | "listening" | "grammar" | "writing" | "speaking";
  file_url?: string;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  group_id: string;
  student_id: string;
  teacher_id: string;
  status: "present" | "absent" | "late";
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Grading {
  id: string;
  student_id: string;
  teacher_id: string;
  group_id: string;
  grade: number;
  percent: number;
  lesson_name?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    user_id: string;
    first_name: string;
    last_name: string;
    username?: string;
  };
  teacher?: {
    user_id: string;
    first_name: string;
    last_name: string;
    username?: string;
  };
  group?: {
    id: string;
    name: string;
  };
}

export interface Exam {
  id: string;
  title: string;
  group_id: string;
  teacher_id?: string | null;
  branch_id?: string | null;
  scheduled_at: string;
  status: "scheduled" | "completed" | "cancelled";
  is_online: boolean;
  bonusOrPenaltyAdded?: boolean;
  level: "beginner" | "elementary" | "pre-intermediate" | "intermediate";
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  max_score: number;
  percentage: string;
  result: "passed" | "failed";
  section_scores?: Record<string, number>;
  feedback?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  exam?: Exam;
  student?: {
    user_id: string;
    first_name: string;
    last_name: string;
  };
}

export interface Lead {
  id: string;
  phone: string;
  question: string;
  first_name: string;
  last_name: string;
  status: string;
  source: string;
  course_id?: string;
  admin_id?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface StudentPayment {
  id: string;
  student_id: string;
  manager_id: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  payment_method: "Naqd" | "Karta" | "Click" | "Payme";
  payment_date: string;
  next_payment_date: string;
  createdAt: string;
  updatedAt: string;
  manager?: {
    first_name: string;
    last_name: string;
    user_id?: string;
  };
}

export interface StudentParent {
  id: string;
  student_id: string;
  full_name: string;
  phone_number: string;
  additional_number?: string;
  createdAt?: string;
  updatedAt?: string;
  student?: Student;
  telegram_chat_id?: string | null;
  is_archived?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Branch {
  id: string;
  owner_id: string;
  name: string;
  address?: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  owner?: any | null;
}

// ── Archived Student Statistics ─────────────────────────────────────────

export type ArchivedStudentReason =
  | 'Narxning qimmatligi'
  | "Dars o'tilish usuli yoqmaganligi"
  | "Guruhdagi muhit (guruh o'quvchilari)"
  | "Guruh darajasi to'g'ri kelmaganligi"
  | "Ustozning tashqi ko'rishni va munosabati"
  | 'Markazning joylashuvi noqulayligi'
  | "O'quvchining shaxsiy muammolari tufayli (sog'ligi yoki boshqa)"
  | 'Kursni muvaffaqiyatli tugatdi'
  | 'Boshqa'

export interface ReasonCount {
  reason: ArchivedStudentReason
  count: number
}

export interface MonthlyTrendItem {
  month: string
  count: number
}

export interface ArchivedStudentEntry {
  student: { user_id: string; first_name: string; last_name: string; phone: string | null }
  reason: string
  notes: string | null
  created_at: string
}

export interface TeacherGroupStudents {
  teacher: { user_id: string | null; first_name: string; last_name: string }
  groups: {
    group: { id: string | null; name: string }
    students: ArchivedStudentEntry[]
  }[]
}

export interface PeriodStats {
  today: number
  thisWeek: number
  thisMonth: number
  lastMonth: number
  monthOverMonthChange: number
}

export interface ArchivedStudentStatistics {
  totalArchived: number
  periodStats: PeriodStats
  byReason: ReasonCount[]
  monthlyTrend: MonthlyTrendItem[]
  byTeacherGroupStudent: TeacherGroupStudents[]
}

export interface ArchivedStudentStatisticsQuery {
  startDate?: string
  endDate?: string
  teacher_id?: string
  group_id?: string
}

// ── Leads Statistics by Teacher ─────────────────────────────────────────

export type LeadAssignmentOutcome = 'became_student' | 'lost'

export interface LeadDetail {
  lead_id: string
  leadName: string
  /** Final conversion outcome of this attended lead for the teacher. */
  outcome: LeadAssignmentOutcome
  leadStatus: string
}

export interface TeacherLeadStats {
  teacher_id: string
  teacherName: string
  /** Decided attended leads (became student + lost). */
  attended: number
  /** Attended leads that enrolled. */
  becameStudent: number
  /** Attended leads that were lost. */
  lost: number
  /** becameStudent / attended, 0-100. */
  conversionRate: number
  leads: LeadDetail[]
}

export interface LeadsStatisticsSummary {
  totalAttended: number
  totalBecameStudent: number
  totalLost: number
  /** Overall conversion among decided attended leads, 0-100. */
  overallConversionRate: number
}

export interface LeadsStatisticsResponse {
  summary: LeadsStatisticsSummary
  teachers: TeacherLeadStats[]
}

export interface LeadsStatisticsQuery {
  startDate?: string
  endDate?: string
  teacher_id?: string
}
// ── Forms ───────────────────────────────────────────────────────────────

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'time'

export interface FormFieldOption {
  label: string
  value: string
}

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  placeholder?: string
  required?: boolean
  options?: FormFieldOption[]
}

export interface FormSchema {
  fields: FormField[]
}

export interface Form {
  id: string
  title: string
  schema: FormSchema
  createdAt: string
  updatedAt: string
}

export interface FormResponse {
  id: string
  form_id: string
  answers: Record<string, any>
  createdAt: string
  updatedAt: string
}

// ── Retention stats (teacher monthly student retention) ──────────────────────
export interface MonthlyRetention {
  /** First day of the month, ISO date (e.g. "2026-06-01"). */
  month: string
  year: number
  /** 1-12 */
  monthNumber: number
  /** Distinct students active in the teacher's groups at the start of the month. */
  startCount: number
  /** Of the start-of-month students, how many were still active at month end. */
  retainedCount: number
  /** Students who left during the month. */
  leftCount: number
  /** retainedCount / startCount, 0-1. null when there were no students to retain. */
  retentionRate: number | null
}

export interface TeacherRetentionReport {
  teacherId: string
  months: MonthlyRetention[]
  /** Simple average of the non-null monthly rates over the window, 0-1. */
  averageRetentionRate: number | null
}

export interface TeacherRetentionWithTeacher extends TeacherRetentionReport {
  teacher: {
    user_id: string
    first_name: string | null
    last_name: string | null
    username: string | null
  } | null
}

export interface RetentionStatsQuery {
  /** Number of trailing months to include (ending with the anchor month). */
  months?: number
  /** Anchor year (the last month included). */
  year?: number
  /** Anchor month 1-12 (the last month included). */
  month?: number
}