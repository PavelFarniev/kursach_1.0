import { create } from "zustand";

import { aiApi } from "@/services/api/aiApi";
import type { ChatMessage } from "@/types/domain";

interface ChatState {
  messagesByCourse: Record<number, ChatMessage[]>;
  isLoadingHistoryByCourse: Record<number, boolean>;
  isSendingByCourse: Record<number, boolean>;
  errorByCourse: Record<number, string | null>;
  loadHistory: (courseId: number) => Promise<void>;
  sendMessage: (courseId: number, message: string) => Promise<void>;
  clear: () => void;
}

const toUserMessage = (content: string): ChatMessage => ({
  id: `local-user-${Date.now()}`,
  role: "user",
  content,
  createdAt: new Date().toISOString(),
});

const toAssistantMessage = (content: string): ChatMessage => ({
  id: `local-assistant-${Date.now()}`,
  role: "assistant",
  content,
  createdAt: new Date().toISOString(),
});

export const useChatStore = create<ChatState>((set, get) => ({
  messagesByCourse: {},
  isLoadingHistoryByCourse: {},
  isSendingByCourse: {},
  errorByCourse: {},

  loadHistory: async (courseId) => {
    set((state) => ({
      isLoadingHistoryByCourse: {
        ...state.isLoadingHistoryByCourse,
        [courseId]: true,
      },
      errorByCourse: {
        ...state.errorByCourse,
        [courseId]: null,
      },
    }));

    try {
      const history = await aiApi.history(courseId);
      set((state) => ({
        messagesByCourse: {
          ...state.messagesByCourse,
          [courseId]: history.messages,
        },
        isLoadingHistoryByCourse: {
          ...state.isLoadingHistoryByCourse,
          [courseId]: false,
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось загрузить историю чата";
      set((state) => ({
        isLoadingHistoryByCourse: {
          ...state.isLoadingHistoryByCourse,
          [courseId]: false,
        },
        errorByCourse: {
          ...state.errorByCourse,
          [courseId]: message,
        },
      }));
    }
  },

  sendMessage: async (courseId, message) => {
    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

    const userMessage = toUserMessage(trimmed);

    set((state) => ({
      messagesByCourse: {
        ...state.messagesByCourse,
        [courseId]: [...(state.messagesByCourse[courseId] ?? []), userMessage],
      },
      isSendingByCourse: {
        ...state.isSendingByCourse,
        [courseId]: true,
      },
      errorByCourse: {
        ...state.errorByCourse,
        [courseId]: null,
      },
    }));

    try {
      const response = await aiApi.ask({ courseId, message: trimmed });

      set((state) => ({
        messagesByCourse: {
          ...state.messagesByCourse,
          [courseId]: [...(state.messagesByCourse[courseId] ?? []), toAssistantMessage(response.answer)],
        },
        isSendingByCourse: {
          ...state.isSendingByCourse,
          [courseId]: false,
        },
      }));
    } catch (error) {
      const fallback =
        error instanceof Error ? error.message : "Ошибка AI-ассистента. Попробуйте ещё раз через минуту.";
      set((state) => ({
        isSendingByCourse: {
          ...state.isSendingByCourse,
          [courseId]: false,
        },
        errorByCourse: {
          ...state.errorByCourse,
          [courseId]: fallback,
        },
      }));

      const current = get().messagesByCourse[courseId] ?? [];
      set((state) => ({
        messagesByCourse: {
          ...state.messagesByCourse,
          [courseId]: current.filter((item) => item.id !== userMessage.id),
        },
      }));
    }
  },

  clear: () => {
    set({
      messagesByCourse: {},
      isLoadingHistoryByCourse: {},
      isSendingByCourse: {},
      errorByCourse: {},
    });
  },
}));
