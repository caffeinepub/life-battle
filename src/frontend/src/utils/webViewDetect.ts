/** Returns true if running inside an Android/iOS WebView wrapper */
export function isInWebView(): boolean {
  const ua = navigator.userAgent;
  // Android WebView markers
  if (/wv\)/.test(ua)) return true;
  if (
    /Android/.test(ua) &&
    /Version\/\d+\.\d+/.test(ua) &&
    !/Chrome\/\d+/.test(ua)
  )
    return true;
  // Common in-app browser markers
  if (/FBAN|FBAV|Instagram|Line\/|Twitter\/|MicroMessenger/.test(ua))
    return true;
  // GoNative / Median wrappers
  if (/gonative|median/.test(ua.toLowerCase())) return true;
  return false;
}

/** Opens the current URL in Chrome on Android using intent scheme */
export function openInChrome(): void {
  const url = window.location.href;
  // Try Chrome intent URL (Android)
  const intentUrl = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
  window.location.href = intentUrl;
}

/** Opens the current URL in the system default browser */
export function openInSystemBrowser(): void {
  // Fallback: use _blank which some wrappers intercept and send to browser
  window.open(window.location.href, "_blank", "noopener,noreferrer");
}
