import React, { useEffect, useState } from "react";
import InputField from "../Common/FormComponents/InputField";
import SubmissionButton from "../Common/Buttons/SubmissionButton";
import { userService } from "../../services/userService";
import { useSelector } from "react-redux";
import useUpdateUserData from "../../hooks/useUpdateUserData";

function UpdateResume() {
  const [resumeLink, setResumeLink] = useState("");
  const [resume, setResume] = useState("");
  const [updating, setUpdating] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const updateUserData = useUpdateUserData();
  const { userData } = useSelector((store) => store.auth);

  useEffect(() => {
    if (userData?.userProfile?.resume) {
      setResume(userData?.userProfile?.resume);
    }
  }, [userData]);

  const validateResumeLink = (link) => {
    if (!link.trim()) {
      return "Resume link is required";
    }
    
    // Basic URL validation
    try {
      new URL(link);
    } catch {
      return "Please enter a valid URL";
    }
    
    // Check if it's a Google Drive link
    if (!link.includes('drive.google.com') && !link.includes('docs.google.com')) {
      return "Please use a Google Drive link for better accessibility";
    }
    
    return null;
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setResumeLink(value);
    
    // Clear errors when user starts typing
    if (errors.resumeLink) {
      setErrors(prev => ({ ...prev, resumeLink: "" }));
    }
    
    // Clear success message when user makes changes
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const validationError = validateResumeLink(resumeLink);
    if (validationError) {
      setErrors({ resumeLink: validationError });
      return;
    }
    
    try {
      setUpdating(true);
      setErrors({});
      
      await userService.updateResume(resumeLink);
      updateUserData();
      setResumeLink("");
      setSuccessMessage('Resume updated successfully!');
    } catch (error) {
      console.error('Error updating resume:', error);
      setErrors({ 
        submit: error.response?.data?.message || "Failed to update resume" 
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 py-10 sm:px-5 md:px-10 lg:px-20">
      <div className="w-full max-w-2xl p-6 bg-white rounded shadow-md">
        <h2 className="mb-5 text-lg sm:text-xl md:text-2xl font-bold text-gray-700">
          Upload your recent resume or CV
        </h2>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}
        
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.submit}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <InputField
            label="Resume link"
            id="resumeLink"
            name="resumeLink"
            value={resumeLink}
            onChange={handleInputChange}
            isRequired={true}
            placeholder="Paste your Google Drive link here"
            description="Please ensure that your Google Drive link is accessible to everyone."
            error={errors.resumeLink}
          />

          <div className="flex justify-end my-2">
            <SubmissionButton
              type="submit"
              label={updating ? "Updating..." : "Update"}
              color="black"
            />
          </div>
        </form>

        {resume && (
          <div className="mt-10 p-3 bg-gray-200 rounded shadow-md">
            <h3 className="text-lg font-bold text-gray-700">
              Current Resume Link:
            </h3>
            <a
              href={resume}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 underline flex items-center my-2 break-all hover:text-green-800"
            >
              <i className="fa-solid fa-arrow-up-right-from-square mr-2.5"></i>
              {resume}
            </a>
            <p className="text-sm text-gray-600 mt-2">
              Last updated: {userData?.userProfile?.updatedAt ? 
                new Date(userData.userProfile.updatedAt).toLocaleDateString() : 
                'Unknown'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UpdateResume;
