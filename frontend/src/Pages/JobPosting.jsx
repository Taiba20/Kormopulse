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

function JobPosting() {
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
    
    if (name === 'experience') {
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
      newErrors.title = "Job title is required";
    }
    
    if (!formData.jobType || formData.jobType === "default") {
      newErrors.jobType = "Please select a job type";
    }
    
    if (!formData.category) {
      newErrors.category = "Please select a primary role";
    }
    
    if (!formData.experience || formData.experience.min === undefined) {
      newErrors.experience = "Please select years of experience";
    }
    
    if (selectedSkills.size === 0) {
      newErrors.skills = "At least one skill is required";
    }
    
    if (!formData.applicationDeadline) {
      newErrors.applicationDeadline = "Application deadline is required";
    }
    
    if (!formData.workMode) {
      newErrors.workMode = "Please select a work mode";
    }
    
    // Validate salary range
    if (formData.salary.min > 0 && formData.salary.max > 0 && formData.salary.min >= formData.salary.max) {
      newErrors.salary = "Maximum salary must be greater than minimum salary";
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

    // Check required fields (only 'title' is needed for AI generation)
    const requiredFields = ['title'];
    const missingFields = requiredFields.filter(field => !jobData[field]);
    
    if (missingFields.length > 0) {
      alert(`Incomplete Form: Please fill the following required fields: ${missingFields.join(', ')}`);
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
      const errorMessage = error.response?.data?.message || error.message;
      if (errorMessage.includes("Quota exceeded")) {
        alert("Quota Exceeded: You reached the limit for free job description generations. An upgrade to the plan is required to continue using this feature.");
      } else {
        alert(`Error generating job description: ${errorMessage}`);
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
      alert(`Please fix the following errors before submitting:\n\n• ${errorMessages}`);
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
      alert("Job Posting Successful! Your job posting has been submitted successfully.");
      navigate("/jobs");
    } catch (error) {
      console.error('Job posting error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to post job';
      
      // Use browser alert instead of Dialogbox
      alert(`Error Posting Job: ${errorMessage}`);
    }
    setSubmitting(false);
  };

  const jobTypeOptions = [
    { value: "default", label: "Select Job Type" },
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "internship", label: "Internship" },
    { value: "freelance", label: "Freelance" },
    { value: "contract", label: "Contract" },
  ];

  const roleOptions = [
    {
      label: "Technology",
      options: [
        { value: "software-development", label: "Software Engineer" },
        { value: "software-development", label: "Frontend Developer" },
        { value: "software-development", label: "Backend Developer" },
        { value: "software-development", label: "Full Stack Developer" },
        { value: "software-development", label: "Mobile App Developer" },
        { value: "software-development", label: "DevOps Engineer" },
        { value: "software-development", label: "QA Engineer" },
        { value: "software-development", label: "System Administrator" },
        { value: "data-science", label: "Data Scientist" },
        { value: "data-science", label: "Data Analyst" },
        { value: "data-science", label: "Machine Learning Engineer" },
        { value: "data-science", label: "AI Engineer" },
        { value: "technology", label: "Product Manager" },
        { value: "technology", label: "Technical Lead" },
        { value: "technology", label: "CTO" },
        { value: "technology", label: "IT Support Specialist" },
        { value: "technology", label: "Cybersecurity Analyst" },
        { value: "technology", label: "Network Engineer" },
        { value: "technology", label: "Database Administrator" },
        { value: "technology", label: "Cloud Architect" },
        { value: "technology", label: "Blockchain Developer" },
        { value: "technology", label: "Game Developer" },
        { value: "technology", label: "Embedded Systems Engineer" },
      ],
    },
    {
      label: "Design & Creative",
      options: [
        { value: "design", label: "UI/UX Designer" },
        { value: "design", label: "Graphic Designer" },
        { value: "design", label: "Product Designer" },
        { value: "design", label: "UX Researcher" },
        { value: "design", label: "Visual Designer" },
        { value: "design", label: "Creative Director" },
        { value: "design", label: "Art Director" },
        { value: "design", label: "Brand Designer" },
        { value: "design", label: "Motion Graphics Designer" },
        { value: "design", label: "Illustrator" },
      ],
    },
    {
      label: "Marketing & Sales",
      options: [
        { value: "marketing", label: "Marketing Manager" },
        { value: "marketing", label: "Digital Marketing Specialist" },
        { value: "marketing", label: "Content Marketing Manager" },
        { value: "marketing", label: "SEO Specialist" },
        { value: "marketing", label: "Social Media Manager" },
        { value: "marketing", label: "Marketing Analyst" },
        { value: "marketing", label: "Brand Manager" },
        { value: "marketing", label: "Public Relations Specialist" },
        { value: "marketing", label: "Email Marketing Specialist" },
        { value: "marketing", label: "Growth Hacker" },
        { value: "sales", label: "Sales Representative" },
        { value: "sales", label: "Sales Manager" },
        { value: "sales", label: "Business Development Manager" },
        { value: "sales", label: "Account Executive" },
        { value: "sales", label: "Sales Engineer" },
        { value: "sales", label: "Customer Success Manager" },
        { value: "sales", label: "Sales Operations Manager" },
        { value: "sales", label: "Channel Sales Manager" },
        { value: "sales", label: "Territory Sales Manager" },
        { value: "sales", label: "Inside Sales Representative" },
      ],
    },
    {
      label: "Finance & Business",
      options: [
        { value: "finance", label: "Financial Analyst" },
        { value: "finance", label: "Accountant" },
        { value: "finance", label: "Financial Planner" },
        { value: "finance", label: "Investment Banker" },
        { value: "finance", label: "Financial Controller" },
        { value: "finance", label: "Treasury Analyst" },
        { value: "finance", label: "Risk Analyst" },
        { value: "finance", label: "Financial Advisor" },
        { value: "finance", label: "Auditor" },
        { value: "finance", label: "Tax Specialist" },
        { value: "consulting", label: "Business Analyst" },
        { value: "consulting", label: "Management Consultant" },
        { value: "consulting", label: "Strategy Consultant" },
        { value: "consulting", label: "Financial Consultant" },
      ],
    },
    {
      label: "Human Resources & Operations",
      options: [
        { value: "human-resources", label: "HR Manager" },
        { value: "human-resources", label: "Recruiter" },
        { value: "human-resources", label: "Talent Acquisition Specialist" },
        { value: "human-resources", label: "HR Business Partner" },
        { value: "human-resources", label: "Training Coordinator" },
        { value: "human-resources", label: "Employee Relations Specialist" },
        { value: "human-resources", label: "Compensation Analyst" },
        { value: "human-resources", label: "Benefits Administrator" },
        { value: "human-resources", label: "HR Generalist" },
        { value: "human-resources", label: "People Operations Manager" },
        { value: "operations", label: "Operations Manager" },
        { value: "operations", label: "Project Manager" },
        { value: "operations", label: "Program Manager" },
        { value: "operations", label: "Supply Chain Manager" },
        { value: "operations", label: "Logistics Coordinator" },
        { value: "operations", label: "Quality Assurance Manager" },
        { value: "operations", label: "Process Improvement Specialist" },
        { value: "operations", label: "Operations Analyst" },
        { value: "operations", label: "Facility Manager" },
        { value: "operations", label: "Vendor Manager" },
      ],
    },
    {
      label: "Customer Service",
      options: [
        { value: "customer-service", label: "Customer Service Representative" },
        { value: "customer-service", label: "Customer Support Specialist" },
        { value: "customer-service", label: "Technical Support Engineer" },
        { value: "customer-service", label: "Customer Success Specialist" },
        { value: "customer-service", label: "Client Services Manager" },
        { value: "customer-service", label: "Help Desk Technician" },
        { value: "customer-service", label: "Customer Experience Manager" },
        { value: "customer-service", label: "Support Operations Manager" },
        { value: "customer-service", label: "Account Manager" },
        { value: "customer-service", label: "Relationship Manager" },
      ],
    },
    {
      label: "Healthcare & Education",
      options: [
        { value: "healthcare", label: "Registered Nurse" },
        { value: "healthcare", label: "Physician" },
        { value: "healthcare", label: "Pharmacist" },
        { value: "healthcare", label: "Physical Therapist" },
        { value: "healthcare", label: "Medical Laboratory Scientist" },
        { value: "healthcare", label: "Radiologic Technologist" },
        { value: "healthcare", label: "Occupational Therapist" },
        { value: "healthcare", label: "Healthcare Administrator" },
        { value: "healthcare", label: "Medical Assistant" },
        { value: "healthcare", label: "Nurse Practitioner" },
        { value: "education", label: "Teacher" },
        { value: "education", label: "Professor" },
        { value: "education", label: "School Counselor" },
        { value: "education", label: "Curriculum Developer" },
        { value: "education", label: "Educational Administrator" },
        { value: "education", label: "Instructional Designer" },
        { value: "education", label: "Librarian" },
        { value: "education", label: "Education Consultant" },
        { value: "education", label: "Training Specialist" },
        { value: "education", label: "Academic Advisor" },
      ],
    },
    {
      label: "Engineering & Consulting",
      options: [
        { value: "engineering", label: "Mechanical Engineer" },
        { value: "engineering", label: "Electrical Engineer" },
        { value: "engineering", label: "Civil Engineer" },
        { value: "engineering", label: "Chemical Engineer" },
        { value: "engineering", label: "Aerospace Engineer" },
        { value: "engineering", label: "Biomedical Engineer" },
        { value: "engineering", label: "Environmental Engineer" },
        { value: "engineering", label: "Industrial Engineer" },
        { value: "engineering", label: "Materials Engineer" },
        { value: "engineering", label: "Structural Engineer" },
        { value: "consulting", label: "IT Consultant" },
        { value: "consulting", label: "Technical Consultant" },
        { value: "consulting", label: "Process Consultant" },
        { value: "consulting", label: "Change Management Consultant" },
        { value: "consulting", label: "Legal Consultant" },
      ],
    },
    {
      label: "Other",
      options: [
        { value: "other", label: "Other" },
      ],
    },
  ];

  const experienceOptions = [
    { value: "0", label: "Less than 1 year", min: 0, max: 1 },
    { value: "1", label: "1 year", min: 1, max: 2 },
    { value: "2", label: "2 years", min: 2, max: 3 },
    { value: "3", label: "3 years", min: 3, max: 5 },
    { value: "4", label: "4 years", min: 4, max: 6 },
    { value: "5", label: "5 years", min: 5, max: 8 },
    { value: "6", label: "More than 5 years", min: 5, max: 10 },
  ];

  return (
    <div className="py-3 px-2 md:px-8 lg:px-20 pt-20">
      <div className="my-5">
        <h2 className="font-semibold text-2xl">New Job Posting</h2>
      </div>
      <div className="border rounded">
        <div className="p-3 font-medium text-lg px-5 border-b">
          1. Job Details
        </div>
        <div className="p-5">
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <div>
              <InputField
                label="Title"
                description="Enter the title of the job position you are posting."
                isRequired={true}
                placeholder="E.g., 'Software Engineer', 'Product Designer', etc."
                id="title"
                name="title"
                onChange={handleInputChange}
                error={errors.title}
              />
            </div>

            <div>
              <SelectInput
                label="Type of position"
                description="Select the type of position you are offering."
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
                label="Select your primary role"
                description="Select the primary role that the candidate will be expected to perform."
                id="category"
                name="category"
                value={formData.category}
                options={roleOptions}
                isRequired={true}
                optgroup={true}
                onChange={handleInputChange}
                error={errors.category}
              />
            </div>

            <div>
              <SelectInput
                label="Years of experience"
                description="Select the minimum years of experience required for the position."
                id="experience"
                name="experience"
                value={experienceOptions.find(option => 
                  option.min === formData.experience.min && option.max === formData.experience.max
                )?.value || ""}
                options={experienceOptions}
                isRequired={true}
                onChange={handleInputChange}
                error={errors.experience}
              />
            </div>

            <div>
              <label className="font-medium flex gap-2">
                <span>
                  Skills
                  <span className="text-text-secondary">*</span>
                </span>
              </label>

              <span className="text-text-secondary text-sm ml-1.5 ">
                Input job's required skills from the dropdown in the 'Skills'
                field.
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
                label="Education"
                description="Specify the educational qualifications required for the position."
                id="education"
                value={formData.education}
                onChange={handleInputChange}
                placeholder="E.g., 'Bachelor's in Computer Science'"
              />
            </div>
            <div>
              <InputField
                label="Location"
                description="Specify the work location for the position."
                id="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="E.g., 'Dhaka, Bangladesh'"
              />
            </div>

            <div>
              <InputField
                label="Application Deadline"
                isRequired={true}
                placeholder="e.g. Software Engineer. Product Designer, etc."
                id="applicationDeadline"
                name="applicationDeadline"
                type="date"
                value={formData.applicationDeadline}
                onChange={handleInputChange}
                error={errors.applicationDeadline}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <span className="font-semibold text-lg">Work Mode</span>
              <span className="text-sm text-text-secondary">
                Please select your preferred work mode
              </span>
              <div className="flex space-x-4">
                <RadioButton
                  id="onsite"
                  name="workMode"
                  value="onsite"
                  checked={formData.workMode === "onsite"}
                  onChange={handleInputChange}
                  label="Onsite"
                />
                <RadioButton
                  id="hybrid"
                  name="workMode"
                  value="hybrid"
                  checked={formData.workMode === "hybrid"}
                  onChange={handleInputChange}
                  label="Hybrid"
                />
                <RadioButton
                  id="remote"
                  name="workMode"
                  value="remote"
                  checked={formData.workMode === "remote"}
                  onChange={handleInputChange}
                  label="Remote"
                />
              </div>
            </div>

            <div className="py-3 font-medium text-lg border-b">
              2. Additional Details
            </div>
            <div className=" flex flex-col gap-5">
              <div>
                <DynamicInputForm
                  label="Responsibilities"
                  description="Enter the responsibilities associated with the position here. These could include tasks that the person in this role would be expected to perform, duties they would need to carry out, and any responsibilities they would have. Each responsibility should be entered separately. Click on 'Add' after typing each responsibility."
                  name="responsibilities"
                  values={formData.responsibilities}
                  handleInputChange={handleArrayInputChange}
                  placeholder="E.g., 'Manage team meetings'"
                />
              </div>
              <div>
                <DynamicInputForm
                  label="Requirements"
                  description="Enter the requirements for the position here. These could include necessary skills, qualifications, or experiences that the candidate should possess. Each requirement should be entered separately. Click on 'Add' after typing each requirement."
                  name="requirements"
                  values={formData.requirements}
                  handleInputChange={handleArrayInputChange}
                  placeholder="E.g., 'Minimum 5 years of experience in management'"
                />
              </div>
              <div>
                <DynamicInputForm
                  label="Benefits"
                  description="List the benefits associated with the position here. These could include health insurance, retirement plans, paid time off, or other perks offered by your company. Each benefit should be entered separately. Click on 'Add' after typing each benefit."
                  name="benefits"
                  values={formData.benefits}
                  handleInputChange={handleArrayInputChange}
                  placeholder="E.g., 'Health insurance coverage'"
                />
              </div>

              <div>
                <InputField
                  label="Additional Requirements"
                  description="Specify any additional requirements for the job that were not covered in the main requirements section."
                  placeholder="Specify any additional requirements for the job."
                  id="additionalRequirements"
                  name="additionalRequirements"
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <InputField
                  label="Number of Openings"
                  id="numberOfOpenings"
                  type="number"
                  description="Enter the number of vacancies for this position."
                  value={formData.numberOfOpenings}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex space-x-3">
                <InputField
                  label="Salary Range From"
                  id="min"
                  name="salary.min"
                  type="number"
                  description="Enter the minimum salary for this position."
                  value={formData.salary.min}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    salary: { ...prev.salary, min: parseFloat(e.target.value) || 0 }
                  }))}
                />
                <InputField
                  label="Salary Range To"
                  id="max"
                  name="salary.max"
                  type="number"
                  description="Enter the maximum salary for this position."
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
                  label="Urgent?"
                  name="urgent"
                  checked={formData.urgent}
                  onChange={handleCheckboxChange}
                />
              </div>
            </div>
            <div>
              <TextEditor
                label={"Description"}
                isRequired={true}
                placeholder={
                  "Provide a detailed description of the position. This could include the responsibilities, tasks, and expectations associated with the role."
                }
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
              label={submitting ? "Submitting..." : "Submit"} 
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
