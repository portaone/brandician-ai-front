import Clarity from "@microsoft/clarity";
import { CookieModal } from "@schlomoh/react-cookieconsent";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { config } from "../../config";

const CookieConsent: React.FC = () => {
  useEffect(() => {
    const cookieInfo = document.querySelector(".cookie-consent-info");

    if (cookieInfo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
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

    document.body.style.overflow = "auto";
  };

  const handleReject = () => {
    document.body.style.overflow = "auto";
  };

  return (
    <CookieModal
      enableManagement
      infoContent={info}
      managementButtonText="Manage cookie preferences"
      cookieCategories={["Analytics"]}
      accentColor="#FD615E"
      containerStyle={{ accentColor: "#FD615E", overflow: "auto" }}
      onAccept={handleAccept}
      onDecline={handleReject}
    />
  );
};

export default CookieConsent;
