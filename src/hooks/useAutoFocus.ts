import { useEffect } from "react";

export function useAutoFocus(deps: any[] = []) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const first = document.querySelector(
        'input:not([type="hidden"]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled])'
      ) as HTMLElement | null;

      first?.focus();
    }, 80);

    return () => clearTimeout(timer);
  }, deps);
}
