import { API_ENDPOINTS } from "@/shared/constants/api";
import { mockPulseApi } from "@/shared/mocks/mockData";
import { apiClient } from "@/services/api/client";
import { USE_MOCK_API } from "@/services/api/config";
import { readStoredTokens } from "@/services/api/tokenStorage";
import type { LearningPulse } from "@/types/domain";

export const pulseApi = {
  async overview(): Promise<LearningPulse> {
    if (USE_MOCK_API) {
      return mockPulseApi.overview(readStoredTokens().accessToken ?? undefined);
    }

    const response = await apiClient.get<LearningPulse>(API_ENDPOINTS.userPulse);
    return response.data;
  },
};
