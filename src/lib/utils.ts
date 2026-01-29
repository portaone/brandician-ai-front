import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function scrollToTop(): void {
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 300);
}

export function getConsentCookies(): Record<string, string> {
  const allCookies: Record<string, any> = document.cookie
    .split(";")
    .filter(Boolean)
    .reduce(
      (acc, pair) => {
        const [key, ...val] = pair.split("=");
        acc[decodeURIComponent(key).trim()] = decodeURIComponent(
          val.join("="),
        ).trim();

        return acc;
      },
      {} as Record<string, any>,
    );

  const consentCookies = JSON.parse(allCookies?.selection || "{}");

  if (allCookies?.selection) {
    reWriteConsentCookies(consentCookies);
  }

  return consentCookies;
}

export function reWriteConsentCookies(
  consentCookies: Record<string, string>,
): void {
  if (consentCookies.timestamp) {
    return;
  }

  const date = new Date();
  date.setMonth(date.getMonth() + 6);

  consentCookies.timestamp = date.toUTCString();
  const value = encodeURIComponent(JSON.stringify(consentCookies));

  document.cookie = `selection=${value}; expires=${date.toUTCString()}; path=/;`;
}
