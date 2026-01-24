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
  createdAt: string;
  updatedAt: string;
  enrolled_count?: number;
  max_students?: number;
  status?: string;
  schedule?: string;
  start_date?: string | Date;
  end_date?: string | Date;
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

export interface Exam {
  id: string;
  title: string;
  group_id: string;
  scheduled_at: string;
  status: "scheduled" | "completed" | "cancelled";
  is_online: boolean;
  level: "beginner" | "elementary" | "pre-intermediate" | "intermediate";
  createdAt: string;
  updatedAt: string;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  max_score: number;
  percentage: number;
  result: "passed" | "failed";
  section_scores?: Record<string, number>;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
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
}

export interface StudentParent {
  id: string;
  student_id: string;
  full_name: string;
  phone_number: string;
  additional_number?: string;
  created_at?: string;
  updated_at?: string;
  student?: Student;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
