import { api } from '~/lib/api'
import { useAuth } from '~/composables/useAuth'
import type { ScanStaffAttendanceDto, AttendanceRecord } from '~/types/attendance'

export const useStaffAttendance = () => {
  const { apiService } = useAuth()

  /**
   * Get QR payload for a group (Admin)
   */
  const getQrPayload = async (groupId: string) => {
    return await api.get<{ qr_code: string }>(apiService.value, `/staff-attendance/qr-payload/${groupId}`)
  }

  /**
   * Get static teacher QR (Admin)
   */
  const getTeacherStaticQr = async (teacherId: string) => {
    return await api.get<{ qr_code: string }>(apiService.value, `/staff-attendance/static-qr/${teacherId}`)
  }

  /**
   * Manual Scan (Teacher/Admin)
   */
  const scanAttendance = async (data: ScanStaffAttendanceDto) => {
    return await api.post(apiService.value, '/staff-attendance/scan', data)
  }

  /**
   * Automatic Scan (Mainly for Bot/Admin triggers)
   */
  const autoScan = async (teacherId: string, type: 'in' | 'out' = 'in') => {
    return await api.post(apiService.value, '/staff-attendance/automatic-scan', { teacher_id: teacherId, type })
  }

  /**
   * Get current teacher's attendance history
   */
  const getMyHistory = () => {
    return useFetch<AttendanceRecord[]>(`${apiService.value.baseUrl}/staff-attendance/my-attendances`, {
      key: 'my-staff-attendance',
      headers: apiService.value.headers
    })
  }

  return {
    getQrPayload,
    getTeacherStaticQr,
    scanAttendance,
    autoScan,
    getMyHistory
  }
}
