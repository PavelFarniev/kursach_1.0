import type { TokenPair } from "@/types/api";

interface AuthSessionHandlers {
  onSessionUpdated?: (tokens: TokenPair) => void;
  onUnauthorized?: () => void;
}

let handlers: AuthSessionHandlers = {};

export const registerAuthSessionHandlers = (nextHandlers: AuthSessionHandlers): void => {
  handlers = nextHandlers;
};

export const notifySessionUpdated = (tokens: TokenPair): void => {
  handlers.onSessionUpdated?.(tokens);
};

export const notifyUnauthorized = (): void => {
  handlers.onUnauthorized?.();
};
