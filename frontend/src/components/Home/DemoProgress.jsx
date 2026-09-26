import React from "react";
import { useI18n } from "../../i18n/I18nContext";

const progressItems = [
  { key: "demoApi", title: "home.progress.demoApi", status: "home.progress.ready", detail: "home.progress.demoApiDetail" },
  { key: "candidate", title: "home.progress.candidateFlow", status: "home.progress.inProgress", detail: "home.progress.candidateDetail" },
  { key: "employer", title: "home.progress.employerFlow", status: "home.progress.inProgress", detail: "home.progress.employerDetail" },
];

function DemoProgress() {
  const { t } = useI18n();
  return (
    <section className="px-6 md:px-20 py-12 bg-neutral-50">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="font-semibold text-primary">{t("home.progress.eyebrow")}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-2">
            {t("home.progress.title")}
          </h2>
        </div>
        <p className="text-text-secondary max-w-2xl">
          {t("home.progress.intro")}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {progressItems.map((item) => (
          <article
            key={item.key}
            className="border border-neutral-300 bg-white p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold text-lg text-text-primary">
                {t(item.title)}
              </h3>
              <span className="text-xs font-semibold text-primary bg-neutral-100 px-3 py-1">
                {t(item.status)}
              </span>
            </div>
            <p className="text-sm leading-6 text-text-secondary">
              {t(item.detail)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DemoProgress;
