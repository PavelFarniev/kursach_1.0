import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const authState = {
  isLoading: false,
  error: null as string | null,
  login: vi.fn().mockResolvedValue(undefined),
  register: vi.fn().mockResolvedValue(undefined),
  clearError: vi.fn(),
};

const notesState = {
  bootstrap: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/store/authStore", () => ({
  useAuthStore: (selector: (state: typeof authState) => unknown) =>
    selector(authState),
}));

vi.mock("@/store/courseNotesStore", () => ({
  useCourseNotesStore: (
    selector: (state: typeof notesState) => unknown,
  ) => selector(notesState),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

import { AuthForm } from "@/features/auth/AuthForm";

describe("AuthForm", () => {
  it("shows a client-side validation error for invalid login email", async () => {
    render(
      <MemoryRouter>
        <AuthForm mode="login" />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "broken-email" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByText("Введите корректный email")).toBeVisible();
    expect(authState.login).not.toHaveBeenCalled();
  });
});
