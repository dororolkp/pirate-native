import { useEffect, useState, useSyncExternalStore } from "react";
import { Text, View } from "react-native";
import { usePathname } from "expo-router";
import Head from "expo-router/head";
import { Button, Panel, s } from "./ui";
import { SITE_ROUTES as routes } from "../lib/site-metadata";
const measurement = process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID ?? "";
const validMeasurement = /^G-[A-Z0-9]+$/.test(measurement);
const CONSENT_KEY = "pirate-analytics-consent-v1";
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

function consent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}
function subscribeConsent(update: () => void) {
  window.addEventListener("pirate-consent", update);
  window.addEventListener("storage", update);
  return () => {
    window.removeEventListener("pirate-consent", update);
    window.removeEventListener("storage", update);
  };
}
const serverConsent = () => false;

export function WebPresence() {
  const path = usePathname();
  const allowed = useSyncExternalStore(
    subscribeConsent,
    consent,
    serverConsent,
  );
  const [title, description] = routes[path] ?? routes["/"];
  const canonical = `https://pirate-native.vercel.app${path === "/" ? "/" : path}`;
  useEffect(() => {
    if (!validMeasurement || !allowed) return;
    const analytics = window as AnalyticsWindow;
    const flags = window as unknown as Record<string, unknown>;
    flags[`ga-disable-${measurement}`] = false;
    analytics.dataLayer ??= [];
    // gtag expects an arguments object in dataLayer, not a plain array.
    analytics.gtag ??= function () {
      analytics.dataLayer!.push(arguments);
    };
    analytics.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    analytics.gtag("consent", "update", { analytics_storage: "granted" });
    analytics.gtag("js", new Date());
    analytics.gtag("config", measurement, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurement}`;
    document.head.appendChild(script);
    return () => {
      analytics.gtag?.("consent", "update", { analytics_storage: "denied" });
      flags[`ga-disable-${measurement}`] = true;
      script.remove();
    };
  }, [allowed]);
  useEffect(() => {
    if (!allowed || !validMeasurement) return;
    // Fixed route names only: omit query strings, user IDs, pose, missions and commands.
    if (routes[path])
      (window as AnalyticsWindow).gtag?.("event", "page_view", {
        page_title: `${title} | Pirate`,
        page_location: canonical,
        page_referrer: "",
      });
  }, [allowed, path, title, canonical]);
  return (
    <Head>
      <title>{title} | Pirate</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta
        name="robots"
        content={
          path === "/settings" || !(path in routes)
            ? "noindex, follow"
            : "index, follow"
        }
      />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Pirate" />
      <meta property="og:title" content={`${title} | Pirate`} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={`${title} | Pirate`} />
      <meta name="twitter:description" content={description} />
      <meta name="theme-color" content="#443c91" />
    </Head>
  );
}

export function AnalyticsPreferences() {
  const choice = useSyncExternalStore(subscribeConsent, consent, serverConsent);
  const [message, setMessage] = useState("");
  const save = (value: boolean) => {
    try {
      localStorage.setItem(CONSENT_KEY, value ? "granted" : "denied");
      window.dispatchEvent(new Event("pirate-consent"));
      setMessage(
        value ? "Analytics enabled by your choice." : "Analytics disabled.",
      );
    } catch {
      setMessage(
        "Your browser blocked preference storage. Analytics remains off.",
      );
    }
  };
  return (
    <Panel
      title="Privacy & analytics"
      subtitle="Optional Google Analytics 4, web only. Off until you opt in."
    >
      <View style={s.body}>
        <Text style={s.text}>
          {validMeasurement
            ? "GA4 measurement ID configured."
            : "Analytics is not configured. Add a real GA4 measurement ID before deployment."}
        </Text>
        <Text style={s.caption}>
          Only public page views are sent. No robot poses, control commands,
          mission IDs, assistant questions or account identifiers. Google may
          process browser/device data after opt-in. Native apps do not include
          Google Analytics.
        </Text>
        <View style={s.row}>
          <Button
            label="Allow optional page analytics"
            selected={choice}
            disabled={!validMeasurement}
            onPress={() => save(true)}
          />
          <Button
            label="Keep analytics off"
            selected={!choice}
            onPress={() => save(false)}
          />
        </View>
        <Text accessibilityLiveRegion="polite" style={s.caption}>
          {message || "You can change this preference at any time."}
        </Text>
      </View>
    </Panel>
  );
}
