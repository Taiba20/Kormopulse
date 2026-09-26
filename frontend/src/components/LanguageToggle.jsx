import React from "react";
import { useI18n } from "../i18n/I18nContext";
import { LANGUAGES } from "../i18n/languages";

/**
 * EN | বাংলা switch.
 * `tone="onPrimary"` is for the coloured navbar; the default suits normal page backgrounds.
 */
function LanguageToggle({ className = "", tone = "onPrimary" }) {
  const { lang, setLang, t } = useI18n();
  const onPrimary = tone === "onPrimary";

  return (
    <div
      role="group"
      aria-label={t("language.label")}
      className={`inline-flex items-center overflow-hidden rounded-full border text-xs font-semibold ${
        onPrimary ? "border-white/40" : "border-neutral-300 bg-background"
      } ${className}`}
    >
      {LANGUAGES.map((option) => {
        const active = lang === option.code;
        return (
          <button
            key={option.code}
            type="button"
            onClick={() => setLang(option.code)}
            aria-pressed={active}
            title={option.label}
            className={`px-2.5 py-1.5 transition-colors ${
              onPrimary
                ? active
                  ? "bg-text-inverse text-primary"
                  : "hover:bg-white/20"
                : active
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:bg-neutral-100"
            }`}
          >
            {option.short}
          </button>
        );
      })}
    </div>
  );
}

export default LanguageToggle;
