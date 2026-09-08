import React, { useEffect, useState } from "react";
import { getWorkflowPreviews } from "../../services/demoService";

function WorkflowPreview() {
  const [workflows, setWorkflows] = useState([]);

  useEffect(() => {
    getWorkflowPreviews()
      .then(setWorkflows)
      .catch(() => setWorkflows([]));
  }, []);

  if (!workflows.length) return null;

  return (
    <section className="px-6 md:px-20 py-12">
      <div className="mb-8">
        <p className="font-semibold text-primary">_/ Workflow preview</p>
        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-2">
          See how Kormopulse connects people and opportunities
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {workflows.map((workflow) => (
          <article
            key={workflow.title}
            className="border border-neutral-300 bg-white p-5"
          >
            <h3 className="font-semibold text-lg text-text-primary">
              {workflow.title}
            </h3>
            <ol className="mt-4 space-y-3 text-sm text-text-secondary">
              {workflow.steps.map((step, index) => (
                <li key={step}>
                  <span className="font-semibold text-primary mr-2">
                    0{index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}

export default WorkflowPreview;