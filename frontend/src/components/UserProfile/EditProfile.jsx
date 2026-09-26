import { useEffect, useState } from "react";
import AboutForm from "./AboutForm";
import SocialProfileForm from "./SocialProfileForm";
import WorkExperienceCard from "./WorkExperienceCard";
import WorkExperienceForm from "./WorkExperienceForm";
import EducationCard from "./EducationCard";
import EducationForm from "./EducationForm";
import { useSelector } from "react-redux";
import SkillsSearch from "../Common/SkillsSearch";
import { userService } from "../../services/userService";
import useUpdateUserData from "../../hooks/useUpdateUserData";
import ResumeImportModal from "./ResumeImportModal";
import { useI18n } from "../../i18n/I18nContext";

function EditProfile() {
  const { t } = useI18n();
  const [showAddWorkExperience, setShowAddWorkExperience] = useState(false);
  const [showAddEducation, setShowAddEducation] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState(new Map());
  const [skillsMessage, setSkillsMessage] = useState(null); // { type: 'success' | 'error', key }
  const [showResumeImport, setShowResumeImport] = useState(false);

  const { userData } = useSelector((store) => store.auth);
  const userEducation = userData?.userProfile?.education;
  const userWorkExperience = userData?.userProfile?.workExperience;
  const updateUserData = useUpdateUserData();

  const [workExperienceFormData, setWorkExperienceFormData] = useState(null);
  const [educationFormData, setEducationFormData] = useState(null);

  useEffect(() => {
    // Check if userData and userProfile exist
    if (userData && userData.userProfile && userData.userProfile.skills) {
      // Initialize selectedSkills with userData skills
      const initialSkills = new Map(
        userData.userProfile.skills.map((skill) => [skill, true])
      );
      setSelectedSkills(initialSkills);
    }
  }, [userData]); // Trigger effect when userData changes

  // Auto-save skills when they change
  useEffect(() => {
    const saveSkills = async () => {
      try {
        // Only save if we have user data and the skills have actually changed
        if (userData?.userProfile?.skills) {
          const currentSkills = Array.from(selectedSkills.keys());
          const existingSkills = userData.userProfile.skills;
          
          // Check if skills have changed
          const hasChanged = currentSkills.length !== existingSkills.length ||
            currentSkills.some(skill => !existingSkills.includes(skill)) ||
            existingSkills.some(skill => !currentSkills.includes(skill));
          
          if (hasChanged && currentSkills.length > 0) {
            await userService.updateUserProfile({ 
              skills: currentSkills 
            });
            updateUserData();
            setSkillsMessage({ type: 'success', key: 'profile.skillsUpdated' });
            setTimeout(() => setSkillsMessage(null), 3000);
          }
        }
      } catch (error) {
        console.error('Error updating skills:', error);
        setSkillsMessage({ type: 'error', key: 'profile.skillsError' });
        setTimeout(() => setSkillsMessage(null), 3000);
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveSkills, 1000);
    return () => clearTimeout(timeoutId);
  }, [selectedSkills, userData, updateUserData]);

  if (!userData) {
    return (
      <div className="h-screen flex justify-center items-center text-xl font-semibold text-primary">
        {t("profile.loading")}
      </div>
    );
  }
  return (
    <div className="px-6 py-4">
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowResumeImport(true)}
          className="flex items-center gap-2 text-sm bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium hover:bg-primary/20"
        >
          <i className="fa-solid fa-wand-magic-sparkles"></i>
          {t("profile.importFromResume")}
        </button>
      </div>
      <div className="flex flex-col md:flex-row gap-16 my-6 border-b border-neutral-200 pb-10">
        <div className="w-full md:w-[30%] flex flex-col gap-2.5">
          <p className="font-semibold text-primary">{t("profile.about")}</p>
          <p className="text-text-secondary text-sm">
            {t("profile.aboutSub")}
          </p>
        </div>
        <div className="w-full md:w-[70%] ">
          <AboutForm userData={userData} />
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-16 my-6 border-b border-neutral-200 pb-10">
        <div className="w-full md:w-[30%] flex flex-col gap-2.5">
          <p className="font-semibold text-primary">{t("profile.social")}</p>
          <p className="text-text-secondary text-sm">
            {t("profile.socialSub")}
          </p>
        </div>
        <div className="w-full md:w-[70%] ">
          <SocialProfileForm userData={userData} />
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-16 my-6 border-b border-neutral-200 pb-10">
        <div className="w-full md:w-[30%] flex flex-col gap-2.5">
          <p className="font-semibold text-primary">{t("profile.workTitle")}</p>
          <p className="text-text-secondary text-sm">
            {t("profile.workSub")}
          </p>
        </div>
        <div className="w-full md:w-[70%] flex flex-col gap-3.5">
          <div className="flex flex-col gap-3">
            {userWorkExperience && userWorkExperience.length > 0 &&
              userWorkExperience.map((exp, index) => (
                <WorkExperienceCard
                  key={index}
                  exp={exp}
                  setShowAddWorkExperience={setShowAddWorkExperience}
                  setWorkExperienceFormData={setWorkExperienceFormData}
                />
              ))}
          </div>
          {showAddWorkExperience ? (
            <WorkExperienceForm
              setShowAddWorkExperience={setShowAddWorkExperience}
              data={workExperienceFormData}
              setWorkExperienceFormData={setWorkExperienceFormData}
            />
          ) : (
            <div
              className="text-sm text-primary flex gap-1 items-center hover:cursor-pointer hover:text-primary-dark transition-colors duration-200 font-medium"
              onClick={() => setShowAddWorkExperience(true)}
            >
              <i className="fa-solid fa-plus"></i>
              <span>{t("profile.addWork")}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-16 my-6 border-b border-neutral-200 pb-10">
        <div className="w-full md:w-[30%] flex flex-col gap-2.5">
          <p className="font-semibold text-primary">{t("profile.educationTitle")}</p>
          <p className="text-text-secondary text-sm">
            {t("profile.educationSub")}
          </p>
        </div>
        <div className="w-full md:w-[70%] flex flex-col gap-3.5">
          <div className="flex flex-col gap-3">
            {userEducation && userEducation.length > 0 &&
              userEducation.map((edu, index) => (
                <EducationCard
                  key={index}
                  edu={edu}
                  setShowAddEducation={setShowAddEducation}
                  setEducationFormData={setEducationFormData}
                />
              ))}
          </div>

          {showAddEducation ? (
            <EducationForm
              setShowAddEducation={setShowAddEducation}
              educationFormData={educationFormData}
              setEducationFormData={setEducationFormData}
            />
          ) : (
            <div
              className="text-sm text-primary flex gap-1 items-center hover:cursor-pointer hover:text-primary-dark transition-colors duration-200 font-medium"
              onClick={() => setShowAddEducation(true)}
            >
              <i className="fa-solid fa-plus"></i>
              <span>{t("profile.addEducation")}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-16 my-6 border-b border-neutral-200 pb-10">
        <div className="w-full md:w-[30%] flex flex-col gap-2.5">
          <p className="font-semibold text-primary">{t("profile.skillsTitle")}</p>
          <p className="text-text-secondary text-sm">
            {t("profile.skillsSub")}
          </p>
        </div>
        <div className="w-full md:w-[70%] flex flex-col gap-3.5">
          {skillsMessage && (
            <div className={`p-2 rounded text-sm ${
              skillsMessage.type === 'error' 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {t(skillsMessage.key)}
            </div>
          )}
          <SkillsSearch
            selectedSkills={selectedSkills}
            setSelectedSkills={setSelectedSkills}
            profile={true}
          />
        </div>
      </div>

      {showResumeImport && (
        <ResumeImportModal
          onClose={() => setShowResumeImport(false)}
          onApplied={async () => {
            setShowResumeImport(false);
            await updateUserData();
          }}
        />
      )}
    </div>
  );
}

export default EditProfile;
