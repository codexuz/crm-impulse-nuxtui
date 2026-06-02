import { api } from '~/lib/api'
import { useAuth } from '~/composables/useAuth'
import type {
  ScanStaffAttendanceDto,
  AttendanceRecord,
  StaffAttendanceListParams,
  StaffAttendanceListResponse,
  AttendanceSummaryItem,
  StaffAttendanceEvent,
  AttendancePolicy,
  AttendancePolicyDto,
} from '~/types/attendance'

export const useStaffAttendance = () => {
  const { apiService } = useAuth()

  // ---------------------------------------------------------------------------
  // QR helpers
  // ---------------------------------------------------------------------------

  const getQrPayload = async (groupId: string) => {
    return await api.get<{ qr_code: string }>(apiService.value, `/staff-attendance/qr-payload/${groupId}`)
  }

  const getTeacherStaticQr = async (teacherId: string) => {
    return await api.get<{ teacher_id: string; bot_url: string }>(apiService.value, `/staff-attendance/static-qr/${teacherId}`)
  }

  // ---------------------------------------------------------------------------
  // Scan
  // ---------------------------------------------------------------------------

  const scanAttendance = async (data: ScanStaffAttendanceDto) => {
    return await api.post(apiService.value, '/staff-attendance/scan', data)
  }

  const autoScan = async (teacherId: string, type: 'in' | 'out' = 'in') => {
    return await api.post(apiService.value, '/staff-attendance/automatic-scan', { teacher_id: teacherId, type })
  }

  // ---------------------------------------------------------------------------
  // Records
  // ---------------------------------------------------------------------------

  const getMyHistory = () => {
    return useFetch<AttendanceRecord[]>(`${apiService.value.baseUrl}/staff-attendance/my-attendances`, {
      key: 'my-staff-attendance',
      headers: apiService.value.headers,
    })
  }

  const getAllAttendances = (params: StaffAttendanceListParams = {}) => {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, String(value))
      }
    })
    const qs = search.toString()
    return api.get<StaffAttendanceListResponse>(
      apiService.value,
      `/staff-attendance${qs ? `?${qs}` : ''}`,
    )
  }

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------

  const getSummary = (params: { startDate: string; endDate: string; teacherId?: string }) => {
    const search = new URLSearchParams({ startDate: params.startDate, endDate: params.endDate })
    if (params.teacherId) search.append('teacherId', params.teacherId)
    return api.get<AttendanceSummaryItem[]>(apiService.value, `/staff-attendance/summary?${search.toString()}`)
  }

  // ---------------------------------------------------------------------------
  // Audit event log
  // ---------------------------------------------------------------------------

  const getEvents = (params: { staffId?: string; limit?: number } = {}) => {
    const search = new URLSearchParams()
    if (params.staffId) search.append('staffId', params.staffId)
    if (params.limit) search.append('limit', String(params.limit))
    const qs = search.toString()
    return api.get<StaffAttendanceEvent[]>(apiService.value, `/staff-attendance/events${qs ? `?${qs}` : ''}`)
  }

  // ---------------------------------------------------------------------------
  // Policy CRUD
  // ---------------------------------------------------------------------------

  const getPolicies = () => {
    return api.get<AttendancePolicy[]>(apiService.value, '/staff-attendance/policies')
  }

  const createPolicy = (data: AttendancePolicyDto) => {
    return api.post<AttendancePolicy>(apiService.value, '/staff-attendance/policies', data)
  }

  const updatePolicy = (id: string, data: AttendancePolicyDto) => {
    return api.patch<AttendancePolicy>(apiService.value, `/staff-attendance/policies/${id}`, data)
  }

  const deletePolicy = (id: string) => {
    return api.delete<{ message: string }>(apiService.value, `/staff-attendance/policies/${id}`)
  }

  return {
    getQrPayload,
    getTeacherStaticQr,
    scanAttendance,
    autoScan,
    getMyHistory,
    getAllAttendances,
    getSummary,
    getEvents,
    getPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
  }
}
