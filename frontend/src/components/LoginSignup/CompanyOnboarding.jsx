import React, { useState } from "react";
import InputField from "../Common/FormComponents/InputField";
import CompanySearch from "../Common/CompanySearch";
import { updateUserProfile, userService } from "../../services/userService";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";

function CompanyOnboarding() {
  const { t } = useI18n();
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
    companyLogo:
      "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg",
    companyWebsite: "",
    companySocialProfiles: {
      linkedIn: "",
      twitter: "",
      portfolioWebsite: "",
    },
    employeeBenefits: [],
  });
  const [showDropdown, setShowDropdown] = useState(true);
  const [logoUploading, setLogoUploading] = useState(false);
  const navigate = useNavigate();

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!companyProfile.companyName || companyProfile.companyName.trim() === "") {
      alert(t("company.nameRequired"));
      return;
    }
    
    updateData({ ...companyProfile, doneOnboarding: true });
  };

  const updateData = async (data) => {
    console.log('Submitting company profile data:', data);
    try {
      const res = await updateUserProfile(data);
      if (res.status === 200) {
        navigate("/dashboard/home");
      }
    } catch (error) {
      console.log('Company onboarding error:', error);
      console.log('Error response:', error.response?.data);
    }
  };

  const handleDropdown = (item) => {
    handleCompanyInput(item);
    setShowDropdown(!showDropdown);
  };

  const handleCompanyInput = (company) => {
    const { name, logo, domain } = company;

    setCompanyProfile((prevProfile) => ({
      ...prevProfile,
      companyName: name,
      companyLogo:
        logo ||
        "https://photos.wellfound.com/startups/i/267839-22e9550a168c9834c67a3e55e2577688-medium_jpg.jpg?buster=1677467708",
      companySocialProfiles: {
        ...prevProfile.companySocialProfiles,
        portfolioWebsite: domain,
      },
    }));
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert(t('company.notImage'));
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('company.tooBig'));
      return;
    }

    try {
      setLogoUploading(true);
      const response = await userService.updateProfilePicture(file);
      
      setCompanyProfile(prev => ({
        ...prev,
        companyLogo: response.data.user.userProfile.companyLogo || response.data.profilePicture
      }));
      
      alert(t('company.logoUpdated'));
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert(t('company.logoFailed'));
    } finally {
      setLogoUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/10 via-background to-primary/5 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
            {t("onboarding.company.title")}
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            {t("onboarding.company.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-primary/10 p-6 md:p-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-xl p-6 border border-primary/10">
                <h3 className="text-2xl font-semibold text-text-primary mb-6 flex items-center justify-center">
                  <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-text-inverse text-sm font-bold mr-3">1</span>
                  {t("onboarding.company.info")}
                </h3>

                <div className="space-y-4">
                  <div className="text-center">
                    <label className="block text-lg font-medium text-text-primary mb-3">
                      <span className="text-red-500 mr-1">*</span>{t("onboarding.company.name")}
                    </label>
                    <div className="flex justify-center">
                      {showDropdown ? (
                        <div className="w-full md:w-1/2 space-y-3">
                          <CompanySearch
                            handleDropdown={handleDropdown}
                            width="w-full"
                          />
                          <div className="text-center">
                            <span className="text-sm text-gray-500">{t("onboarding.company.or")}</span>
                          </div>
                          <InputField
                            label={t("onboarding.company.manual")}
                            id="companyName"
                            name="companyName"
                            value={companyProfile.companyName}
                            onChange={handleChange}
                            placeholder={t("company.namePlaceholder")}
                            className="w-full"
                          />
                        </div>
                      ) : (
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg border border-neutral-200 shadow-sm max-w-md">
                          <div className="flex items-center">
                            <img
                              src={companyProfile.companyLogo}
                              alt=""
                              className="w-12 h-12 rounded-full mr-4 border-2 border-primary/20"
                            />
                            <span className="font-semibold text-text-primary text-lg">
                              {companyProfile.companyName}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDropdown({ name: "", logo: "" })}
                            className="text-neutral-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <label className="block text-lg font-medium text-text-primary mb-3">
                      {t("onboarding.company.logo")}
                    </label>
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-24 h-24 rounded-full border-4 border-primary/20 overflow-hidden bg-neutral-100">
                        <img
                          src={companyProfile.companyLogo}
                          alt=""
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
                          {logoUploading ? t('company.uploading') : t('company.upload')}
                        </label>
                        <p className="text-sm text-text-secondary">{t('company.logoHint')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <label className="block text-lg font-medium text-text-primary mb-3">
                      {t("onboarding.company.industry")}
                    </label>
                    <div className="flex justify-center">
                      <InputField
                        id="industry"
                        name="industry"
                        value={companyProfile.industry}
                        onChange={handleChange}
                        placeholder={t("onboarding.company.industryPlaceholder")}
                        className="w-full md:w-1/2"
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <label className="block text-lg font-medium text-text-primary mb-3">
                      {t("onboarding.company.description")}
                    </label>
                    <div className="flex justify-center">
                      <textarea
                        id="companyDescription"
                        name="companyDescription"
                        value={companyProfile.companyDescription}
                        onChange={handleChange}
                        placeholder={t("company.descriptionPlaceholder")}
                        rows="4"
                        className="w-full md:w-1/2 px-4 py-3 text-base border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 bg-background text-text-primary placeholder-text-secondary/60 resize-none"
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <label className="block text-lg font-medium text-text-primary mb-3">
                      {t("onboarding.company.contact")}
                    </label>
                    <div className="flex justify-center">
                      <InputField
                        id="contactNumber"
                        name="contactNumber"
                        value={companyProfile.contactNumber}
                        onChange={handleChange}
                        placeholder={t("onboarding.company.contactPlaceholder")}
                        className="w-full md:w-1/2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-xl p-6 border border-primary/10">
                <h3 className="text-2xl font-semibold text-text-primary mb-6 flex items-center justify-center">
                  <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-text-inverse text-sm font-bold mr-3">2</span>
                  {t("onboarding.company.address")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    label={t("onboarding.company.city")}
                    id="address.city"
                    name="address.city"
                    value={companyProfile.address.city}
                    onChange={handleChange}
                    placeholder={t("onboarding.company.cityPlaceholder")}
                  />
                  <InputField
                    label={t("onboarding.company.state")}
                    id="address.state"
                    name="address.state"
                    value={companyProfile.address.state}
                    onChange={handleChange}
                    placeholder={t("onboarding.company.statePlaceholder")}
                  />
                  <InputField
                    label={t("onboarding.company.country")}
                    id="address.country"
                    name="address.country"
                    value={companyProfile.address.country}
                    onChange={handleChange}
                    placeholder={t("onboarding.company.countryPlaceholder")}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-xl p-6 border border-primary/10">
                <h3 className="text-2xl font-semibold text-text-primary mb-6 flex items-center justify-center">
                  <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-text-inverse text-sm font-bold mr-3">3</span>
                  {t("onboarding.company.size")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label={t("onboarding.company.sizeFrom")}
                    id="companySize.from"
                    name="companySize.from"
                    value={companyProfile.companySize.from}
                    onChange={handleChange}
                    placeholder={t("onboarding.company.sizeFromPlaceholder")}
                  />
                  <InputField
                    label={t("onboarding.company.sizeTo")}
                    id="companySize.to"
                    name="companySize.to"
                    value={companyProfile.companySize.to}
                    onChange={handleChange}
                    placeholder={t("onboarding.company.sizeToPlaceholder")}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-xl p-6 border border-primary/10">
                <h3 className="text-2xl font-semibold text-text-primary mb-6 flex items-center justify-center">
                  <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-text-inverse text-sm font-bold mr-3">4</span>
                  {t("onboarding.company.online")}
                </h3>

                <div className="space-y-4">
                  <InputField
                    label={t("onboarding.company.website")}
                    id="companyWebsite"
                    name="companyWebsite"
                    value={companyProfile.companyWebsite}
                    onChange={handleChange}
                    placeholder="https://www.companywebsite.com"
                  />
                  <InputField
                    label={t("onboarding.company.linkedin")}
                    id="companySocialProfiles.linkedIn"
                    name="companySocialProfiles.linkedIn"
                    value={companyProfile.companySocialProfiles.linkedIn}
                    onChange={handleChange}
                    placeholder="https://www.linkedin.com/company/username"
                  />
                  <InputField
                    label={t("onboarding.company.twitter")}
                    id="companySocialProfiles.twitter"
                    name="companySocialProfiles.twitter"
                    onChange={handleChange}
                    placeholder="https://twitter.com/username"
                  />
                </div>
              </div>
            </div>

            <div className="text-center pt-6">
              <button
                type="submit"
                className="px-12 py-4 bg-gradient-to-r from-primary to-primary-light text-text-inverse text-xl font-semibold rounded-xl hover:from-primary-dark hover:to-primary transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 border border-primary-dark/20"
              >
                {t("onboarding.company.submit")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanyOnboarding;
