// Seeds a small set of demo data for local development: one employer with a company profile and
// two jobs, one job seeker with a profile and an application. Safe to run more than once — it
// skips anything that already exists instead of creating duplicates.
// Usage: npm run seed:demo
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../db/db.js";
import { User } from "../models/user.model.js";
import { CompanyProfile } from "../models/companyProfile.model.js";
import { JobSeekerProfile } from "../models/jobSeekerProfile.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";

dotenv.config();

const upsertUser = async ({ name, email, password, role }) => {
  let user = await User.findOne({ email });
  if (user) return user;
  user = await User.create({
    name,
    email,
    username: email.split("@")[0].toLowerCase(),
    password,
    role,
    emailVerified: true,
  });
  console.log(`Created ${role}: ${email} / ${password}`);
  return user;
};

const main = async () => {
  await connectDB();

  const employer = await upsertUser({
    name: "Demo Employer",
    email: "employer@kormopulse.demo",
    password: "demopass1",
    role: "employer",
  });
  if (!employer.companyProfile) {
    const company = await CompanyProfile.create({
      companyName: "Kormopulse Demo Ltd",
      companyDescription: "A demo company used to showcase Kormopulse locally.",
      industry: "Technology",
      doneOnboarding: true,
      address: { city: "Dhaka", state: "Dhaka", country: "Bangladesh" },
    });
    employer.companyProfile = company._id;
    await employer.save({ validateBeforeSave: false });
  }

  const seeker = await upsertUser({
    name: "Demo Seeker",
    email: "seeker@kormopulse.demo",
    password: "demopass1",
    role: "jobSeeker",
  });
  if (!seeker.jobSeekerProfile) {
    const profile = await JobSeekerProfile.create({
      name: seeker.name,
      skills: ["JavaScript", "React", "Node.js", "MongoDB"],
      yearsOfExperience: "2",
      location: "Dhaka",
      primaryRole: "Full-stack Developer",
      bio: "Demo job seeker profile for local testing.",
    });
    seeker.jobSeekerProfile = profile._id;
    await seeker.save({ validateBeforeSave: false });
  }

  const existingJobs = await Job.countDocuments({ postedBy: employer._id });
  if (existingJobs === 0) {
    const jobs = await Job.insertMany([
      {
        title: "Frontend Developer",
        description: "<p>Build delightful interfaces with React and Tailwind CSS.</p>",
        skills: ["React", "JavaScript", "Tailwind CSS"],
        experience: { min: 1, max: 3 },
        salary: { min: 40000, max: 70000, currency: "BDT" },
        jobType: "full-time",
        workMode: "hybrid",
        location: "Dhaka",
        category: "software-development",
        applicationDeadline: new Date(Date.now() + 30 * 86400000),
        company: employer.companyProfile,
        postedBy: employer._id,
      },
      {
        title: "Backend Developer",
        description: "<p>Design and build REST APIs with Node.js and MongoDB.</p>",
        skills: ["Node.js", "MongoDB", "Express"],
        experience: { min: 1, max: 4 },
        salary: { min: 50000, max: 90000, currency: "BDT" },
        jobType: "full-time",
        workMode: "remote",
        location: "Dhaka",
        category: "software-development",
        applicationDeadline: new Date(Date.now() + 30 * 86400000),
        company: employer.companyProfile,
        postedBy: employer._id,
      },
    ]);
    console.log(`Created ${jobs.length} demo jobs`);

    const existingApplication = await Application.findOne({ applicant: seeker._id });
    if (!existingApplication) {
      const job = jobs[1];
      await Application.create({
        job: job._id,
        applicant: seeker._id,
        coverLetter: "I would love to help build Kormopulse's backend.",
        status: "pending",
        statusHistory: [{ status: "pending", changedAt: new Date(), note: "Demo application" }],
      });
      job.applicants.push({ user: seeker._id, status: "applied", appliedAt: new Date() });
      job.applicationCount += 1;
      await job.save();
      console.log("Created a demo application");
    }
  } else {
    console.log("Demo jobs already exist, skipping.");
  }

  console.log("\nDemo accounts:");
  console.log("  Employer: employer@kormopulse.demo / demopass1");
  console.log("  Job seeker: seeker@kormopulse.demo / demopass1");

  await mongoose.disconnect();
  process.exit(0);
};

main().catch((error) => {
  console.error("Seeding failed:", error.message);
  process.exit(1);
});
