import { User } from "../types";

export function initClarity(
  cookies: Record<string, string>,
  user: User | null,
): void {
  if (!cookies?.Analytics || !user) return;

  const setUserId = () => {
    if (window.clarity) {
      window.clarity("set", "userId", user.email);
      return true;
    }
    return false;
  };

  if (!setUserId()) {
    const interval = setInterval(() => {
      if (setUserId()) {
        clearInterval(interval);
      }
    }, 1000);
  }
}
