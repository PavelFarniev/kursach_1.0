import { useEffect } from "react";

import { readStoredTokens } from "@/services/api/tokenStorage";
import { useAuthStore } from "@/store/authStore";
import { useCourseNotesStore } from "@/store/courseNotesStore";

export const useAppBootstrap = (): void => {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const notesBootstrap = useCourseNotesStore((state) => state.bootstrap);

  useEffect(() => {
    void (async () => {
      await bootstrap();

      if (readStoredTokens().accessToken) {
        await notesBootstrap();
      }
    })();
  }, [bootstrap, notesBootstrap]);
};
