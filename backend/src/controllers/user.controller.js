import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { JobSeekerProfile } from "../models/jobSeekerProfile.model.js";
import { CompanyProfile } from "../models/companyProfile.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.service.js";
import { analyzeSkillGaps as analyzeSkillGapsAI } from "../utils/groqAi.service.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 1000 * 60 * 60 * 24 * 7,
  domain: process.env.NODE_ENV === "production" ? "noobnarayan.in" : undefined,
};

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      `Something went wrong while generating referesh and access token: ${error}`
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body; // Added 'name' to destructuring

  if ([name, email, password, role].some((field) => field?.trim() === "")) {
    // Updated validation to include 'name'
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const username = email.split("@")[0];
  const user = await User.create({
    name, // Added 'name' field
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    password,
    role,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefereshTokens(
    createdUser._id
  );

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(201, { user: createdUser, accessToken, refreshToken }, "User registered successfully")); // Updated to return 'user' object
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User login successful"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password -refreshToken");

  // Populate profiles if they exist
  if (user.jobSeekerProfile) {
    await user.populate('jobSeekerProfile');
  }
  if (user.companyProfile) {
    await user.populate('companyProfile');
  }

  return res.status(200).json(new ApiResponse(200, { user }, "Current user fetched successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const updateData = req.body;

  console.log('Update user profile request for userId:', userId);
  console.log('Request body:', JSON.stringify(updateData, null, 2));

  // Get the user to check their role
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  console.log('User role:', user.role);

  let profileId = null;

  // Create appropriate profile document based on user role
  if (user.role === "jobSeeker") {
    // Create or update JobSeekerProfile
    const jobSeekerData = {
      ...updateData,
      name: user.name, // Add user name to profile
      // Ensure workExperience has the right structure
      workExperience: updateData.workExperience?.map(exp => ({
        jobTitle: exp.jobTitle || "",
        company: {
          name: exp.company?.name || "",
          logoUrl: exp.company?.logoUrl || "",
          domain: exp.company?.domain || "",
        },
        currentJob: !updateData.notEmployed, // Set currentJob based on employment status
      })) || [],
    };

    let jobSeekerProfile;
    if (user.jobSeekerProfile) {
      // Update existing profile
      jobSeekerProfile = await JobSeekerProfile.findByIdAndUpdate(
        user.jobSeekerProfile,
        jobSeekerData,
        { new: true }
      );
    } else {
      // Create new profile
      jobSeekerProfile = await JobSeekerProfile.create(jobSeekerData);
      profileId = jobSeekerProfile._id;
    }
  } else if (user.role === "employer") {
    // Create or update CompanyProfile
    const companyData = {
      ...updateData,
      // Ensure companySize has proper number types
      companySize: {
        from: parseInt(updateData.companySize?.from) || 0,
        to: parseInt(updateData.companySize?.to) || 0,
      },
      // Ensure companySocialProfiles is properly structured
      companySocialProfiles: updateData.companySocialProfiles || {},
    };

    let companyProfile;
    if (user.companyProfile) {
      // Update existing profile
      companyProfile = await CompanyProfile.findByIdAndUpdate(
        user.companyProfile,
        companyData,
        { new: true }
      );
    } else {
      // Create new profile
      companyProfile = await CompanyProfile.create(companyData);
      profileId = companyProfile._id;
    }
  }

  // Update user with profile reference and keep userProfile for backward compatibility
  const updateFields = {
    userProfile: updateData, // Keep for backward compatibility
  };

  if (profileId) {
    if (user.role === "jobSeeker") {
      updateFields.jobSeekerProfile = profileId;
    } else if (user.role === "employer") {
      updateFields.companyProfile = profileId;
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateFields,
    { new: true }
  ).select("-password -refreshToken").populate('jobSeekerProfile').populate('companyProfile');

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, { user: updatedUser }, "User profile updated successfully"));
});

const getSavedJobs = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get the job seeker profile and populate saved jobs
  const jobSeekerProfile = await JobSeekerProfile.findOne({ user: userId })
    .populate('savedJobs');
  
  if (!jobSeekerProfile) {
    return res.status(200).json(new ApiResponse(200, [], "No saved jobs found"));
  }
  
  return res.status(200).json(
    new ApiResponse(200, jobSeekerProfile.savedJobs || [], "Saved jobs fetched successfully")
  );
});

const getMyApplications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get all applications by this user
  const applications = await Application.find({ applicant: userId })
    .populate('job')
    .sort({ createdAt: -1 });
  
  return res.status(200).json(
    new ApiResponse(200, applications, "Applications fetched successfully")
  );
});

const getUserProfile = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User profile fetch successful"));
});

const updateProfilePicture = asyncHandler(async (req, res) => {
  const profilePictureLocalPath = req.file?.path;

  console.log('Profile picture upload request:', {
    file: req.file,
    filePath: profilePictureLocalPath,
    userId: req.user._id
  });

  if (!profilePictureLocalPath) {
    throw new ApiError(400, "Profile Picture file is missing");
  }

  let user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let oldProfilePictureUrl = user?.userProfile?.profilePicture;

  console.log('Attempting to upload to Cloudinary...');
  
  const profilePicture = await uploadOnCloudinary(profilePictureLocalPath);
  
  console.log('Cloudinary upload result:', profilePicture);
  
  if (!profilePicture || !profilePicture.url) {
    console.error('Cloudinary upload failed - no URL returned');
    throw new ApiError(400, "Error while uploading profile picture to cloud storage");
  }

  console.log('Successfully uploaded to Cloudinary:', profilePicture.url);

  // Update user profile based on role
  const updateData = user.role === "jobSeeker" 
    ? { "userProfile.profilePicture": profilePicture.url }
    : { "userProfile.companyLogo": profilePicture.url };

  user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateData },
    { new: true }
  ).select("-password -refreshToken");

  console.log('User profile updated successfully');

  // Clean up old profile picture from Cloudinary
  if (
    oldProfilePictureUrl &&
    oldProfilePictureUrl !==
      "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"
  ) {
    try {
      const splitUrl = oldProfilePictureUrl.split("/");
      const filenameWithExtension = splitUrl[splitUrl.length - 1];
      const imageId = filenameWithExtension.split(".")[0];
      await deleteFromCloudinary(imageId);
      console.log('Old profile picture deleted from Cloudinary');
    } catch (error) {
      console.error('Error deleting old profile picture:', error.message);
      // Don't throw error here as the main operation succeeded
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "User profile picture updated successfully")
    );
});

const addSkill = asyncHandler(async (req, res) => {
  const { skill } = req.body;
  const { role } = req.user;
  if (role !== "jobSeeker") {
    throw new ApiError(401, "You are not authorized to perform this action");
  }

  if (!skill) {
    throw new ApiError(400, "Skill is required");
  }

  const user = await User.findById(req.user._id);
  user.userProfile.skills.push(skill);
  user.markModified("userProfile.skills");
  await user.save();

  const updatedUser = await User.findById(req.user._id);
  console.log(updatedUser.userProfile.skills);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUser.userProfile.skills,
        "Skills updated successfully"
      )
    );
});

const removeSkill = asyncHandler(async (req, res) => {
  const { skill } = req.body;
  const { role } = req.user;
  if (role !== "jobSeeker") {
    throw new ApiError(401, "You are not authorized to perform this action");
  }
  if (!skill) {
    throw new ApiError(400, "Skill is required");
  }

  const user = await User.findById(req.user._id);
  user.userProfile.skills = user.userProfile.skills.filter((s) => s !== skill);
  user.markModified("userProfile.skills");
  await user.save();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Skills removed successfully"));
});

const updateResume = asyncHandler(async (req, res) => {
  const { resume } = req.body;
  const { role } = req.user;
  if (role !== "jobSeeker") {
    throw new ApiError(401, "You are not authorized to perform this action");
  }
  if (!resume) {
    throw new ApiError(400, "Resume is required");
  }

  const user = await User.findById(req.user._id);
  user.userProfile.resume = resume;
  user.markModified("userProfile.resume");
  await user.save();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Resume updated successfully"));
});

// AI-powered skill gap analysis
const analyzeSkillGap = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { jobId } = req.params;

  const user = await User.findById(userId);
  if (!user || user.role !== 'jobSeeker') {
    throw new ApiError(403, 'Only job seekers can analyze skill gaps');
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  const analysis = await analyzeSkillGapsAI(user.userProfile, job);

  return res.status(200).json(
    new ApiResponse(200, analysis, 'Skill gap analysis completed successfully')
  );
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters long");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isCurrentPasswordValid = await user.isPasswordCorrect(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "Password changed successfully")
  );
});

// Testing endpoints
const ping = (req, res) => {
  res.send("User API is working");
};
const authPing = (req, res) => {
  res.send("User Auth is working");
};

const userPublicProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId).select(
    "email _id userProfile.profilePicture userProfile.address userProfile.bio userProfile.location userProfile.yearsOfExperience userProfile.socialProfiles userProfile.workExperience userProfile.education userProfile.skills userProfile.name userProfile.resume"
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile fetch successful"));
});

const forgotPassword = asyncHandler(async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    console.log("Forgot password request received:", { 
      email, 
      hasPassword: !!password, 
      hasConfirmPassword: !!confirmPassword 
    });

    if (!email || !password || !confirmPassword) {
      throw new ApiError(400, "Email, password, and confirm password are required");
    }

    if (password !== confirmPassword) {
      throw new ApiError(400, "Passwords do not match");
    }

    if (password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters long");
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      throw new ApiError(404, "User not found with this email");
    }

    console.log("User found, updating password...");

    // Store old password for comparison
    const oldPasswordHash = user.password;
    
    // Update user password directly - the pre-save hook will hash it
    user.password = password;
    user.markModified('password'); // Explicitly mark as modified
    
    const savedUser = await user.save();

    console.log("Password updated successfully");
    console.log("Old hash:", oldPasswordHash);
    console.log("New hash:", savedUser.password);
    console.log("Hashes are different:", oldPasswordHash !== savedUser.password);

    return res.status(200).json(
      new ApiResponse(200, {}, "Password updated successfully")
    );
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    throw error;
  }
});

export { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getCurrentUser, 
  updateUserProfile,
  getSavedJobs,
  getMyApplications,
  getUserProfile,
  ping,
  authPing,
  updateProfilePicture,
  addSkill,
  removeSkill,
  updateResume,
  userPublicProfile,
  analyzeSkillGap,
  changePassword,
  forgotPassword
};