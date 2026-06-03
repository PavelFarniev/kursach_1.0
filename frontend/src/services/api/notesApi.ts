import { API_ENDPOINTS } from "@/shared/constants/api";
import { readMockStoredNotes } from "@/shared/mocks/mockPulse";
import { apiClient } from "@/services/api/client";
import { USE_MOCK_API } from "@/services/api/config";
import type { CreateNotePayload } from "@/types/api";
import type { CourseNote } from "@/types/domain";

export const notesApi = {
  async my(): Promise<CourseNote[]> {
    if (USE_MOCK_API) {
      return readMockStoredNotes();
    }

    const response = await apiClient.get<CourseNote[]>(API_ENDPOINTS.myNotes);
    return response.data;
  },

  async create(payload: CreateNotePayload): Promise<CourseNote> {
    if (USE_MOCK_API) {
      return {
        id: Date.now(),
        courseId: payload.courseId,
        content: payload.content,
        createdAt: new Date().toISOString(),
      };
    }

    const response = await apiClient.post<CourseNote>(API_ENDPOINTS.notes, payload);
    return response.data;
  },

  async remove(noteId: number): Promise<void> {
    if (USE_MOCK_API) {
      return;
    }

    await apiClient.delete(`${API_ENDPOINTS.notes}/${noteId}`);
  },
};
