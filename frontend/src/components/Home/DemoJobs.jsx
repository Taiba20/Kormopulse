import React, { useEffect, useState } from "react";
import { getDemoOverview } from "../../services/demoService";
import { useI18n } from "../../i18n/I18nContext";

function DemoJobs() {
  const [jobs, setJobs] = useState([]);
  const { t, tData } = useI18n();

  useEffect(() => {
    getDemoOverview()
      .then((overview) => setJobs(overview.featuredJobs || []))
      .catch(() => setJobs([]));
  }, []);

  if (!jobs.length) return null;

  return (
    <section className="px-6 md:px-20 py-12">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="font-semibold text-primary">{t("home.demoJobs.eyebrow")}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-2">
            {t("home.demoJobs.title")}
          </h2>
        </div>
        <span className="text-sm text-text-secondary">{t("home.demoJobs.note")}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {jobs.map((job) => (
          <article key={job.id} className="border border-neutral-300 p-5">
            <p className="text-sm text-text-secondary">{job.company}</p>
            <h3 className="font-semibold text-lg text-text-primary mt-2">
              {tData(job.title)}
            </h3>
            <p className="text-sm text-text-secondary mt-3">
              {tData(job.location)} · {tData(job.type)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DemoJobs;