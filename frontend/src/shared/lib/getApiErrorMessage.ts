export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ECONNABORTED"
  ) {
    return "AI-сервис отвечает слишком долго. Попробуйте ещё раз через несколько секунд.";
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data;

    if (typeof data === "object" && data !== null && "detail" in data) {
      if (typeof data.detail === "string") {
        return data.detail;
      }

      if (Array.isArray(data.detail)) {
        const details = data.detail
          .map((item) =>
            typeof item === "object" &&
            item !== null &&
            "msg" in item &&
            typeof item.msg === "string"
              ? item.msg
              : "",
          )
          .filter(Boolean)
          .join(", ");

        if (details) {
          return details;
        }
      }
    }
  }

  if (
    error instanceof Error &&
    error.message.toLowerCase().includes("timeout")
  ) {
    return "AI-сервис отвечает слишком долго. Попробуйте ещё раз через несколько секунд.";
  }

  return error instanceof Error ? error.message : fallback;
};
