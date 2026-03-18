import { API_ENDPOINTS } from "@/shared/constants/api";
import { mockAIApi } from "@/shared/mocks/mockData";
import { apiClient } from "@/services/api/client";
import { USE_MOCK_API } from "@/services/api/config";
import type { AIAskPayload, AIAskResponse, AIHistoryResponse } from "@/types/api";

export const aiApi = {
  async ask(payload: AIAskPayload): Promise<AIAskResponse> {
    if (USE_MOCK_API) {
      return mockAIApi.ask(payload, localStorage.getItem("access_token") ?? undefined);
    }

    const response = await apiClient.post<AIAskResponse>(API_ENDPOINTS.aiAsk, payload);
    return response.data;
  },

  async history(courseId: number): Promise<AIHistoryResponse> {
    if (USE_MOCK_API) {
      return mockAIApi.history(courseId, localStorage.getItem("access_token") ?? undefined);
    }

    const response = await apiClient.get<AIHistoryResponse>(API_ENDPOINTS.aiHistory, {
      params: { courseId },
    });
    return response.data;
  },
};
