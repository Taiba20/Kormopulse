import React, { useEffect, useState } from "react";
import CheckBoxLabel from "../Common/FormComponents/CheckBoxLabel";
import SelectInput from "../Common/FormComponents/SelectInput";
import InputField from "../Common/FormComponents/InputField";
import Checkbox from "../Common/FormComponents/Checkbox";
import CompanySearch from "../Common/CompanySearch";
import { updateUserProfile } from "../../services/userService";
import { useNavigate } from "react-router-dom";

function UserOnboarding() {
  const initialFormData = {
    location: "",
    primaryRole: "",
    yearsOfExperience: "",
    companyName: "",
    companyLogo: "",
    companyDomain: "",
    title: "",
    notEmployed: false,
    linkedin: "",
    github: "",
    twitter: "",
    website: "",
  };

  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(true);
  const [formData, setFormData] = useState(initialFormData);

  const handleDropdown = (item) => {
    handleCompanyInput(item);
    // Show dropdown if clearing company, hide if selecting company
    setShowDropdown(!item.name);
  };

  const handleInputChange = (e) => {
    const { id, type } = e.target;

    if (type === "checkbox") {
      setFormData((prevFormData) => ({
        ...prevFormData,
        [id]: !prevFormData[id],
      }));
    } else {
      const { value } = e.target;
      setFormData((prevFormData) => ({
        ...prevFormData,
        [id]: value,
      }));
    }
  };

  const handleCompanyInput = (company) => {
    const { name, logo, domain } = company;

    setFormData({
      ...formData,
      companyName: name,
      companyLogo:
        logo ||
        "https://photos.wellfound.com/startups/i/267839-22e9550a168c9834c67a3e55e2577688-medium_jpg.jpg?buster=1677467708",
      companyDomain: domain,
    });
  };

  const handleSubmission = async (e) => {
    e.preventDefault();

    const data = {
      address: { country: formData.location },
      location: formData.location,
      primaryRole: formData.primaryRole,
      socialProfiles: {
        linkedIn: formData.linkedin || "",
        github: formData.github || "",
        twitter: formData.twitter || "",
        portfolioWebsite: formData.website || "",
      },
      workExperience: [
        {
          jobTitle: formData.title || "",
          company: {
            name: formData.companyName || "",
            logoUrl: formData.companyLogo || "",
            domain: formData.companyDomain || "",
          },
        },
      ],
      yearsOfExperience: formData.yearsOfExperience,
      doneOnboarding: true,
    };
    try {
      const res = await updateUserProfile(data);
      console.log(res);
      if (res.status === 200) {
        navigate("/");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (formData.notEmployed === true) {
      setFormData({
        ...formData,
        companyName: "",
        companyLogo: "",
        companyDomain: "",
        title: "",
      });
      setShowDropdown(true);
    }
  }, [formData.notEmployed]);

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
        { value: "data_scientist", label: "Data Scientist" },
        { value: "system_admin", label: "System Administrator" },
        { value: "software_engineer", label: "Software Engineer" },
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
    { value: "default", label: "Select years of experience" },
    { value: "0", label: "Less than 1 year" },
    { value: "1", label: "1 year" },
    { value: "2", label: "2 years" },
    { value: "3", label: "3 years" },
    { value: "4", label: "4 years" },
    { value: "5", label: "5 years" },
    { value: "6", label: "More than 5 years" },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/10 via-background to-primary/5 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Create your profile
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Apply privately to thousands of tech companies & startups with one profile.
            </p>
          </div>

          <form onSubmit={handleSubmission} className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-primary/10 p-6 md:p-8">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-xl p-6 border border-primary/10">
                  <h3 className="text-2xl font-semibold text-text-primary mb-6 flex items-center justify-center">
                    <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-text-inverse text-sm font-bold mr-3">1</span>
                    Basic Information
                  </h3>

                  <div className="space-y-6">
                    <div className="text-center">
                      <label className="block text-lg font-medium text-text-primary mb-3">
                        <span className="text-red-500 mr-1">*</span>Where are you based?
                      </label>
                      <div className="flex justify-center">
                        <CheckBoxLabel text={formData.location} />
                      </div>
                      <div className="flex justify-center mt-2">
                        <SelectInput
                          id="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          options={locationOptions}
                          className="w-full md:w-1/2"
                        />
                      </div>
                    </div>

                    <div className="text-center">
                      <label className="block text-lg font-medium text-text-primary mb-3">
                        <span className="text-red-500 mr-1">*</span>What best describes your current role?
                      </label>
                      <div className="flex justify-center">
                        <CheckBoxLabel text={formData.primaryRole} />
                      </div>
                      <div className="flex justify-center mt-2">
                        <SelectInput
                          id="primaryRole"
                          value={formData.primaryRole}
                          onChange={handleInputChange}
                          options={roleOptions}
                          optgroup={true}
                          className="w-full md:w-1/2"
                        />
                      </div>
                    </div>

                    <div className="text-center">
                      <label className="block text-lg font-medium text-text-primary mb-3">
                        <span className="text-red-500 mr-1">*</span>How many years of experience do you have?
                      </label>
                      <div className="flex justify-center">
                        <CheckBoxLabel
                          text={formData.yearsOfExperience && `${formData.yearsOfExperience} years`}
                        />
                      </div>
                      <div className="flex justify-center mt-2">
                        <SelectInput
                          id="yearsOfExperience"
                          value={formData.yearsOfExperience}
                          onChange={handleInputChange}
                          options={experienceOptions}
                          className="w-full md:w-1/2"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-xl p-6 border border-primary/10">
                  <h3 className="text-2xl font-semibold text-text-primary mb-6 flex items-center justify-center">
                    <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-text-inverse text-sm font-bold mr-3">2</span>
                    Work Experience
                  </h3>

                  <div className="text-center">
                    <label className="block text-lg font-medium text-text-primary mb-3">
                      <span className="text-red-500 mr-1">*</span>Where do you currently work?
                    </label>
                    <p className="text-sm text-text-secondary mb-4 max-w-md mx-auto">
                      Your company will never see that you're looking for a job
                    </p>

                    <div className="flex justify-center mb-4">
                      <CheckBoxLabel text={formData.companyName} />
                    </div>

                    <div className={formData.notEmployed ? "hidden" : "space-y-4"}>
                      <div className="flex justify-center">
                        <InputField
                          label="Job Title"
                          id="title"
                          onChange={handleInputChange}
                          value={formData.title}
                          isRequired={!formData.notEmployed}
                          placeholder="Software Engineer"
                          className="w-full md:w-1/2"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary text-center">
                          Company <span className="text-red-500">*</span>
                        </label>
                        <div className="flex justify-center">
                          {showDropdown ? (
                            <CompanySearch
                              handleDropdown={handleDropdown}
                              width="w-full md:w-1/2"
                            />
                          ) : formData.companyName ? (
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg border border-neutral-200 shadow-sm max-w-md">
                              <div className="flex items-center">
                                <img
                                  src={formData.companyLogo}
                                  alt={formData.companyName}
                                  className="w-12 h-12 rounded-full mr-4 border-2 border-primary/20"
                                />
                                <span className="font-semibold text-text-primary text-lg">
                                  {formData.companyName}
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
                          ) : (
                            <CompanySearch
                              handleDropdown={handleDropdown}
                              width="w-full md:w-1/2"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center mt-4">
                      <div className="flex items-center space-x-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200 max-w-md">
                        <Checkbox
                          label="I'm not currently employed"
                          name="notEmployed"
                          id="notEmployed"
                          checked={formData.notEmployed}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-xl p-6 border border-primary/10">
                  <h3 className="text-2xl font-semibold text-text-primary mb-6 flex items-center justify-center">
                    <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-text-inverse text-sm font-bold mr-3">3</span>
                    Social Profiles
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="LinkedIn Profile"
                      id="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      placeholder="https://www.linkedin.com/in/username"
                      className="w-full"
                    />
                    <InputField
                      label="GitHub Profile"
                      id="github"
                      value={formData.github}
                      onChange={handleInputChange}
                      placeholder="https://github.com/username"
                      className="w-full"
                    />
                    <InputField
                      label="Twitter Profile"
                      id="twitter"
                      value={formData.twitter}
                      onChange={handleInputChange}
                      placeholder="https://twitter.com/username"
                      className="w-full"
                    />
                    <InputField
                      label="Personal Website"
                      id="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://mypersonalwebsite.com"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="text-center pt-6">
                <button
                  type="submit"
                  className="px-12 py-4 bg-gradient-to-r from-primary to-primary-light text-text-inverse text-xl font-semibold rounded-xl hover:from-primary-dark hover:to-primary transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 border border-primary-dark/20"
                >
                  Create your profile
                </button>
              </div>
            </div>
          </form>
      </div>
    </div>
  );
}

export default UserOnboarding;

