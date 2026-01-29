import { useEffect } from "react";

export function useAutoFocus(deps: any[] = []) {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if any input or textarea element already has focus
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement
      ) {
        return;
      }

      const first = document.querySelector(
        'input:not([type="hidden"]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled])',
      ) as HTMLElement | null;

      first?.focus();
    }, 80);

    return () => clearTimeout(timer);
  }, deps);
}
