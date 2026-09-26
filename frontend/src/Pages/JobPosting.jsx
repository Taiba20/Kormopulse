import React, { useEffect, useState } from "react";
import SelectInput from "../components/Common/FormComponents/SelectInput";
import DynamicInputForm from "../components/Common/FormComponents/DynamicInputForm";
import InputField from "../components/Common/FormComponents/InputField";
import Checkbox from "../components/Common/FormComponents/Checkbox";
import SubmissionButton from "../components/Common/Buttons/SubmissionButton";
import RadioButton from "../components/Common/FormComponents/RadioButton";
import SkillsSearch from "../components/Common/SkillsSearch";
import TextEditor from "../components/Common/FormComponents/TextEditor";
import { useNavigate } from "react-router-dom";
import { companyService } from "../services/companyService";
import { useI18n } from "../i18n/I18nContext";
import { JOB_ROLE_GROUPS } from "../data/jobRoles";

function JobPosting() {
  const { t, tError } = useI18n();
  const [roleValue, setRoleValue] = useState("");
  const [selectedSkills, setSelectedSkills] = useState(new Map());
  const [generatingDescription, setGeneratingDescription] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    responsibilities: [],
    requirements: [],
    skills: [],
    education: "",
    experience: {
      min: 0,
      max: 5
    },
    salary: {
      min: 0,
      max: 0,
      currency: "TK",
      negotiable: false
    },
    jobType: "full-time",
    location: "",
    benefits: [],
    applicationDeadline: "",
    workMode: "onsite",
    category: "",
    additionalRequirements: [],
    urgent: false,
    numberOfOpenings: 1,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      skills: Array.from(selectedSkills.keys()),
    }));
  }, [selectedSkills]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input change:', name, value);
    
    if (name === 'category') {
      // value is "category::roleId": the API only stores the category, the select remembers the role
      setRoleValue(value);
      setFormData((prevData) => ({ ...prevData, category: value.split("::")[0] }));
    } else if (name === 'experience') {
      const selectedOption = experienceOptions.find(option => option.value === value);
      if (selectedOption) {
        setFormData((prevData) => ({
          ...prevData,
          experience: { 
            min: selectedOption.min, 
            max: selectedOption.max 
          }
        }));
      }
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: checked,
    }));
  };

  const handleArrayInputChange = (name, index, event) => {
    if (Array.isArray(event)) {
      setFormData((prevData) => ({ ...prevData, [name]: event }));
    } else {
      setFormData((prevData) => {
        const array = [...prevData[name]];
        array[index] = event.target.value;
        return { ...prevData, [name]: array };
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = t("posting.errors.title");
    }
    
    if (!formData.jobType || formData.jobType === "default") {
      newErrors.jobType = t("posting.errors.type");
    }
    
    if (!formData.category) {
      newErrors.category = t("posting.errors.role");
    }
    
    if (!formData.experience || formData.experience.min === undefined) {
      newErrors.experience = t("posting.errors.experience");
    }
    
    if (selectedSkills.size === 0) {
      newErrors.skills = t("posting.errors.skills");
    }
    
    if (!formData.applicationDeadline) {
      newErrors.applicationDeadline = t("posting.errors.deadline");
    }
    
    if (!formData.workMode) {
      newErrors.workMode = t("posting.errors.workMode");
    }
    
    // Validate salary range
    if (formData.salary.min > 0 && formData.salary.max > 0 && formData.salary.min >= formData.salary.max) {
      newErrors.salary = t("posting.errors.salary");
    }
    
    setErrors(newErrors);
    
    // Debug logging
    console.log('Form validation errors:', newErrors);
    console.log('Form data:', {
      title: formData.title,
      jobType: formData.jobType,
      category: formData.category,
      experience: formData.experience,
      skills: selectedSkills.size,
      applicationDeadline: formData.applicationDeadline,
      description: formData.description
    });
    
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleGenerate = async () => {
    const jobData = { ...formData };
    
    // Remove fields that shouldn't be sent to generation API
    if ('description' in jobData) {
      delete jobData.description;
    }
    if ('urgent' in jobData) {
      delete jobData.urgent;
    }

    // Only the title is needed for AI generation
    if (!jobData.title) {
      alert(t("posting.generateNeedsTitle"));
      return;
    }
    
    setGeneratingDescription(true);
    try {
      const res = await companyService.generateJobDescription(jobData);
      setGeneratingDescription(false);
      console.log('Generated description response:', res);
      
      if (res) {
        setFormData(prev => ({ ...prev, description: res }));
      }
    } catch (error) {
      const errorMessage = tError(error) || error.message;
      if (errorMessage.includes("Quota exceeded")) {
        alert(t("posting.quota"));
      } else {
        alert(t("posting.generateFailed", { message: errorMessage }));
      }
      setGeneratingDescription(false);
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submitting
    const validation = validateForm();
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join('\n• ');
      alert(`${t("posting.fixErrors")}\n\n• ${errorMessages}`);
      return;
    }
    
    setSubmitting(true);

    try {
      const jobData = {
        ...formData,
        // Convert salary structure
        salary: {
          min: Number(formData.salary.min) || 0,
          max: Number(formData.salary.max) || 0,
          currency: formData.salary.currency || 'USD',
          negotiable: Boolean(formData.salary.negotiable)
        },
        // Ensure category is set
        category: formData.category || 'technology',
        // Ensure arrays are properly set
        additionalRequirements: Array.isArray(formData.additionalRequirements) 
          ? formData.additionalRequirements.filter(req => req.trim() !== '')
          : [],
        skills: Array.isArray(formData.skills) 
          ? formData.skills.filter(skill => skill.trim() !== '')
          : [],
        benefits: Array.isArray(formData.benefits) 
          ? formData.benefits.filter(benefit => benefit.trim() !== '')
          : [],
        requirements: Array.isArray(formData.requirements) 
          ? formData.requirements.filter(req => req.trim() !== '')
          : [],
        responsibilities: Array.isArray(formData.responsibilities) 
          ? formData.responsibilities.filter(resp => resp.trim() !== '')
          : []
      };

      // Remove any empty string fields and empty keys
      Object.keys(jobData).forEach(key => {
        if (key === '' || jobData[key] === '' || jobData[key] === null || jobData[key] === undefined) {
          delete jobData[key];
        }
      });
      
      console.log('Submitting job data:', jobData);
      const response = await companyService.postNewJob(jobData);
      console.log('Job posting response:', response);
      
      // Use browser alert instead of Dialogbox
      alert(t("posting.success"));
      navigate("/jobs");
    } catch (error) {
      console.error('Job posting error:', error);
      const errorMessage = tError(error) || error.message || t('posting.postFailedDefault');
      
      // Use browser alert instead of Dialogbox
      alert(t("posting.postFailed", { message: errorMessage }));
    }
    setSubmitting(false);
  };

  const jobTypeOptions = [
    { value: "default", label: t("posting.selectType") },
    { value: "full-time", label: t("enums.jobType.full-time") },
    { value: "part-time", label: t("enums.jobType.part-time") },
    { value: "internship", label: t("enums.jobType.internship") },
    { value: "freelance", label: t("enums.jobType.freelance") },
    { value: "contract", label: t("enums.jobType.contract") },
  ];

  // Several roles share one API category, so each <option> needs its own value ("category::roleId");
  // with duplicate values a controlled <select> always displays the first role of that category.
  const roleOptions = JOB_ROLE_GROUPS.map((group) => ({
    label: t(`jobRoleGroups.${group.key}`),
    options: group.roles.map((role) => ({
      value: `${role.category}::${role.id}`,
      label: t(`jobRoles.${role.id}`),
    })),
  }));

  const experienceOptions = [
    { value: "0", label: t("profile.experienceOptions.0"), min: 0, max: 1 },
    { value: "1", label: t("profile.experienceOptions.1"), min: 1, max: 2 },
    { value: "2", label: t("profile.experienceOptions.2"), min: 2, max: 3 },
    { value: "3", label: t("profile.experienceOptions.3"), min: 3, max: 5 },
    { value: "4", label: t("profile.experienceOptions.4"), min: 4, max: 6 },
    { value: "5", label: t("profile.experienceOptions.5"), min: 5, max: 8 },
    { value: "6", label: t("profile.experienceOptions.6"), min: 5, max: 10 },
  ];

  return (
    <div className="py-3 px-2 md:px-8 lg:px-20 pt-20">
      <div className="my-5">
        <h2 className="font-semibold text-2xl">{t("posting.title")}</h2>
      </div>
      <div className="border rounded">
        <div className="p-3 font-medium text-lg px-5 border-b">
          {t("posting.section1")}
        </div>
        <div className="p-5">
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <div>
              <InputField
                label={t("posting.titleLabel")}
                description={t("posting.titleDesc")}
                isRequired={true}
                placeholder={t("posting.titlePlaceholder")}
                id="title"
                name="title"
                onChange={handleInputChange}
                error={errors.title}
              />
            </div>

            <div>
              <SelectInput
                label={t("posting.typeLabel")}
                description={t("posting.typeDesc")}
                isRequired={true}
                id="jobType"
                name="jobType"
                value={formData.jobType}
                options={jobTypeOptions}
                onChange={handleInputChange}
                error={errors.jobType}
              />
            </div>

            <div>
              <SelectInput
                label={t("posting.roleLabel")}
                description={t("posting.roleDesc")}
                id="category"
                name="category"
                value={roleValue}
                options={roleOptions}
                placeholder={t("posting.rolePlaceholder")}
                isRequired={true}
                optgroup={true}
                onChange={handleInputChange}
                error={errors.category}
              />
            </div>

            <div>
              <SelectInput
                label={t("posting.expLabel")}
                description={t("posting.expDesc")}
                id="experience"
                name="experience"
                value={experienceOptions.find(option => 
                  option.min === formData.experience.min && option.max === formData.experience.max
                )?.value || ""}
                options={experienceOptions}
                placeholder={t("posting.expPlaceholder")}
                isRequired={true}
                onChange={handleInputChange}
                error={errors.experience}
              />
            </div>

            <div>
              <label className="font-medium flex gap-2">
                <span>
                  {t("posting.skills")}
                  <span className="text-text-secondary">*</span>
                </span>
              </label>

              <span className="text-text-secondary text-sm ml-1.5 ">
                {t("posting.skillsHint")}
              </span>
              <SkillsSearch
                selectedSkills={selectedSkills}
                setSelectedSkills={setSelectedSkills}
              />
              {errors.skills && (
                <p className="mt-1 text-sm text-error">{errors.skills}</p>
              )}
            </div>

            <div>
              <InputField
                label={t("posting.education")}
                description={t("posting.educationDesc")}
                id="education"
                value={formData.education}
                onChange={handleInputChange}
                placeholder={t("posting.educationPlaceholder")}
              />
            </div>
            <div>
              <InputField
                label={t("posting.location")}
                description={t("posting.locationDesc")}
                id="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder={t("posting.locationPlaceholder")}
              />
            </div>

            <div>
              <InputField
                label={t("posting.deadline")}
                isRequired={true}
                id="applicationDeadline"
                name="applicationDeadline"
                type="date"
                value={formData.applicationDeadline}
                onChange={handleInputChange}
                error={errors.applicationDeadline}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <span className="font-semibold text-lg">{t("posting.workMode")}</span>
              <span className="text-sm text-text-secondary">
                {t("posting.workModeDesc")}
              </span>
              <div className="flex space-x-4">
                <RadioButton
                  id="onsite"
                  name="workMode"
                  value="onsite"
                  checked={formData.workMode === "onsite"}
                  onChange={handleInputChange}
                  label={t("enums.workMode.onsite")}
                />
                <RadioButton
                  id="hybrid"
                  name="workMode"
                  value="hybrid"
                  checked={formData.workMode === "hybrid"}
                  onChange={handleInputChange}
                  label={t("enums.workMode.hybrid")}
                />
                <RadioButton
                  id="remote"
                  name="workMode"
                  value="remote"
                  checked={formData.workMode === "remote"}
                  onChange={handleInputChange}
                  label={t("enums.workMode.remote")}
                />
              </div>
            </div>

            <div className="py-3 font-medium text-lg border-b">
              {t("posting.section2")}
            </div>
            <div className=" flex flex-col gap-5">
              <div>
                <DynamicInputForm
                  label={t("posting.responsibilities")}
                  description={t("posting.responsibilitiesDesc")}
                  name="responsibilities"
                  values={formData.responsibilities}
                  handleInputChange={handleArrayInputChange}
                  placeholder={t("posting.responsibilitiesPlaceholder")}
                />
              </div>
              <div>
                <DynamicInputForm
                  label={t("posting.requirements")}
                  description={t("posting.requirementsDesc")}
                  name="requirements"
                  values={formData.requirements}
                  handleInputChange={handleArrayInputChange}
                  placeholder={t("posting.requirementsPlaceholder")}
                />
              </div>
              <div>
                <DynamicInputForm
                  label={t("posting.benefits")}
                  description={t("posting.benefitsDesc")}
                  name="benefits"
                  values={formData.benefits}
                  handleInputChange={handleArrayInputChange}
                  placeholder={t("posting.benefitsPlaceholder")}
                />
              </div>

              <div>
                <InputField
                  label={t("posting.additional")}
                  description={t("posting.additionalDesc")}
                  placeholder={t("posting.additionalPlaceholder")}
                  id="additionalRequirements"
                  name="additionalRequirements"
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <InputField
                  label={t("posting.openings")}
                  id="numberOfOpenings"
                  type="number"
                  description={t("posting.openingsDesc")}
                  value={formData.numberOfOpenings}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex space-x-3">
                <InputField
                  label={t("posting.salaryFrom")}
                  id="min"
                  name="salary.min"
                  type="number"
                  description={t("posting.salaryFromDesc")}
                  value={formData.salary.min}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    salary: { ...prev.salary, min: parseFloat(e.target.value) || 0 }
                  }))}
                />
                <InputField
                  label={t("posting.salaryTo")}
                  id="max"
                  name="salary.max"
                  type="number"
                  description={t("posting.salaryToDesc")}
                  value={formData.salary.max}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    salary: { ...prev.salary, max: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              {errors.salary && (
                <p className="mt-1 text-sm text-error">{errors.salary}</p>
              )}

              <div>
                <Checkbox
                  label={t("posting.urgent")}
                  name="urgent"
                  checked={formData.urgent}
                  onChange={handleCheckboxChange}
                />
              </div>
            </div>
            <div>
              <TextEditor
                label={t("posting.description")}
                isRequired={true}
                placeholder={t("posting.descriptionPlaceholder")}
                id={"description"}
                name={"description"}
                onChange={handleInputChange}
                aiButton={true}
                handleGenerate={handleGenerate}
                generatingDescription={generatingDescription}
                value={formData.description}
                error={errors.description}
              />
            </div>

            <SubmissionButton 
              label={submitting ? t("posting.submitting") : t("posting.submit")} 
              type="submit" 
              className={"py-3"} 
            />
          </form>
        </div>
      </div>
    </div>
  );
}

export default JobPosting;
