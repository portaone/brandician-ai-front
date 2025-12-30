import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function scrollToTop(): void {
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 300);
}
