import React, { useEffect, useState } from "react";
import { getDemoOverview } from "../../services/demoService";

function DemoJobs() {
  const [jobs, setJobs] = useState([]);

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
          <p className="font-semibold text-primary">_/ Featured demo jobs</p>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-2">
            See the platform in motion
          </h2>
        </div>
        <span className="text-sm text-text-secondary">No database required</span>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {jobs.map((job) => (
          <article key={job.id} className="border border-neutral-300 p-5">
            <p className="text-sm text-text-secondary">{job.company}</p>
            <h3 className="font-semibold text-lg text-text-primary mt-2">
              {job.title}
            </h3>
            <p className="text-sm text-text-secondary mt-3">
              {job.location} · {job.type}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DemoJobs;