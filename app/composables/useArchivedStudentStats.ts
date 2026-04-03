import { createApiService, api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import type {
  ArchivedStudentStatistics,
  ArchivedStudentStatisticsQuery,
} from "~/types";

export const useArchivedStudentStats = () => {
  const { apiService } = useAuth();

  const fetchStatistics = async (query: ArchivedStudentStatisticsQuery = {}) => {
    const params = new URLSearchParams();
    if (query.startDate) params.append("startDate", query.startDate);
    if (query.endDate) params.append("endDate", query.endDate);
    if (query.teacher_id) params.append("teacher_id", query.teacher_id);
    if (query.group_id) params.append("group_id", query.group_id);

    const qs = params.toString();
    const endpoint = `/users/archived-students/statistics${qs ? `?${qs}` : ""}`;

    return await api.get<ArchivedStudentStatistics>(apiService.value, endpoint);
  };

  return { fetchStatistics };
};
