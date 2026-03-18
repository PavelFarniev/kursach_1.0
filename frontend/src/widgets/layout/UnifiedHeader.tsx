import { BookOpenText, GraduationCap, LogOut, UserRound } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { cn } from "@/shared/lib/utils";
import { useAuthStore } from "@/store/authStore";

interface UnifiedHeaderProps {
  sticky?: boolean;
}

export function UnifiedHeader({ sticky = false }: UnifiedHeaderProps): JSX.Element {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const isProfilePage = location.pathname.startsWith("/profile");
  const isCoursesPage = location.pathname.startsWith("/courses");

  return (
    <header className={cn("z-20 border-b border-border/80 bg-card/92 backdrop-blur-md", sticky && "sticky top-0")}>
      <div className="container">
        <div className="flex h-14 items-center justify-between gap-3 px-1 md:px-2">
          <NavLink to="/" className="inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold leading-tight">KillExam</p>
              <p className="text-[10px] tracking-wide text-muted-foreground md:text-[11px]">BrainDead</p>
            </div>
          </NavLink>

          <nav className="hidden flex-1 items-center justify-center md:flex">
            <NavLink
              to="/courses"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-semibold transition",
                isCoursesPage ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
              )}
            >
              <BookOpenText className="h-4 w-4" />
              Курсы
            </NavLink>
          </nav>

          {user ? (
            <div className="inline-flex items-center rounded-xl border border-border/75 bg-card/88 p-1">
              <NavLink
                to="/profile"
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold transition",
                  isProfilePage ? "bg-secondary text-secondary-foreground" : "hover:bg-secondary/70",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg",
                    isProfilePage ? "bg-background/60" : "bg-secondary",
                  )}
                >
                  <UserRound className="h-4 w-4" />
                </div>
                <span className="max-w-[152px] truncate">{user.fullName}</span>
              </NavLink>

              <div className="mx-1 h-5 w-px bg-border/70" />

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-sm font-semibold text-foreground transition hover:bg-secondary/70"
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center rounded-xl border border-border/75 bg-card/88 p-1">
              <Link to="/login" className="rounded-lg px-2.5 py-1 text-sm font-semibold text-foreground transition hover:bg-secondary/70">
                Войти
              </Link>
              <Link to="/register" className="rounded-lg bg-secondary px-2.5 py-1 text-sm font-semibold text-secondary-foreground transition hover:opacity-90">
                Регистрация
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
