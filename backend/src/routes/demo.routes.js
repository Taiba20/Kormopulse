import { Router } from "express";

const router = Router();

const demoOverview = {
  status: "demo-ready",
  message: "Kormopulse demo data is available without MongoDB.",
  stats: [
    { label: "Open roles", value: 24 },
    { label: "Partner companies", value: 8 },
    { label: "Applications tracked", value: 136 },
  ],
  featuredJobs: [
    {
      id: "demo-frontend-engineer",
      title: "Frontend Engineer",
      company: "Northstar Labs",
      location: "Dhaka, Bangladesh",
      type: "Full-time",
    },
    {
      id: "demo-product-designer",
      title: "Product Designer",
      company: "Orbit Works",
      location: "Remote",
      type: "Contract",
    },
    {
      id: "demo-growth-analyst",
      title: "Growth Analyst",
      company: "PulseStack",
      location: "Hybrid",
      type: "Full-time",
    },
  ],
};

router.get("/overview", (req, res) => {
  res.status(200).json(demoOverview);
});

export default router;
