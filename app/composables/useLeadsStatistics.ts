import { createApiService, api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import type {
  LeadsStatisticsResponse,
  LeadsStatisticsQuery,
} from "~/types";

export const useLeadsStatistics = () => {
  const { apiService } = useAuth();

  const fetchLeadsStatistics = async (query: LeadsStatisticsQuery = {}) => {
    const params = new URLSearchParams();
    if (query.startDate) params.append("startDate", query.startDate);
    if (query.endDate) params.append("endDate", query.endDate);
    if (query.teacher_id) params.append("teacher_id", query.teacher_id);

    const qs = params.toString();
    const endpoint = `/lead-trial-lessons/leads-statistics${qs ? `?${qs}` : ""}`;

    return await api.get<LeadsStatisticsResponse>(apiService.value, endpoint);
  };

  return { fetchLeadsStatistics };
};
