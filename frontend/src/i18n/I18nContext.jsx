import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { updateLanguage } from "../services/userService";
import en from "./locales/en";
import bn from "./locales/bn";
import { translate } from "./translate";
import { localizeServerMessage } from "./locales/serverMessages";

const STORAGE_KEY = "kormopulse-lang";
const dictionaries = { en, bn };

const readStoredLanguage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "bn" ? stored : null;
  } catch {
    // localStorage unavailable (private mode, blocked storage)
    return null;
  }
};

const getInitialLanguage = () =>
  readStoredLanguage() ||
  (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("bn") ? "bn" : "en");

const PAGE_TITLES = {
  en: "Kormopulse | Careers that move",
  bn: "Kormopulse | এগিয়ে চলার ক্যারিয়ার",
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLanguage);
  const userData = useSelector((store) => store.auth.userData);
  const userId = userData?._id;
  const serverLanguage = userData?.language;

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    document.title = PAGE_TITLES[lang];
  }, [lang]);

  // An explicit choice is remembered on this device and, when signed in, on the account so that
  // emails and notifications are written in the same language.
  const setLang = useCallback(
    (code) => {
      setLangState(code);
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        // ignore write failures (private mode, storage full)
      }
      if (userId) updateLanguage(code).catch(() => {});
    },
    [userId]
  );

  // After signing in: a language chosen on this device wins and is pushed to the account; without
  // one (fresh device) the account's saved language is adopted.
  useEffect(() => {
    if (!userId) return;
    const stored = readStoredLanguage();
    if (stored) {
      if (serverLanguage !== stored) updateLanguage(stored).catch(() => {});
    } else if (serverLanguage === "en" || serverLanguage === "bn") {
      setLangState(serverLanguage);
    }
    // only when the signed-in account changes, not on every profile refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const locale = lang === "bn" ? "bn-BD" : "en-US";
  const formatCount = useCallback((count) => new Intl.NumberFormat(locale).format(count), [locale]);
  const t = useCallback((key, params) => translate(dictionaries, lang, key, params, formatCount), [lang, formatCount]);

  // Like t(), but returns `fallback` (usually the raw value from the API) when there is no translation.
  const tOr = useCallback(
    (key, fallback) => {
      const result = translate(dictionaries, lang, key);
      return result === key ? fallback : result;
    },
    [lang]
  );

  // Turns an axios error into a message in the current language: the API's own message when we
  // have a translation for it, otherwise the given fallback key.
  const tError = useCallback(
    (error, fallbackKey) => {
      const message = error?.response?.data?.message;
      return message ? localizeServerMessage(lang, message) : fallbackKey ? translate(dictionaries, lang, fallbackKey) : "";
    },
    [lang]
  );

  // Translates free text that comes from the API (demo content); unknown text is returned unchanged.
  const tData = useCallback((text) => localizeServerMessage(lang, text), [lang]);

  // Locale-aware formatting so Bangla mode shows Bangla digits and month names.
  const formatNumber = useCallback((value, options) => new Intl.NumberFormat(locale, options).format(value), [locale]);
  const formatDate = useCallback(
    (value, options = { year: "numeric", month: "short", day: "numeric" }) =>
      value ? new Date(value).toLocaleDateString(locale, options) : "",
    [locale]
  );
  const formatTime = useCallback(
    (value) => (value ? new Date(value).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) : ""),
    [locale]
  );

  // "5 minutes ago" style text for a past date, in the current language.
  const timeAgo = useCallback(
    (date) => {
      const minutes = Math.floor(Math.abs(Date.now() - new Date(date).getTime()) / 60000);
      if (minutes < 1) return translate(dictionaries, lang, "time.justNow");
      const n = (count) => new Intl.NumberFormat(locale).format(count);
      if (minutes < 60) return translate(dictionaries, lang, "time.minutesAgo", { n: n(minutes) });
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return translate(dictionaries, lang, "time.hoursAgo", { n: n(hours) });
      const days = Math.floor(hours / 24);
      if (days < 30) return translate(dictionaries, lang, "time.daysAgo", { n: n(days) });
      return translate(dictionaries, lang, "time.monthsAgo", { n: n(Math.floor(days / 30)) });
    },
    [lang, locale]
  );

  const value = useMemo(
    () => ({ lang, setLang, t, tOr, tError, tData, locale, formatNumber, formatDate, formatTime, timeAgo }),
    [lang, setLang, t, tOr, tError, tData, locale, formatNumber, formatDate, formatTime, timeAgo]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside <I18nProvider>");
  return context;
};
