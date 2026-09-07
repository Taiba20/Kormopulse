import React, { useEffect, useState, useMemo } from "react";
import { userService } from "../../services/userService.js";
import InputField from "../Common/FormComponents/InputField.jsx";
import SelectInput from "../Common/FormComponents/SelectInput.jsx";
import SubmissionButton from "../Common/Buttons/SubmissionButton.jsx";
import useUpdateUserData from "../../hooks/useUpdateUserData";

function AboutForm({ userData }) {
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
      newErrors.name = "Name is required";
    }
    
    if (!formData.location || formData.location === "default") {
      newErrors.location = "Please select a location";
    }
    
    if (!formData.primaryRole) {
      newErrors.primaryRole = "Please select a primary role";
    }
    
    if (!formData.yearsOfExperience) {
      newErrors.yearsOfExperience = "Please select years of experience";
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
      setErrors(prev => ({ ...prev, profilePicture: "File size must be less than 5MB" }));
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, profilePicture: "Please select a valid image file" }));
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
        setSuccessMessage('Profile picture updated successfully!');
      }
    } catch (error) {
      console.error(`Error updating profile picture:`, error);
      setErrors(prev => ({ 
        ...prev, 
        profilePicture: error.response?.data?.message || "Failed to upload image" 
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
        setSuccessMessage('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ 
        submit: error.response?.data?.message || "Failed to update profile" 
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
  };

  const locationOptions = [
    { value: "default", label: "Select Country" },
    { value: "bangladesh", label: "Bangladesh" },
    { value: "united_states", label: "United States" },
    { value: "united_kingdom", label: "United Kingdom" },
    { value: "australia", label: "Australia" },
    { value: "canada", label: "Canada" },
    { value: "germany", label: "Germany" },
    { value: "france", label: "France" },
    { value: "japan", label: "Japan" },
    { value: "china", label: "China" },
    { value: "brazil", label: "Brazil" },
    { value: "south_africa", label: "South Africa" },
  ];

  const roleOptions = [
    {
      label: "Technical Roles",
      options: [
        { value: "software_engineer", label: "Software Engineer" },
        { value: "data_scientist", label: "Data Scientist" },
        { value: "system_admin", label: "System Administrator" },
      ],
    },
    {
      label: "Management Roles",
      options: [
        { value: "project_manager", label: "Project Manager" },
        { value: "product_manager", label: "Product Manager" },
        { value: "team_lead", label: "Team Lead" },
      ],
    },
    {
      label: "Design Roles",
      options: [
        { value: "ui_designer", label: "UI Designer" },
        { value: "ux_designer", label: "UX Designer" },
        { value: "graphic_designer", label: "Graphic Designer" },
      ],
    },
  ];

  const experienceOptions = [
    { value: "0", label: "Less than 1 year" },
    { value: "1", label: "1 year" },
    { value: "2", label: "2 years" },
    { value: "3", label: "3 years" },
    { value: "4", label: "4 years" },
    { value: "5", label: "5 years" },
    { value: "6", label: "More than 5 years" },
  ];

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
          label="Your Name"
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
                alt="User" 
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
              {uploadProgress ? "Uploading..." : "Upload a new photo"}
            </button>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max size 5MB.</p>
            {errors.profilePicture && (
              <p className="text-red-500 text-xs mt-1">{errors.profilePicture}</p>
            )}
          </div>
        </div>
        
        <SelectInput
          label="Where are you based?"
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
              label="Select your primary role"
              id="primaryRole"
              name="primaryRole"
              value={formData.primaryRole}
              onChange={handleInputChange}
              options={roleOptions}
              isRequired={true}
              optgroup={true}
              error={errors.primaryRole}
            />
          </div>
          <div className="w-full md:w-2/5 pr-2">
            <SelectInput
              label="Years of experience"
              id="yearsOfExperience"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleInputChange}
              options={experienceOptions}
              isRequired={true}
              error={errors.yearsOfExperience}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="bio" className="block font-medium">
            Your bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Stanford CS, Full stack generalist; launched a successful Android app, worked at Google"
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
              label="Cancel"
            />
            <SubmissionButton
              type="submit"
              color="black"
              label={updating ? "Saving..." : "Save"}
            />
          </div>
        )}
      </form>
    </div>
  );
}

export default AboutForm;
