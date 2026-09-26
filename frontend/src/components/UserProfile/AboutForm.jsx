import React, { useEffect, useState, useMemo } from "react";
import { userService } from "../../services/userService.js";
import InputField from "../Common/FormComponents/InputField.jsx";
import SelectInput from "../Common/FormComponents/SelectInput.jsx";
import SubmissionButton from "../Common/Buttons/SubmissionButton.jsx";
import useUpdateUserData from "../../hooks/useUpdateUserData";
import { useI18n } from "../../i18n/I18nContext";

const COUNTRY_KEYS = {
  bangladesh: 1, united_states: 1, united_kingdom: 1, australia: 1, canada: 1, germany: 1,
  france: 1, japan: 1, china: 1, brazil: 1, south_africa: 1,
};
const ROLE_GROUPS = [
  { key: "technical", roles: ["software_engineer", "data_scientist", "system_admin"] },
  { key: "management", roles: ["project_manager", "product_manager", "team_lead"] },
  { key: "design", roles: ["ui_designer", "ux_designer", "graphic_designer"] },
];

function AboutForm({ userData }) {
  const { t, tError } = useI18n();
  const initialFormData = useMemo(() => ({
    name: userData?.userProfile?.name || '',
    location: userData?.userProfile?.location || '',
    primaryRole: userData?.userProfile?.primaryRole || '',
    yearsOfExperience: userData?.userProfile?.yearsOfExperience || '',
    bio: userData?.userProfile?.bio || '',
    profilePicture: userData?.userProfile?.profilePicture || '',
  }), [userData]);

  const [formData, setFormData] = useState(initialFormData);
  const [isChanged, setIsChanged] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const updateUserData = useUpdateUserData();

  useEffect(() => {
    if (userData?.userProfile) {
      setFormData(prevData => ({
        ...prevData,
        name: userData.userProfile.name || '',
        location: userData.userProfile.location || '',
        primaryRole: userData.userProfile.primaryRole || '',
        yearsOfExperience: userData.userProfile.yearsOfExperience || '',
        bio: userData.userProfile.bio || '',
        profilePicture: userData.userProfile.profilePicture || '',
      }));
    }
  }, [userData]);

  useEffect(() => {
    const currentFormDataString = JSON.stringify(formData);
    const initialFormDataString = JSON.stringify(initialFormData);
    setIsChanged(currentFormDataString !== initialFormDataString);
  }, [formData, initialFormData]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t("profile.about_form.nameRequired");
    }
    
    if (!formData.location || formData.location === "default") {
      newErrors.location = t("profile.about_form.locationRequired");
    }
    
    if (!formData.primaryRole) {
      newErrors.primaryRole = t("profile.about_form.roleRequired");
    }
    
    if (!formData.yearsOfExperience) {
      newErrors.yearsOfExperience = t("profile.about_form.experienceRequired");
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    // Clear success message when user makes changes
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setFormData({ ...formData, profilePicture: null });
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profilePicture: t("profile.about_form.fileTooBig") }));
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, profilePicture: t("profile.about_form.fileNotImage") }));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      setFormData({ ...formData, profilePicture: reader.result });
    };
    reader.readAsDataURL(file);

    try {
      setUploadProgress(true);
      setErrors(prev => ({ ...prev, profilePicture: "" }));
      
      const res = await userService.updateProfilePicture(file);
      if (res.status === 200) {
        updateUserData();
        setSuccessMessage(t('profile.about_form.pictureUpdated'));
      }
    } catch (error) {
      console.error(`Error updating profile picture:`, error);
      setErrors(prev => ({ 
        ...prev, 
        profilePicture: tError(error, "profile.about_form.pictureFailed") 
      }));
    } finally {
      setUploadProgress(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setUpdating(true);
      setErrors({});
      
      const res = await userService.updateUserProfile(formData);
      if (res.status === 200) {
        setIsChanged(false);
        updateUserData();
        setSuccessMessage(t('profile.about_form.updated'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ 
        submit: tError(error, "profile.about_form.updateFailed") 
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
  };

  const locationOptions = [
    { value: "default", label: t("profile.about_form.selectCountry") },
    ...Object.keys(COUNTRY_KEYS).map((key) => ({ value: key, label: t(`profile.countries.${key}`) })),
  ];

  const roleOptions = ROLE_GROUPS.map((group) => ({
    label: t(`profile.roleGroups.${group.key}`),
    options: group.roles.map((role) => ({ value: role, label: t(`profile.roles.${role}`) })),
  }));

  const experienceOptions = [0, 1, 2, 3, 4, 5, 6].map((n) => ({
    value: String(n),
    label: t(`profile.experienceOptions.${n}`),
  }));

  return (
    <div>
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
      
      <form onSubmit={handleSubmit}>
        <InputField
          label={t("profile.about_form.name")}
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          isRequired={true}
          error={errors.name}
        />
        
        <div className="py-5 flex gap-5 items-center">
          <div className="rounded-full h-[4.5rem] w-[4.5rem] overflow-hidden border flex items-center justify-center bg-gray-100">
            {formData.profilePicture ? (
              <img 
                src={formData.profilePicture} 
                alt={t("profile.about_form.userAlt")} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <i className="fa-solid fa-user text-gray-400 text-2xl"></i>
              </div>
            )}
          </div>
          <div>
            <input
              type="file"
              id="profilePicture"
              name="profilePicture"
              onChange={handleFileChange}
              accept="image/*"
              hidden
            />
            <button
              type="button"
              className="border border-black py-2 px-3 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors"
              onClick={() => document.getElementById("profilePicture").click()}
            >
              {uploadProgress ? t("profile.about_form.uploading") : t("profile.about_form.upload")}
            </button>
            <p className="text-xs text-gray-500 mt-1">{t("profile.about_form.uploadHint")}</p>
            {errors.profilePicture && (
              <p className="text-red-500 text-xs mt-1">{errors.profilePicture}</p>
            )}
          </div>
        </div>
        
        <SelectInput
          label={t("profile.about_form.whereBased")}
          id="location"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          options={locationOptions}
          isRequired={true}
          error={errors.location}
        />
        
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-3/5 pr-2">
            <SelectInput
              label={t("profile.about_form.role")}
              id="primaryRole"
              name="primaryRole"
              value={formData.primaryRole}
              onChange={handleInputChange}
              options={roleOptions}
              placeholder={t("profile.about_form.role")}
              isRequired={true}
              optgroup={true}
              error={errors.primaryRole}
            />
          </div>
          <div className="w-full md:w-2/5 pr-2">
            <SelectInput
              label={t("profile.about_form.experience")}
              id="yearsOfExperience"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleInputChange}
              options={experienceOptions}
              placeholder={t("profile.about_form.selectExperience")}
              isRequired={true}
              error={errors.yearsOfExperience}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="bio" className="block font-medium">
            {t("profile.about_form.bio")}
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder={t("profile.about_form.bioPlaceholder")}
            rows="5"
            cols="50"
            className="w-full p-2 rounded-lg border border-gray-400 my-2"
          ></textarea>
        </div>
        
        {isChanged && (
          <div className="flex gap-6 my-4 justify-end">
            <SubmissionButton
              type="button"
              onClick={handleCancel}
              color="white"
              label={t("profile.cancel")}
            />
            <SubmissionButton
              type="submit"
              color="black"
              label={updating ? t("profile.saving") : t("profile.save")}
            />
          </div>
        )}
      </form>
    </div>
  );
}

export default AboutForm;
