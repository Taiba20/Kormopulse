import { Job } from "../models/job.model.js";
import { CompanyProfile } from "../models/companyProfile.model.js";
import { User } from "../models/user.model.js";
import { JobSeekerProfile } from "../models/jobSeekerProfile.model.js";
import { Application } from "../models/application.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateJobDescription, generateJobRecommendations, matchCandidates } from "../utils/groqAi.service.js";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

// Testing endpoints
const ping = (req, res) => {
  res.send({ msg: "API is healthy!" });
};

const authPing = (req, res) => {
  res.send("Job Auth is working");
};

// Create a new job posting
const createJob = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const jobData = req.body;

  console.log('Creating job for userId:', userId);
  console.log('Job data:', JSON.stringify(jobData, null, 2));

  // Get the user and verify they are an employer
  const user = await User.findById(userId);
  if (!user || user.role !== "employer") {
    throw new ApiError(403, "Only employers can create job postings");
  }

  // Get the company profile
  const companyProfile = await CompanyProfile.findById(user.companyProfile);
  if (!companyProfile) {
    throw new ApiError(404, "Company profile not found. Please complete your company onboarding first.");
  }

  // Process and clean the job data
  const processedJobData = {
    ...jobData,
    // Generate shortDescription from description if not provided
    shortDescription: jobData.shortDescription || 
      (jobData.description ? 
        DOMPurify.sanitize(jobData.description.replace(/<[^>]*>/g, '').substring(0, 200)) : 
        'No description available'),
    
    // Set default category if empty
    category: jobData.category || 'other',
    
    // Ensure additionalRequirements is an array
    additionalRequirements: Array.isArray(jobData.additionalRequirements) 
      ? jobData.additionalRequirements 
      : (jobData.additionalRequirements ? [jobData.additionalRequirements] : []),
    
    // Parse applicationDeadline properly
    applicationDeadline: jobData.applicationDeadline ? 
      (function() {
        try {
          // If it's just a day like "5 October", assume current year
          const dateStr = jobData.applicationDeadline;
          if (typeof dateStr === 'string' && !dateStr.includes(',') && !dateStr.includes('/') && !dateStr.includes('-')) {
            // Format like "5 October" - add current year
            const currentYear = new Date().getFullYear();
            return new Date(`${dateStr} ${currentYear}`);
          }
          return new Date(dateStr);
        } catch (error) {
          console.warn('Invalid date format, using default:', jobData.applicationDeadline);
          return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        }
      })() :
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
    
    // Ensure salary has all required fields
    salary: {
      min: Number(jobData.salary?.min) || 0,
      max: Number(jobData.salary?.max) || 0,
      currency: jobData.salary?.currency || 'USD',
      negotiable: Boolean(jobData.salary?.negotiable) || false,
    },
    
    // Set company and user references
    company: companyProfile._id,
    postedBy: userId,
  };

  // Remove any undefined, empty string fields, or empty keys that might cause issues
  Object.keys(processedJobData).forEach(key => {
    if (key === '' || processedJobData[key] === '' || processedJobData[key] === undefined || processedJobData[key] === null) {
      delete processedJobData[key];
    }
  });

  console.log('Processed job data:', JSON.stringify(processedJobData, null, 2));

  // Create job with processed data
  const job = await Job.create(processedJobData);

  // Populate the job with company details
  const populatedJob = await Job.findById(job._id)
    .populate('company', 'companyName companyLogo industry companyWebsite')
    .populate('postedBy', 'name email');

  return res.status(201).json(
    new ApiResponse(201, { job: populatedJob }, "Job created successfully")
  );
});

// Get all jobs with filtering and pagination
const getJobs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    location,
    jobType,
    workMode,
    category,
    company,
    minSalary,
    maxSalary,
    experience,
    datePosted,
  } = req.query;

  console.log('Raw query params:', req.query);

  const filter = { isActive: true };

  // Build search filters
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { skills: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  if (location) {
    filter.location = { $regex: location, $options: 'i' };
  }

  // Handle multiple job types (can be array or single value)
  if (jobType) {
    const jobTypes = Array.isArray(jobType) ? jobType : [jobType];
    if (jobTypes.length > 0) {
      filter.jobType = { $in: jobTypes };
    }
  }

  // Handle multiple work modes (can be array or single value)
  if (workMode) {
    const workModes = Array.isArray(workMode) ? workMode : [workMode];
    if (workModes.length > 0) {
      filter.workMode = { $in: workModes };
    }
  }

  if (category) {
    filter.category = category;
  }

  if (company) {
    filter.company = company;
  }

  // Salary range filtering
  if (minSalary || maxSalary) {
    const salaryFilter = {};
    if (minSalary && !isNaN(parseInt(minSalary))) {
      salaryFilter['salary.min'] = { $gte: parseInt(minSalary) };
    }
    if (maxSalary && !isNaN(parseInt(maxSalary))) {
      salaryFilter['salary.max'] = { $lte: parseInt(maxSalary) };
    }
    Object.assign(filter, salaryFilter);
  }

  // Experience filtering - job should accept candidates with user's experience
  if (experience && !isNaN(parseInt(experience))) {
    const expValue = parseInt(experience);
    filter['experience.min'] = { $lte: expValue };
    filter['experience.max'] = { $gte: expValue };
  }

  // Date posted filter
  if (datePosted) {
    const today = new Date();
    if (datePosted === "today") {
      filter.createdAt = { $gte: new Date(today.setHours(0, 0, 0, 0)) };
    } else if (datePosted === "yesterday") {
      filter.createdAt = {
        $gte: new Date(today.setDate(today.getDate() - 1)),
        $lt: new Date(today.setHours(0, 0, 0, 0)),
      };
    } else if (datePosted === "this_week") {
      filter.createdAt = {
        $gte: new Date(today.setDate(today.getDate() - 7)),
      };
    } else if (datePosted === "this_month") {
      filter.createdAt = {
        $gte: new Date(today.setMonth(today.getMonth() - 1)),
      };
    }
  }

  // Pagination
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const startIndex = (pageNumber - 1) * limitNumber;
  
  console.log('=== getJobs Debug Info ===');
  console.log('Raw query params:', req.query);
  console.log('Constructed filter:', JSON.stringify(filter, null, 2));
  
  const total = await Job.countDocuments(filter);
  console.log('Total jobs matching filter:', total);

  const jobs = await Job.find(filter)
    .populate('company', 'companyName companyLogo industry companyWebsite address')
    .populate('postedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limitNumber)
    .select('-applicants');

  console.log('Jobs retrieved:', jobs.length);
  console.log('Sample job:', jobs[0] ? {
    id: jobs[0]._id,
    title: jobs[0].title,
    company: jobs[0].company,
    isActive: jobs[0].isActive
  } : 'No jobs found');

  // Pagination result
  const pagination = {
    current: pageNumber,
    total: Math.ceil(total / limitNumber),
    hasNext: startIndex + limitNumber < total,
    hasPrev: pageNumber > 1,
    totalJobs: total,
  };

  return res.status(200).json(
    new ApiResponse(200, { jobs, pagination }, "Jobs fetched successfully")
  );
});

const getJobById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let job = await Job.findById(id)
    .populate('company', 'companyName companyLogo industry companyWebsite address companyDescription')
    .populate('postedBy', 'name email');

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  // Sanitize the job description
  if (job.description) {
    job.description = DOMPurify.sanitize(job.description);
  }

  // Increment view count
  await Job.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

  // Convert to object and add application count
  job = job.toObject();
  job.numberOfApplicants = job.applicants ? job.applicants.length : 0;

  // Remove applicant details for privacy
  delete job.applicants;

  return res.status(200).json(
    new ApiResponse(200, job, "Job fetched successfully")
  );
});

// Get jobs posted by the current employer
const getMyJobs = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, status = 'all' } = req.query;

  const user = await User.findById(userId);
  if (!user || user.role !== "employer") {
    throw new ApiError(403, "Only employers can access this endpoint");
  }

  const filter = { postedBy: userId };
  
  if (status !== 'all') {
    filter.isActive = status === 'active';
  }

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const startIndex = (pageNumber - 1) * limitNumber;
  const total = await Job.countDocuments(filter);

  const jobs = await Job.find(filter)
    .populate('company', 'companyName companyLogo')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limitNumber);

  const pagination = {
    current: pageNumber,
    total: Math.ceil(total / limitNumber),
    hasNext: startIndex + limitNumber < total,
    hasPrev: pageNumber > 1,
  };

  return res.status(200).json(
    new ApiResponse(200, { jobs, pagination }, "Your jobs fetched successfully")
  );
});

// Legacy method name for compatibility
const postJob = createJob;

const sendJobDescription = asyncHandler(async (req, res) => {
  const { role, _id } = req.user;
  const jobDetails = req.body;

  if (role !== "employer") {
    throw new ApiError(
      403,
      "Unauthorized action. Only users with an 'employer' role are permitted to generate job descriptions."
    );
  }

  const user = await User.findById(_id);
  const companyProfile = await CompanyProfile.findById(user.companyProfile);
  
  if (!companyProfile) {
    throw new ApiError(404, "Company profile not found");
  }

  if (companyProfile.aiUseLimit < 1) {
    throw new ApiError(
      429,
      "Quota exceeded. The user has reached the limit for free job description generations. An upgrade to the plan is required to continue using this feature."
    );
  }

  const response = await generateJobDescription(jobDetails);

  if (response) {
    companyProfile.aiUseLimit -= 1;
    await companyProfile.save();
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, response, "Job description generated successfully")
    );
});

const applyForJob = asyncHandler(async (req, res) => {
  console.log("=== Apply for Job Debug ===");
  console.log("User:", req.user?._id, "Role:", req.user?.role);
  console.log("Job ID:", req.params.id);
  console.log("Request body:", req.body);
  
  const { role, _id } = req.user;
  const jobId = req.params.id;
  
  // Handle case where req.body might be undefined or empty
  const { coverLetter = "", resume = "" } = req.body || {};

  if (role !== "jobSeeker") {
    console.log("Role check failed. User role:", role);
    throw new ApiError(403, "Only job seekers can apply for jobs");
  }

  console.log("Looking for job with ID:", jobId);
  const job = await Job.findById(jobId);
  if (!job) {
    console.log("Job not found for ID:", jobId);
    throw new ApiError(404, "Job not found");
  }

  console.log("Job found:", job.title, "Active:", job.isActive);
  if (!job.isActive) {
    throw new ApiError(400, "This job is no longer accepting applications");
  }

  // Check if user already applied using Application model
  console.log("Checking for existing application...");
  const existingApplication = await Application.findOne({ job: jobId, applicant: _id });
  if (existingApplication) {
    console.log("User already applied. Application ID:", existingApplication._id);
    throw new ApiError(400, "You have already applied for this job");
  }

  // Also check if user is already in job.applicants array
  const alreadyInJobApplicants = job.applicants.some(applicant => 
    applicant.user.toString() === _id.toString()
  );
  if (alreadyInJobApplicants) {
    console.log("User already in job applicants array");
    throw new ApiError(400, "You have already applied for this job");
  }

  // Create application document
  console.log("Creating new application...");
  const application = await Application.create({
    job: jobId,
    applicant: _id,
    coverLetter: coverLetter,
    resume: resume,
    status: "pending", // Use correct enum value for Application model
  });
  console.log("Application created:", application._id);

  // Also add to Job.applicants for backward compatibility
  console.log("Adding to job applicants...");
  job.applicants.push({
    user: _id,
    coverLetter: coverLetter,
    status: "applied", // Use correct enum value for Job model
    appliedAt: new Date(),
  });

  job.applicationCount += 1;
  await job.save();
  console.log("Job updated. New application count:", job.applicationCount);

  console.log("=== Apply for Job Success ===");
  return res.status(200).json(
    new ApiResponse(200, { application }, "Job applied successfully")
  );
});

const saveJob = asyncHandler(async (req, res) => {
  const { role, _id } = req.user;
  const jobId = req.params.id;
  
  if (role !== "jobSeeker") {
    throw new ApiError(403, "Only job seekers can save jobs");
  }

  const user = await User.findById(_id);
  const jobSeekerProfile = await JobSeekerProfile.findById(user.jobSeekerProfile);
  
  if (!jobSeekerProfile) {
    throw new ApiError(404, "Job seeker profile not found");
  }

  if (jobSeekerProfile.savedJobs.includes(jobId)) {
    throw new ApiError(400, "Job is already saved");
  }

  jobSeekerProfile.savedJobs.push(jobId);
  await jobSeekerProfile.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "Job saved successfully")
  );
});

const getSavedJobs = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const user = await User.findById(_id);
  const jobSeekerProfile = await JobSeekerProfile.findById(user.jobSeekerProfile)
    .populate({
      path: 'savedJobs',
      populate: {
        path: 'company',
        select: 'companyName companyLogo industry'
      }
    });

  if (!jobSeekerProfile) {
    throw new ApiError(404, "Job seeker profile not found");
  }

  return res.status(200).json(
    new ApiResponse(200, jobSeekerProfile.savedJobs, "Saved jobs fetched successfully")
  );
});

const removeSavedJob = asyncHandler(async (req, res) => {
  const { role, _id } = req.user;
  const jobId = req.params.id;

  if (role !== "jobSeeker") {
    throw new ApiError(403, "Only job seekers can remove saved jobs");
  }

  const user = await User.findById(_id);
  const jobSeekerProfile = await JobSeekerProfile.findById(user.jobSeekerProfile);
  
  if (!jobSeekerProfile) {
    throw new ApiError(404, "Job seeker profile not found");
  }

  const index = jobSeekerProfile.savedJobs.indexOf(jobId);
  if (index === -1) {
    throw new ApiError(400, "Job is not saved");
  }

  jobSeekerProfile.savedJobs.splice(index, 1);
  await jobSeekerProfile.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "Successfully removed job from saved jobs list")
  );
});

const getJobLocations = asyncHandler(async (req, res) => {
  let filter = { isActive: true };

  if (req.query.search) {
    filter.location = { $regex: req.query.search, $options: "i" };
  }

  let locations = await Job.distinct("location", filter);

  if (!locations.length) {
    return res.status(200).json(
      new ApiResponse(200, [], "No job locations found")
    );
  }

  if (locations.length > 5) {
    locations = locations.slice(0, 5);
  }

  return res.status(200).json(
    new ApiResponse(200, locations, "Job locations fetched successfully")
  );
});

const getCompanies = asyncHandler(async (req, res) => {
  const companies = await CompanyProfile.find({
    doneOnboarding: true,
  }).select("companyName companyLogo industry companyWebsite companySize companySocialProfiles address");

  // Get job count for each company and convert to plain objects
  const companiesWithJobCount = await Promise.all(
    companies.map(async (company) => {
      const jobCount = await Job.countDocuments({ 
        company: company._id, 
        isActive: true 
      });
      const companyObject = company.toObject();
      companyObject.jobCount = jobCount;
      return companyObject;
    })
  );

  return res.status(200).json(
    new ApiResponse(200, companiesWithJobCount, "Companies fetched successfully")
  );
});

// Get applications for a specific job (for employers)
const getJobApplications = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;
  const userId = req.user._id;
  const { page = 1, limit = 10, status = 'all' } = req.query;

  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  // Check if the user is the owner of this job
  if (job.postedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only view applications for your own job postings");
  }

  let applicants = job.applicants;
  
  if (status !== 'all') {
    applicants = applicants.filter(app => app.status === status);
  }

  // Paginate applicants
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const startIndex = (pageNumber - 1) * limitNumber;
  const endIndex = pageNumber * limitNumber;

  // Populate user details for paginated applicants
  const populatedJob = await Job.findById(jobId)
    .populate({
      path: 'applicants.user',
      select: 'name email',
      populate: {
        path: 'jobSeekerProfile',
        select: 'primaryRole yearsOfExperience skills location',
      },
    });

  const result = {
    docs: populatedJob.applicants.slice(startIndex, endIndex),
    totalDocs: applicants.length,
    limit: limitNumber,
    page: pageNumber,
    totalPages: Math.ceil(applicants.length / limitNumber),
    hasNextPage: endIndex < applicants.length,
    hasPrevPage: pageNumber > 1,
  };

  return res.status(200).json(
    new ApiResponse(200, result, "Job applications fetched successfully")
  );
});

// Get user's job applications (for job seekers)
const getMyApplications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, status = 'all' } = req.query;

  const user = await User.findById(userId);
  if (!user || user.role !== "jobSeeker") {
    throw new ApiError(403, "Only job seekers can access this endpoint");
  }

  const filter = { 'applicants.user': userId };
  
  if (status !== 'all') {
    filter['applicants.status'] = status;
  }

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const startIndex = (pageNumber - 1) * limitNumber;
  const total = await Job.countDocuments(filter);

  const jobs = await Job.find(filter)
    .populate('company', 'companyName companyLogo industry')
    .sort({ 'applicants.appliedAt': -1 })
    .skip(startIndex)
    .limit(limitNumber);

  // Filter applicants to only show current user's applications
  const result = {
    docs: jobs.map(job => ({
      ...job.toObject(),
      myApplication: job.applicants.find(app => 
        app.user.toString() === userId.toString()
      ),
      applicants: undefined, // Remove all applicants for privacy
    })),
    totalDocs: total,
    limit: limitNumber,
    page: pageNumber,
    totalPages: Math.ceil(total / limitNumber),
    hasNextPage: startIndex + limitNumber < total,
    hasPrevPage: pageNumber > 1,
  };

  return res.status(200).json(
    new ApiResponse(200, result, "Your applications fetched successfully")
  );
});

// Get all applications for company's jobs (for employers)
const getMyCompanyApplications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, status = 'all' } = req.query;

  console.log("=== getMyCompanyApplications called ===");
  console.log("User ID:", userId);
  console.log("Query params:", { page, limit, status });

  const user = await User.findById(userId);
  if (!user || user.role !== "employer") {
    throw new ApiError(403, "Only employers can access this endpoint");
  }

  // Find all jobs posted by this company
  const companyJobs = await Job.find({ postedBy: userId }).select('_id title');
  console.log("Company jobs found:", companyJobs.length);
  const jobIds = companyJobs.map(job => job._id);

  if (jobIds.length === 0) {
    console.log("No jobs found for this employer");
    return res.status(200).json(
      new ApiResponse(200, { applications: [], pagination: { current: 1, total: 0, hasNext: false, hasPrev: false } }, "No applications found")
    );
  }

  // Use Application model instead of Job.applicants
  const filter = { job: { $in: jobIds } };
  if (status !== 'all') {
    filter.status = status;
  }

  console.log("Filter for applications:", filter);

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  // Get applications directly from Application model
  const applications = await Application.find(filter)
    .populate({
      path: 'applicant',
      select: 'name email userProfile jobSeekerProfile',
      populate: [
        {
          path: 'userProfile',
          select: 'profilePicture address bio location yearsOfExperience socialProfiles workExperience education skills name resume'
        },
        {
          path: 'jobSeekerProfile',
          select: 'profilePicture address bio location yearsOfExperience socialProfiles workExperience education skills name resume'
        }
      ]
    })
    .populate({
      path: 'job',
      select: '_id title'
    })
    .sort({ appliedAt: -1 })
    .skip(skip)
    .limit(limitNumber);

  const total = await Application.countDocuments(filter);

  console.log("Applications found:", applications.length);
  console.log("Total applications count:", total);

  // Map to the expected format
  const formattedApplications = applications.map(app => {
    const applicant = app.applicant;
    const userProfile = applicant.userProfile || {};
    const jobSeekerProfile = applicant.jobSeekerProfile || {};
    
    // Profile picture can be in either userProfile or jobSeekerProfile
    const profilePicture = userProfile.profilePicture || 
                          jobSeekerProfile.profilePicture || 
                          "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";

    return {
      applicantProfile: {
        _id: applicant._id,
        name: applicant.name || userProfile.name || jobSeekerProfile.name,
        email: applicant.email,
        profilePicture: profilePicture,
        userProfile: {
          ...userProfile,
          ...jobSeekerProfile, // Merge both profiles
          profilePicture: profilePicture, // Ensure profile picture is available
          name: applicant.name || userProfile.name || jobSeekerProfile.name
        }
      },
      jobDetails: {
        _id: app.job._id,
        title: app.job.title
      },
      status: app.status,
      appliedAt: app.appliedAt,
      coverLetter: app.coverLetter,
      resume: app.resume
    };
  });

  console.log("Sample formatted application:", formattedApplications[0] ? {
    jobTitle: formattedApplications[0].jobDetails.title,
    userName: formattedApplications[0].applicantProfile?.userProfile?.name || formattedApplications[0].applicantProfile?.name,
    status: formattedApplications[0].status
  } : "No applications");

  const pagination = {
    current: pageNumber,
    total: Math.ceil(total / limitNumber),
    hasNext: skip + limitNumber < total,
    hasPrev: pageNumber > 1,
  };

  console.log("Final response - applications count:", formattedApplications.length);
  console.log("Pagination:", pagination);

  return res.status(200).json(
    new ApiResponse(200, { applications: formattedApplications, pagination }, "Company applications fetched successfully")
  );
});

// Shortlist a candidate using Application model
const shortlistCandidate = asyncHandler(async (req, res) => {
  const { jobId, applicantId } = req.body;
  const userId = req.user._id;

  const job = await Job.findById(jobId);
  if (!job || job.postedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized or job not found");
  }

  // Update Application model
  const application = await Application.findOneAndUpdate(
    { job: jobId, applicant: applicantId },
    { status: "shortlisted", reviewedAt: new Date(), reviewedBy: userId },
    { new: true }
  ).populate('applicant', 'name email');

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  // Also update the status in Job.applicants array to keep both models in sync
  const applicantIndex = job.applicants.findIndex(app =>
    app.user.toString() === applicantId.toString()
  );

  if (applicantIndex !== -1) {
    job.applicants[applicantIndex].status = "interviewed"; // Map "shortlisted" to "interviewed" for Job model
    await job.save();
  }

  return res.status(200).json(
    new ApiResponse(200, application, "Candidate shortlisted successfully")
  );
});

// Remove from shortlist
const removeFromShortlist = asyncHandler(async (req, res) => {
  const { jobId, applicantId } = req.body;
  const userId = req.user._id;

  const job = await Job.findById(jobId);
  if (!job || job.postedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized or job not found");
  }

  // Update Application model
  const application = await Application.findOneAndUpdate(
    { job: jobId, applicant: applicantId },
    { status: "reviewed", reviewedAt: new Date(), reviewedBy: userId },
    { new: true }
  );

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  // Also update the status in Job.applicants array to keep both models in sync
  const applicantIndex = job.applicants.findIndex(app =>
    app.user.toString() === applicantId.toString()
  );

  if (applicantIndex !== -1) {
    job.applicants[applicantIndex].status = "reviewed"; // Map "reviewed" to "reviewed" for Job model
    await job.save();
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "Candidate removed from shortlist")
  );
});

// Reject candidate
const rejectCandidate = asyncHandler(async (req, res) => {
  const { jobId, applicantId } = req.body;
  const userId = req.user._id;

  const job = await Job.findById(jobId);
  if (!job || job.postedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized or job not found");
  }

  // Update Application model
  const application = await Application.findOneAndUpdate(
    { job: jobId, applicant: applicantId },
    { status: "rejected", reviewedAt: new Date(), reviewedBy: userId },
    { new: true }
  );

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  // Also update the status in Job.applicants array to keep both models in sync
  const applicantIndex = job.applicants.findIndex(app =>
    app.user.toString() === applicantId.toString()
  );

  if (applicantIndex !== -1) {
    job.applicants[applicantIndex].status = "rejected"; // Map "rejected" to "rejected" for Job model
    await job.save();
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "Candidate rejected")
  );
});

// Get applications for a job using Application model
const getJobApplicationsViaApplication = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;
  const userId = req.user._id;
  const { page = 1, limit = 10, status = 'all' } = req.query;

  const job = await Job.findById(jobId);
  if (!job || job.postedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized or job not found");
  }

  const filter = { job: jobId };
  if (status !== 'all') {
    filter.status = status;
  }

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const applications = await Application.find(filter)
    .populate('applicant', 'name email userProfile')
    .sort({ appliedAt: -1 })
    .skip(skip)
    .limit(limitNumber);

  const total = await Application.countDocuments(filter);

  const result = {
    docs: applications,
    totalDocs: total,
    limit: limitNumber,
    page: pageNumber,
    totalPages: Math.ceil(total / limitNumber),
    hasNextPage: skip + limitNumber < total,
    hasPrevPage: pageNumber > 1,
  };

  return res.status(200).json(
    new ApiResponse(200, result, "Job applications fetched successfully")
  );
});

// AI-powered job recommendations for job seekers
const getJobRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { limit = 5 } = req.query;

  const user = await User.findById(userId).populate('jobSeekerProfile');
  if (!user || user.role !== 'jobSeeker') {
    throw new ApiError(403, 'Only job seekers can get recommendations');
  }

  // Get recent jobs
  const jobs = await Job.find({ isActive: true })
    .populate('company', 'companyName companyLogo')
    .limit(100); // Sample from recent jobs

  const recommendations = await generateJobRecommendations(user.userProfile, jobs);

  return res.status(200).json(
    new ApiResponse(200, recommendations.slice(0, limit), 'Job recommendations generated successfully')
  );
});

// Hire a candidate (delete application after hiring)
const hireCandidate = asyncHandler(async (req, res) => {
  const { jobId, applicantId } = req.body;
  const employerId = req.user._id;

  console.log("Hiring candidate:", { jobId, applicantId, employerId });

  // Verify job belongs to the employer
  const job = await Job.findById(jobId);
  if (!job || job.postedBy.toString() !== employerId.toString()) {
    throw new ApiError(403, "You can only hire candidates for your own job postings");
  }

  // Find and delete the application
  const application = await Application.findOneAndDelete({
    job: jobId,
    applicant: applicantId
  });

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "Candidate hired successfully. Application has been removed.")
  );
});

// Check application status for a job
const checkApplicationStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user._id;

  console.log("Checking application status:", { jobId, userId });

  // Check if user has applied for this job
  const application = await Application.findOne({
    job: jobId,
    applicant: userId
  });

  // Check if user has saved this job
  const user = await User.findById(userId).populate('jobSeekerProfile');
  const jobSeekerProfile = user?.jobSeekerProfile;
  const hasSaved = jobSeekerProfile?.savedJobs?.includes(jobId) || false;

  const hasApplied = !!application;

  return res.status(200).json(
    new ApiResponse(200, { hasApplied, hasSaved }, "Application status checked successfully")
  );
});

export {
  ping,
  authPing,
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  postJob,
  sendJobDescription,
  applyForJob,
  saveJob,
  getSavedJobs,
  removeSavedJob,
  getJobLocations,
  getCompanies,
  getJobApplications,
  getMyApplications,
  getMyCompanyApplications,
  shortlistCandidate,
  removeFromShortlist,
  rejectCandidate,
  getJobApplicationsViaApplication,
  getJobRecommendations,
  hireCandidate,
  checkApplicationStatus,
};
