import React from "react";

const progressItems = [
  {
    title: "Demo API",
    status: "Ready",
    detail: "Health and overview endpoints can run before MongoDB is configured.",
  },
  {
    title: "Candidate flow",
    status: "In progress",
    detail: "Signup, profile, saved jobs, and applications are wired into the UI.",
  },
  {
    title: "Employer flow",
    status: "In progress",
    detail: "Company profile, job posting, and applicant screens are available.",
  },
];

function DemoProgress() {
  return (
    <section className="px-6 md:px-20 py-12 bg-neutral-50">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="font-semibold text-primary">_/ Project Progress</p>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-2">
            Kormopulse demo checklist
          </h2>
        </div>
        <p className="text-text-secondary max-w-2xl">
          A compact view of what the team can show now while the database and
          deployment work continue.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {progressItems.map((item) => (
          <article
            key={item.title}
            className="border border-neutral-300 bg-white p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold text-lg text-text-primary">
                {item.title}
              </h3>
              <span className="text-xs font-semibold text-primary bg-neutral-100 px-3 py-1">
                {item.status}
              </span>
            </div>
            <p className="text-sm leading-6 text-text-secondary">
              {item.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DemoProgress;
