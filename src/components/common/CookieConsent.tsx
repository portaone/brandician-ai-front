import { CookieBanner } from "@schlomoh/react-cookieconsent";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { gtag, ICookiesConsent, initGTM } from "../../gtag";
import { getCookies } from "../../lib/utils";

function initCookies(): void {
  const cookies: Record<string, any> = getCookies();

  const consentCookies: ICookiesConsent = mapCookiesToGtagArgs(
    JSON.parse(cookies?.selection || "{}")
  );

  gtag("consent", "update", consentCookies);
}

function mapCookiesToGtagArgs(
  cookies: Record<string, string>
): ICookiesConsent {
  return {
    analytics_storage: cookies?.Analytics ? "granted" : "denied",
    ad_storage: cookies?.Marketing ? "granted" : "denied",
    ad_user_data: cookies?.Marketing ? "granted" : "denied",
    ad_personalization: cookies?.Marketing ? "granted" : "denied",
  };
}

const CookieConsent: React.FC = () => {
  useEffect(() => {
    initGTM("consent", "default", {
      ad_storage: "denied",
      analytics_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }, []);

  useEffect(() => {
    setTimeout(() => {
      const cookieButtonContainer: HTMLElement | null = document.querySelector(
        ".cookie-consent-info"
      )?.nextElementSibling as HTMLElement | null;

      if (cookieButtonContainer) {
        cookieButtonContainer.style.flexWrap = "wrap";
      }
    }, 1000);
    initCookies();
  }, []);
  const info: JSX.Element = (
    <span className="mr-2 mb-2 md:mb-0 cookie-consent-info">
      We use cookies to improve your experience. By using this site, you agree
      to our{" "}
      <Link
        to="/cookies"
        className="underline text-primary-500 hover:text-primary-300"
      >
        Cookie Policy
      </Link>
      .
    </span>
  );

  const handleAccept = (cookies: any) => {
    gtag("consent", "update", mapCookiesToGtagArgs(cookies));
    window.dataLayer.push({ event: "gtm.init_consent" });
  };

  return (
    <CookieBanner
      enableManagement
      infoContent={info}
      managementContent={info}
      managementButtonText="Manage cookie preferences"
      cookieCategories={["Analytics", "Marketing"]}
      accentColor="#FD615E"
      containerStyle={{ accentColor: "#FD615E" }}
      onAccept={handleAccept}
    />
  );
};

export default CookieConsent;
