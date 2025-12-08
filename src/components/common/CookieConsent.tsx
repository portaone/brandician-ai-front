import Clarity from "@microsoft/clarity";
import { CookieBanner } from "@schlomoh/react-cookieconsent";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { config } from "../../config";

const CookieConsent: React.FC = () => {
  useEffect(() => {
    setTimeout(() => {
      const cookieButtonContainer: HTMLElement | null = document.querySelector(
        ".cookie-consent-info"
      )?.nextElementSibling as HTMLElement | null;

      console.log(cookieButtonContainer);

      if (cookieButtonContainer) {
        cookieButtonContainer.style.flexWrap = "wrap";
      }
    }, 1000);
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
    if (cookies.Analytics) {
      Clarity.init(config.clarityId);
      Clarity.consentV2({ analytics_Storage: "granted", ad_Storage: "denied" });
    }
  };
  return (
    <CookieBanner
      enableManagement
      infoContent={info}
      managementButtonText="Manage cookie preferences"
      cookieCategories={["Analytics"]}
      accentColor="#FD615E"
      containerStyle={{ accentColor: "#FD615E" }}
      onAccept={handleAccept}
    />
  );
};

export default CookieConsent;
