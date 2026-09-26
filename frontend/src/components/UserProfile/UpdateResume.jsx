import React, { useEffect, useState } from "react";
import InputField from "../Common/FormComponents/InputField";
import SubmissionButton from "../Common/Buttons/SubmissionButton";
import { userService } from "../../services/userService";
import { useSelector } from "react-redux";
import useUpdateUserData from "../../hooks/useUpdateUserData";
import { useI18n } from "../../i18n/I18nContext";

function UpdateResume() {
  const { t, tError, formatDate } = useI18n();
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
      return t("profile.resumeLink.required");
    }
    
    // Basic URL validation
    try {
      new URL(link);
    } catch {
      return t("profile.resumeLink.invalidUrl");
    }
    
    // Check if it's a Google Drive link
    if (!link.includes('drive.google.com') && !link.includes('docs.google.com')) {
      return t("profile.resumeLink.useDrive");
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
      setSuccessMessage(t('profile.resumeLink.updated'));
    } catch (error) {
      console.error('Error updating resume:', error);
      setErrors({ 
        submit: tError(error, "profile.resumeLink.failed") 
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 py-10 sm:px-5 md:px-10 lg:px-20">
      <div className="w-full max-w-2xl p-6 bg-white rounded shadow-md">
        <h2 className="mb-5 text-lg sm:text-xl md:text-2xl font-bold text-gray-700">
          {t("profile.resumeLink.heading")}
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
            label={t("profile.resumeLink.label")}
            id="resumeLink"
            name="resumeLink"
            value={resumeLink}
            onChange={handleInputChange}
            isRequired={true}
            placeholder={t("profile.resumeLink.placeholder")}
            description={t("profile.resumeLink.description")}
            error={errors.resumeLink}
          />

          <div className="flex justify-end my-2">
            <SubmissionButton
              type="submit"
              label={updating ? t("profile.resumeLink.updating") : t("profile.resumeLink.update")}
              color="black"
            />
          </div>
        </form>

        {resume && (
          <div className="mt-10 p-3 bg-gray-200 rounded shadow-md">
            <h3 className="text-lg font-bold text-gray-700">
              {t("profile.resumeLink.current")}
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
              {t("profile.resumeLink.lastUpdated", {
                date: userData?.userProfile?.updatedAt ? formatDate(userData.userProfile.updatedAt) : t("profile.resumeLink.unknown"),
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UpdateResume;
