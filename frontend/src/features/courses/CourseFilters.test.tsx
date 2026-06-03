import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CourseFilters } from "@/features/courses/CourseFilters";

describe("CourseFilters", () => {
  it("renders accessible labels and emits filter patches", () => {
    const onFiltersChange = vi.fn();

    render(
      <CourseFilters
        filters={{ search: "", category: "all", level: "all" }}
        categories={["Математика", "Физика"]}
        levels={["Beginner", "Advanced"]}
        onFiltersChange={onFiltersChange}
      />,
    );

    const search = screen.getByLabelText("Поиск по курсам");
    const category = screen.getByLabelText("Категория");
    const level = screen.getByLabelText("Уровень");

    expect(search).toBeInTheDocument();
    expect(category).toBeInTheDocument();
    expect(level).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "егэ" } });
    fireEvent.change(category, { target: { value: "Математика" } });
    fireEvent.change(level, { target: { value: "Advanced" } });

    expect(onFiltersChange).toHaveBeenNthCalledWith(1, { search: "егэ" });
    expect(onFiltersChange).toHaveBeenNthCalledWith(2, {
      category: "Математика",
    });
    expect(onFiltersChange).toHaveBeenNthCalledWith(3, {
      level: "Advanced",
    });
  });
});
