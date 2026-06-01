import { api } from '~/lib/api'
import { useAuth } from '~/composables/useAuth'
import type {
  StaffProfile,
  CreateStaffProfileDto,
  UpdateStaffProfileDto
} from '~/types/attendance'

export const useStaffProfile = () => {
  const { apiService } = useAuth()

  /**
   * List all staff profiles (Admin)
   */
  const getAllProfiles = async () => {
    return await api.get<StaffProfile[]>(apiService.value, '/staff-profile')
  }

  /**
   * Get a staff profile by its staff (user) id. Returns null on 404 so callers
   * can distinguish "no profile yet" from a real error.
   */
  const getProfileByStaffId = async (staffId: string): Promise<StaffProfile | null> => {
    try {
      return await api.get<StaffProfile>(apiService.value, `/staff-profile/staff/${staffId}`)
    } catch (err: any) {
      if (typeof err?.message === 'string' && err.message.includes('404')) {
        return null
      }
      // The backend throws a NotFoundException for missing profiles; treat any
      // "topilmadi" message as "not configured yet".
      if (typeof err?.message === 'string' && err.message.includes('topilmadi')) {
        return null
      }
      throw err
    }
  }

  /**
   * Create a staff profile (Admin)
   */
  const createProfile = async (data: CreateStaffProfileDto) => {
    return await api.post<StaffProfile>(apiService.value, '/staff-profile', data)
  }

  /**
   * Update a staff profile by id (Admin)
   */
  const updateProfile = async (id: string, data: UpdateStaffProfileDto) => {
    return await api.patch<StaffProfile>(apiService.value, `/staff-profile/${id}`, data)
  }

  /**
   * Delete a staff profile by id (Admin)
   */
  const deleteProfile = async (id: string) => {
    return await api.delete<{ message: string }>(apiService.value, `/staff-profile/${id}`)
  }

  return {
    getAllProfiles,
    getProfileByStaffId,
    createProfile,
    updateProfile,
    deleteProfile
  }
}
