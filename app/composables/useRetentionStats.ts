import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import type {
  TeacherRetentionReport,
  TeacherRetentionWithTeacher,
  RetentionStatsQuery,
} from "~/types";

export const useRetentionStats = () => {
  const { apiService } = useAuth();

  const buildQuery = (query: RetentionStatsQuery): string => {
    const params = new URLSearchParams();
    if (query.months) params.append("months", String(query.months));
    if (query.year) params.append("year", String(query.year));
    if (query.month) params.append("month", String(query.month));
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  /** Monthly retention for every teacher (admin/owner/manager view). */
  const fetchAllTeachersRetention = async (
    query: RetentionStatsQuery = {},
  ) => {
    const endpoint = `/retention-stats/teachers${buildQuery(query)}`;
    return await api.get<TeacherRetentionWithTeacher[]>(
      apiService.value,
      endpoint,
    );
  };

  /** Monthly retention for a single teacher. */
  const fetchTeacherRetention = async (
    teacherId: string,
    query: RetentionStatsQuery = {},
  ) => {
    const endpoint = `/retention-stats/teacher/${teacherId}${buildQuery(query)}`;
    return await api.get<TeacherRetentionReport>(apiService.value, endpoint);
  };

  return { fetchAllTeachersRetention, fetchTeacherRetention };
};
