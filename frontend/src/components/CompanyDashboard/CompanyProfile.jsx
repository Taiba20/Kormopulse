import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { userService } from "../../services/userService";
import InputField from "../Common/FormComponents/InputField";
import ChangePassword from "../UserProfile/ChangePassword";

function CompanyProfile() {
  const { userData } = useSelector((store) => store.auth);
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [companyProfile, setCompanyProfile] = useState({
    companyName: "",
    companyDescription: "",
    contactNumber: "",
    industry: "",
    address: {
      city: "",
      state: "",
      country: "",
    },
    companySize: {
      from: "",
      to: "",
    },
    companyLogo: "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg",
    companyWebsite: "",
    companySocialProfiles: {
      linkedIn: "",
      twitter: "",
      portfolioWebsite: "",
    },
    employeeBenefits: [],
  });

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const loadUserData = () => {
    if (userData?.userProfile) {
      setCompanyProfile({
        companyName: userData.userProfile.companyName || "",
        companyDescription: userData.userProfile.companyDescription || "",
        contactNumber: userData.userProfile.contactNumber || "",
        industry: userData.userProfile.industry || "",
        address: {
          city: userData.userProfile.address?.city || "",
          state: userData.userProfile.address?.state || "",
          country: userData.userProfile.address?.country || "",
        },
        companySize: {
          from: userData.userProfile.companySize?.from || "",
          to: userData.userProfile.companySize?.to || "",
        },
        companyLogo: userData.userProfile.companyLogo || "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg",
        companyWebsite: userData.userProfile.companyWebsite || "",
        companySocialProfiles: {
          linkedIn: userData.userProfile.companySocialProfiles?.linkedIn || "",
          twitter: userData.userProfile.companySocialProfiles?.twitter || "",
          portfolioWebsite: userData.userProfile.companySocialProfiles?.portfolioWebsite || "",
        },
        employeeBenefits: userData.userProfile.employeeBenefits || [],
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setCompanyProfile((prevProfile) => ({
        ...prevProfile,
        [parent]: {
          ...prevProfile[parent],
          [child]: value,
        },
      }));
    } else {
      setCompanyProfile((prevProfile) => ({
        ...prevProfile,
        [name]: value,
      }));
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setLogoUploading(true);
      const response = await userService.updateProfilePicture(file);
      
      setCompanyProfile(prev => ({
        ...prev,
        companyLogo: response.data.user?.userProfile?.companyLogo || response.data.profilePicture
      }));
      
      alert('Company logo updated successfully!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!companyProfile.companyName || companyProfile.companyName.trim() === "") {
      alert("Please enter a company name");
      return;
    }
    
    try {
      setLoading(true);
      const res = await userService.updateUserProfile(companyProfile);
      if (res.status === 200) {
        alert("Company profile updated successfully!");
        // Optionally reload user data
        loadUserData();
      }
    } catch (error) {
      console.error('Company profile update error:', error);
      alert('Failed to update company profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8 pt-6">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "profile"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Company Profile
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "password"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Change Password
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === "profile" && (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-text-primary mb-2">Company Profile</h1>
                <p className="text-text-secondary">Manage your company information and settings</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Logo Section */}
          <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-xl p-6 border border-primary/10">
            <h3 className="text-xl font-semibold text-text-primary mb-6">Company Logo</h3>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-24 h-24 rounded-full border-4 border-primary/20 overflow-hidden bg-neutral-100">
                <img
                  src={companyProfile.companyLogo}
                  alt="Company Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";
                  }}
                />
              </div>
              <div className="flex flex-col items-center space-y-2">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="logo-upload"
                  className={`px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer ${logoUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {logoUploading ? 'Uploading...' : 'Upload Logo'}
                </label>
                <p className="text-sm text-text-secondary">Max 5MB, JPG/PNG</p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-xl p-6 border border-primary/10">
            <h3 className="text-xl font-semibold text-text-primary mb-6">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Company Name *"
                id="companyName"
                name="companyName"
                value={companyProfile.companyName}
                onChange={handleChange}
                placeholder="Enter your company name"
                required
              />
              <InputField
                label="Industry"
                id="industry"
                name="industry"
                value={companyProfile.industry}
                onChange={handleChange}
                placeholder="e.g., Technology, Healthcare"
              />
              <InputField
                label="Company Website"
                id="companyWebsite"
                name="companyWebsite"
                value={companyProfile.companyWebsite}
                onChange={handleChange}
                placeholder="https://www.yourcompany.com"
              />
              <InputField
                label="Contact Number"
                id="contactNumber"
                name="contactNumber"
                value={companyProfile.contactNumber}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Company Description
              </label>
              <textarea
                id="companyDescription"
                name="companyDescription"
                value={companyProfile.companyDescription}
                onChange={handleChange}
                placeholder="Tell us about your company, its mission, values, and what makes it unique"
                rows="4"
                className="w-full px-4 py-3 text-base border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 bg-background text-text-primary placeholder-text-secondary/60 resize-none"
              />
            </div>
          </div>

          {/* Company Size */}
          <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-xl p-6 border border-primary/10">
            <h3 className="text-xl font-semibold text-text-primary mb-6">Company Size</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="From (number of employees)"
                id="companySize.from"
                name="companySize.from"
                type="number"
                value={companyProfile.companySize.from}
                onChange={handleChange}
                placeholder="1"
              />
              <InputField
                label="To (number of employees)"
                id="companySize.to"
                name="companySize.to"
                type="number"
                value={companyProfile.companySize.to}
                onChange={handleChange}
                placeholder="50"
              />
            </div>
          </div>

          {/* Address */}
          <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-xl p-6 border border-primary/10">
            <h3 className="text-xl font-semibold text-text-primary mb-6">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField
                label="City"
                id="address.city"
                name="address.city"
                value={companyProfile.address.city}
                onChange={handleChange}
                placeholder="New York"
              />
              <InputField
                label="State"
                id="address.state"
                name="address.state"
                value={companyProfile.address.state}
                onChange={handleChange}
                placeholder="NY"
              />
              <InputField
                label="Country"
                id="address.country"
                name="address.country"
                value={companyProfile.address.country}
                onChange={handleChange}
                placeholder="United States"
              />
            </div>
          </div>

          {/* Social Profiles */}
          <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-xl p-6 border border-primary/10">
            <h3 className="text-xl font-semibold text-text-primary mb-6">Social Profiles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="LinkedIn"
                id="companySocialProfiles.linkedIn"
                name="companySocialProfiles.linkedIn"
                value={companyProfile.companySocialProfiles.linkedIn}
                onChange={handleChange}
                placeholder="https://linkedin.com/company/yourcompany"
              />
              <InputField
                label="Twitter"
                id="companySocialProfiles.twitter"
                name="companySocialProfiles.twitter"
                value={companyProfile.companySocialProfiles.twitter}
                onChange={handleChange}
                placeholder="https://twitter.com/yourcompany"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={loadUserData}
              className="px-6 py-3 border border-neutral-300 text-text-primary rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
              </form>
            </div>
          )}

          {activeTab === "password" && <ChangePassword />}
        </div>
      </div>
    </div>
  );
}

export default CompanyProfile;