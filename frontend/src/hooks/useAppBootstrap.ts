import { useEffect } from "react";

import { readStoredTokens } from "@/services/api/tokenStorage";
import { useAuthStore } from "@/store/authStore";
import { useCourseNotesStore } from "@/store/courseNotesStore";
import { useThemeStore } from "@/store/themeStore";

export const useAppBootstrap = (): void => {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const notesBootstrap = useCourseNotesStore((state) => state.bootstrap);
  const themeBootstrap = useThemeStore((state) => state.bootstrap);

  useEffect(() => {
    themeBootstrap();

    void (async () => {
      await bootstrap();

      if (readStoredTokens().accessToken) {
        await notesBootstrap();
      }
    })();
  }, [bootstrap, notesBootstrap, themeBootstrap]);
};
