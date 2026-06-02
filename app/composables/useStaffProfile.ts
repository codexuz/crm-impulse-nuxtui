import { api } from '~/lib/api'
import { useAuth } from '~/composables/useAuth'
import type {
  StaffProfile,
  CreateStaffProfileDto,
  UpdateStaffProfileDto,
  StaffShift,
  CreateStaffShiftDto,
} from '~/types/attendance'

export const useStaffProfile = () => {
  const { apiService } = useAuth()

  // ---------------------------------------------------------------------------
  // Profile CRUD
  // ---------------------------------------------------------------------------

  const getAllProfiles = async () => {
    return await api.get<StaffProfile[]>(apiService.value, '/staff-profile')
  }

  const getProfileByStaffId = async (staffId: string): Promise<StaffProfile | null> => {
    try {
      return await api.get<StaffProfile>(apiService.value, `/staff-profile/staff/${staffId}`)
    } catch {
      return null
    }
  }

  const createProfile = async (data: CreateStaffProfileDto) => {
    return await api.post<StaffProfile>(apiService.value, '/staff-profile', data)
  }

  const updateProfile = async (id: string, data: UpdateStaffProfileDto) => {
    return await api.patch<StaffProfile>(apiService.value, `/staff-profile/${id}`, data)
  }

  const deleteProfile = async (id: string) => {
    return await api.delete<{ message: string }>(apiService.value, `/staff-profile/${id}`)
  }

  // ---------------------------------------------------------------------------
  // Shift CRUD  — /staff-profile/:profileId/shifts
  // ---------------------------------------------------------------------------

  const getShifts = async (profileId: string) => {
    return await api.get<StaffShift[]>(apiService.value, `/staff-profile/${profileId}/shifts`)
  }

  const addShift = async (profileId: string, data: CreateStaffShiftDto) => {
    return await api.post<StaffShift>(apiService.value, `/staff-profile/${profileId}/shifts`, data)
  }

  const updateShift = async (shiftId: string, data: Partial<CreateStaffShiftDto>) => {
    return await api.patch<StaffShift>(apiService.value, `/staff-profile/shifts/${shiftId}`, data)
  }

  const removeShift = async (shiftId: string) => {
    return await api.delete<{ message: string }>(apiService.value, `/staff-profile/shifts/${shiftId}`)
  }

  return {
    getAllProfiles,
    getProfileByStaffId,
    createProfile,
    updateProfile,
    deleteProfile,
    getShifts,
    addShift,
    updateShift,
    removeShift,
  }
}
