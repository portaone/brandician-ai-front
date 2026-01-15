import { config } from "./config";

interface ICookiesConsent {
  ad_storage: "denied" | "granted";
  analytics_storage: "denied" | "granted";
  ad_user_data: "denied" | "granted";
  ad_personalization: "denied" | "granted";
}

window.dataLayer = window.dataLayer || [];

function initGTM(...initArgs: any[]): void {
  if (initArgs.length > 0) {
    gtag(...initArgs);
  }

  if (!config.gtmId) {
    console.warn("[GTM] GTM ID is not configured.");
    return;
  }

  document.head.insertBefore(getScriptTag(), document.head.childNodes[0]);
  document.body.insertBefore(getNoScriptTag(), document.body.childNodes[0]);
}

function gtag(...args: any[]): void {
  window.dataLayer.push(arguments);
}

function getScriptTag(): HTMLScriptElement {
  const scriptTag: HTMLScriptElement = document.createElement("script");

  scriptTag.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${config.gtmId}');`;

  return scriptTag;
}

function getNoScriptTag(): HTMLElement {
  const noScriptTag: HTMLElement = document.createElement("noscript");

  noScriptTag.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${config.gtmId}"
height="0" width="0" style="display:none;visibility:hidden"></iframe>`;

  return noScriptTag;
}

export { initGTM, gtag, type ICookiesConsent };
