import React, { useEffect, useState } from "react";
import SubmissionButton from "../Common/Buttons/SubmissionButton";
import InputField from "../Common/FormComponents/InputField";
import { userService } from "../../services/userService";
import { useI18n } from "../../i18n/I18nContext";

function SocialProfileForm({ userData }) {
  const { t } = useI18n();
  const initialFormData = {
    website: userData?.userProfile?.socialProfiles?.portfolioWebsite || "",
    linkedin: userData?.userProfile?.socialProfiles?.linkedin || "",
    twitter: userData?.userProfile?.socialProfiles?.twitter || "",
    github: userData?.userProfile?.socialProfiles?.github || "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isChanged, setIsChanged] = useState(false);
  const [updating, setUpdating] = useState(null);
  useEffect(() => {
    if (userData) {
      setFormData({
        ...formData,
        website: userData?.userProfile?.socialProfiles?.portfolioWebsite,
        linkedin: userData?.userProfile?.socialProfiles?.linkedin,
        twitter: userData?.userProfile?.socialProfiles?.twitter,
        github: userData?.userProfile?.socialProfiles?.github,
      });
    }
  }, [userData]);

  useEffect(() => {
    setIsChanged(JSON.stringify(formData) !== JSON.stringify(initialFormData));
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      socialProfiles: {
        portfolioWebsite: formData.website,
        linkedin: formData.linkedin,
        twitter: formData.twitter,
        github: formData.github,
      },
    };
    try {
      setUpdating(true);
      const res = await userService.updateUserProfile(data);
      if (res.status === 200) {
        setIsChanged(false);
      }
      setUpdating(false);
    } catch (error) {
      console.log(error);
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    console.log(formData);
  };
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <InputField
          label={t("profile.socialForm.website")}
          id="website"
          value={formData.website}
          onChange={handleInputChange}
          isRequired={false}
          icon={<i className="fa-solid fa-globe"></i>}
          placeholder={"https://"}
        />
        <InputField
          label={t("profile.socialForm.linkedin")}
          id="linkedin"
          value={formData.linkedin}
          onChange={handleInputChange}
          isRequired={false}
          icon={<i className="fa-brands fa-linkedin-in"></i>}
          placeholder={"https://www.linkedin.com/in/username"}
        />
        <InputField
          label={t("profile.socialForm.twitter")}
          id="twitter"
          value={formData.twitter}
          onChange={handleInputChange}
          isRequired={false}
          icon={<i className="fa-brands fa-twitter"></i>}
          placeholder={"https://twitter.com/username"}
        />
        <InputField
          label={t("profile.socialForm.github")}
          id="github"
          value={formData.github}
          onChange={handleInputChange}
          isRequired={false}
          placeholder={"https://github.com/username"}
          icon={<i className="fa-brands fa-github"></i>}
        />
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
              onClick={handleSubmit}
              color="black"
              label={updating ? t("profile.saving") : t("profile.save")}
            />
          </div>
        )}
      </form>
    </div>
  );
}

export default SocialProfileForm;
