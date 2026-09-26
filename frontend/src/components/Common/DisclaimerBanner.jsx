import React from "react";
import { useI18n } from "../../i18n/I18nContext";

function DisclaimerBanner() {
  const { t } = useI18n();
  return (
    <div className="bg-warning text-text-primary py-px px-4 w-full text-center mb-5 font-xs sm:font-sm md:font-base lg:font-lg xl:font-xl">
      {t("jobs.disclaimer")}
    </div>
  );
}

export default DisclaimerBanner;
