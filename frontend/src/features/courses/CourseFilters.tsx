import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CourseFilters as CourseFiltersType } from "@/types/api";

interface CourseFiltersProps {
  filters: Required<CourseFiltersType>;
  categories: string[];
  levels: string[];
  onFiltersChange: (patch: Partial<Required<CourseFiltersType>>) => void;
}

export function CourseFilters({
  filters,
  categories,
  levels,
  onFiltersChange,
}: CourseFiltersProps): JSX.Element {
  return (
    <div className="grid gap-3 rounded-xl border border-border/65 bg-card/52 p-4 shadow-sm supports-[backdrop-filter]:bg-card/24 backdrop-blur-2xl backdrop-saturate-150 md:grid-cols-3">
      <Input
        placeholder="Поиск по курсам"
        value={filters.search}
        onChange={(event) => onFiltersChange({ search: event.target.value })}
      />

      <Select value={filters.category} onChange={(event) => onFiltersChange({ category: event.target.value })}>
        <option value="all">Все категории</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </Select>

      <Select value={filters.level} onChange={(event) => onFiltersChange({ level: event.target.value })}>
        <option value="all">Все уровни</option>
        {levels.map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </Select>
    </div>
  );
}
