import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function scrollToTop(): void {
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 300);
}

export function getCookies(): Record<string, any> {
  return document.cookie
    .split(";")
    .filter(Boolean)
    .reduce((acc, pair) => {
      const [key, ...val] = pair.split("=");
      acc[decodeURIComponent(key).trim()] = decodeURIComponent(
        val.join("=")
      ).trim();

      return acc;
    }, {} as Record<string, any>);
}
