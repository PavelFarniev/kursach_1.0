import { beforeEach, describe, expect, it } from "vitest";

import {
  mockAIApi,
  mockAuthApi,
  mockEnrollmentsApi,
  mockPulseApi,
  resetMockApiState,
} from "@/shared/mocks/mockData";

describe("mockPulseApi", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetMockApiState();
  });

  it("builds pulse statistics from mock activity, progress, notes and AI questions", async () => {
    const tokens = await mockAuthApi.login({
      email: "demo@student.ai",
      password: "demo123",
    });

    await mockAuthApi.profile(tokens.accessToken);
    const enrollment = await mockEnrollmentsApi.enroll(1, tokens.accessToken);
    await mockEnrollmentsApi.updateProgress(enrollment.id, 60, tokens.accessToken);
    window.localStorage.setItem(
      "course-notes-storage",
      JSON.stringify({
        state: {
          notesByCourseId: {
            1: [
              {
                id: 501,
                courseId: 1,
                content: "Повторить параметры и таблицу знаков.",
                createdAt: new Date().toISOString(),
              },
            ],
          },
        },
        version: 3,
      }),
    );
    await mockAIApi.ask(
      {
        courseId: 1,
        message: "Помоги повторить тему с параметрами",
      },
      tokens.accessToken,
    );

    const pulse = await mockPulseApi.overview(tokens.accessToken);

    expect(pulse.today.readiness).toBeGreaterThan(0);
    expect(pulse.today.activityCount).toBeGreaterThan(0);
    expect(pulse.today.siteVisits).toBeGreaterThan(0);
    expect(pulse.today.streakDays).toBeGreaterThan(0);
    expect(pulse.today.weakestTopic).not.toBe("Пока не определена");
    expect(pulse.today.chart.some((value) => value > 0)).toBe(true);
    expect(pulse.today.plan).toHaveLength(3);
  });
});
