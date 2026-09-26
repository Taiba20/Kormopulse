import cron from "node-cron";
import { config } from "../config/index.js";
import { runDueJobAlerts } from "../services/alert.service.js";

let tasks = [];

/** Starts background jobs. Skipped in tests; disable in production with DISABLE_SCHEDULER=true. */
export const startScheduler = () => {
  if (config.isTest || process.env.DISABLE_SCHEDULER === "true") return;

  const expression = process.env.JOB_ALERTS_CRON || "0 * * * *"; // hourly
  if (!cron.validate(expression)) {
    console.error(`[scheduler] invalid JOB_ALERTS_CRON "${expression}", job alerts disabled`);
    return;
  }

  tasks.push(
    cron.schedule(expression, async () => {
      try {
        const result = await runDueJobAlerts();
        if (result.checked) console.log("[scheduler] job alerts:", result);
      } catch (error) {
        console.error("[scheduler] job alert run failed:", error.message);
      }
    })
  );
  console.log(`[scheduler] job alerts scheduled (${expression})`);
};

export const stopScheduler = () => {
  tasks.forEach((task) => task.stop());
  tasks = [];
};
