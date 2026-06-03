import { beforeEach, describe, expect, it, vi } from "vitest";

const { askMock, historyMock } = vi.hoisted(() => ({
  askMock: vi.fn(),
  historyMock: vi.fn(),
}));

vi.mock("@/services/api/aiApi", () => ({
  aiApi: {
    ask: askMock,
    history: historyMock,
  },
}));

import { useChatStore } from "@/store/chatStore";

describe("chatStore", () => {
  beforeEach(() => {
    askMock.mockReset();
    historyMock.mockReset();
    useChatStore.getState().clear();
  });

  it("keeps the user message and stores a readable error when AI request fails", async () => {
    askMock.mockRejectedValue(new Error("GigaChat временно недоступен"));

    await useChatStore.getState().sendMessage(7, "Разбери эту задачу");

    const state = useChatStore.getState();
    expect(state.messagesByCourse[7]).toHaveLength(1);
    expect(state.messagesByCourse[7]?.[0]?.content).toBe("Разбери эту задачу");
    expect(state.errorByCourse[7]).toBe("GigaChat временно недоступен");
    expect(state.isSendingByCourse[7]).toBe(false);
  });

  it("prefers backend detail over a generic axios status message", async () => {
    askMock.mockRejectedValue({
      message: "Request failed with status code 502",
      response: {
        data: {
          detail:
            "Не удалось подключиться к GigaChat. Проверьте ключ и сетевые SSL-настройки.",
        },
      },
    });

    await useChatStore.getState().sendMessage(7, "Как дела?");

    const state = useChatStore.getState();
    expect(state.messagesByCourse[7]).toHaveLength(1);
    expect(state.errorByCourse[7]).toBe(
      "Не удалось подключиться к GigaChat. Проверьте ключ и сетевые SSL-настройки.",
    );
    expect(state.isSendingByCourse[7]).toBe(false);
  });
});
