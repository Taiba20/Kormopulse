import React from "react";
import { useI18n } from "../../i18n/I18nContext";

function HomeStats() {
  const { t, formatNumber } = useI18n();
  return (
    <div className="px-10 pt-10">
      <div className="grid md:grid-cols-3">
        <div className="flex flex-col gap-1 md:border border-neutral-300 border-l-transparent justify-center items-center text-primary font-semibold text-3xl md:text-4xl py-10 md:py-16">
          {formatNumber(130)}K +<span className="text-base md:text-2xl">{t("home.stats.techJobs")}</span>
        </div>

        <div className="flex flex-col gap-1 md:border border-neutral-300 border-l-transparent border-r-transparent justify-center items-center text-accent font-semibold text-3xl md:text-4xl py-10 md:py-16">
          {formatNumber(6000000)} <span className="text-base md:text-2xl">{t("home.stats.matches")}</span>
        </div>
        <div className="flex flex-col gap-1 md:border border-neutral-300 border-r-transparent justify-center items-center text-secondary font-semibold text-3xl md:text-4xl py-16">
          {formatNumber(8)}M +{" "}
          <span className="text-base md:text-2xl">
            {t("home.stats.candidates")}
          </span>
        </div>
      </div>
      <div className="grid md:grid-cols-2">
        <div className="flex flex-col gap-1 md:border border-neutral-300 border-l-transparent border-b-transparent justify-center items-center text-primary-light font-semibold text-3xl md:text-4xl py-10 md:py-16">
          {formatNumber(27)}K +<span className="text-base md:text-2xl">{t("home.stats.companies")}</span>
        </div>
        <div className="flex flex-col gap-1 md:border border-neutral-300 border-r-transparent border-b-transparent   justify-center items-center text-accent-dark font-semibold text-3xl md:text-4xl py-10 md:py-16">
          {formatNumber(1.4)}M+ <span className="text-base md:text-2xl">{t("home.stats.hires")}</span>
        </div>
      </div>
    </div>
  );
}

export default HomeStats;
