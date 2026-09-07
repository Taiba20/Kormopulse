import React from "react";
import Checkbox from "../Common/FormComponents/Checkbox";
import RadioButton from "../Common/FormComponents/RadioButton";

function SideBarFilter({ filters, setFilters }) {
  const handleDatePostChange = (value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      datePosted: value,
    }));
  };

  const handleJobTypeChange = (name) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      jobTypes: prevFilters.jobTypes.includes(name)
        ? prevFilters.jobTypes.filter((type) => type !== name)
        : [...prevFilters.jobTypes, name],
    }));
  };

  const handleExperienceChange = (value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      experience: value,
    }));
  };

  const handleSalaryRangeChange = (from, to) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      salaryRange: {
        from: from,
        to: to,
      },
    }));
  };

  const handleWorkModeChange = (name) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      workMode: prevFilters.workMode.includes(name)
        ? prevFilters.workMode.filter((mode) => mode !== name)
        : [...prevFilters.workMode, name],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      datePosted: "",
      jobTypes: [],
      experience: "",
      salaryRange: {
        from: "",
        to: "",
      },
      workMode: [],
      company: "",
    });
  };
  return (
    <div>
      <div className="text-sm ">
        <div className="border-b px-4">
          <div className="flex justify-between py-4 ">
            <span className=" font-bold">Filter</span>
            <span
              className=" font-bold text-error hover:cursor-pointer"
              onClick={clearAllFilters}
            >
              Clear all
            </span>
          </div>
        </div>

        <div className="px-4">
          <div>
            <div className="py-4">
              <span className="font-bold">Date Post</span>
            </div>
            <div className=" mx-auto space-y-6 border-b pb-4">
              <select 
                onChange={(e) => handleDatePostChange(e.target.value)}
                value={filters.datePosted}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              >
                <option value="">Select date range</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This week</option>
                <option value="this_month">This Month</option>
              </select>
            </div>
          </div>

          <div className="pr-4 border-b pb-4">
            <div className="py-4">
              <span className="font-bold">Job Type</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <Checkbox
                  label="Full-time"
                  name="full-time"
                  checked={filters.jobTypes.includes("full-time")}
                  onChange={() => handleJobTypeChange("full-time")}
                  className={"text-text-secondary text-sm font-medium"}
                />
                <Checkbox
                  label="Part-time"
                  name="part-time"
                  checked={filters.jobTypes.includes("part-time")}
                  onChange={() => handleJobTypeChange("part-time")}
                  className={"text-text-secondary text-sm font-medium"}
                />
              </div>
              <div className="flex justify-between">
                <Checkbox
                  label="Internship"
                  name="internship"
                  checked={filters.jobTypes.includes("internship")}
                  onChange={() => handleJobTypeChange("internship")}
                  className={"text-text-secondary text-sm font-medium"}
                />
                <Checkbox
                  label="Freelance"
                  name="freelance"
                  checked={filters.jobTypes.includes("freelance")}
                  onChange={() => handleJobTypeChange("freelance")}
                  className={"text-text-secondary text-sm font-medium"}
                />
              </div>
            </div>
          </div>

          <div className="pr-4 border-b pb-4">
            <div className="py-4">
              <span className="font-bold">Experience Level</span>
            </div>
            <div className=" ">
              <input
                type="range"
                min="0"
                max="30"
                value={filters.experience || 0}
                onChange={(e) => handleExperienceChange(e.target.value)}
                className="slider h-2 w-full rounded-full accent-primary outline-none transition-colors duration-150 ease-linear cursor-pointer"
              />
            </div>
            <div className="flex justify-between px-1 text-text-secondary font-medium">
              <span>0 Yrs</span>
              <span className="font-bold text-primary">
                {filters.experience || 0} Yrs
              </span>
              <span>30+ Yrs</span>
            </div>
          </div>

          <div className="pr-4 border-b pb-4">
            <div className="py-4">
              <span className="font-bold">Salary Range</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <RadioButton
                  id="under-50k"
                  name="salary-range"
                  value="Under ৳50,000"
                  label="Under ৳50,000"
                  checked={
                    filters.salaryRange.from === 0 &&
                    filters.salaryRange.to === 50000
                  }
                  onChange={() => handleSalaryRangeChange(0, 50000)}
                  className="text-text-secondary text-sm font-medium"
                />
                <RadioButton
                  id="50k-1l"
                  name="salary-range"
                  value="৳50K - ৳1L"
                  label="৳50K - ৳1L"
                  checked={
                    filters.salaryRange.from === 50000 &&
                    filters.salaryRange.to === 100000
                  }
                  onChange={() => handleSalaryRangeChange(50000, 100000)}
                  className="text-text-secondary text-sm font-medium"
                />
              </div>
              <div className="flex justify-between">
                <RadioButton
                  id="1l-2l"
                  name="salary-range"
                  value="৳1L - ৳2L"
                  label="৳1L - ৳2L"
                  checked={
                    filters.salaryRange.from === 100000 &&
                    filters.salaryRange.to === 200000
                  }
                  onChange={() => handleSalaryRangeChange(100000, 200000)}
                  className="text-text-secondary text-sm font-medium"
                />
                <RadioButton
                  id="2l-3l"
                  name="salary-range"
                  value="৳2L - ৳3L"
                  label="৳2L - ৳3L"
                  checked={
                    filters.salaryRange.from === 200000 &&
                    filters.salaryRange.to === 300000
                  }
                  onChange={() => handleSalaryRangeChange(200000, 300000)}
                  className="text-text-secondary text-sm font-medium"
                />
              </div>
              <div className="flex justify-between">
                <RadioButton
                  id="3l-5l"
                  name="salary-range"
                  value="৳3L - ৳5L"
                  label="৳3L - ৳5L"
                  checked={
                    filters.salaryRange.from === 300000 &&
                    filters.salaryRange.to === 500000
                  }
                  onChange={() => handleSalaryRangeChange(300000, 500000)}
                  className="text-text-secondary text-sm font-medium"
                />
                <RadioButton
                  id="more-than-5l"
                  name="salary-range"
                  value="More than ৳5L"
                  label="More than ৳5L"
                  checked={
                    filters.salaryRange.from === 500000 &&
                    filters.salaryRange.to === 10000000000
                  }
                  onChange={() => handleSalaryRangeChange(500000, 10000000000)}
                  className="text-text-secondary text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <div className="pr-4 border-b pb-4">
            <div className="py-4">
              <span className="font-bold">Work Mode</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <Checkbox
                  label="On-site"
                  name="onsite"
                  checked={filters.workMode.includes("onsite")}
                  onChange={() => handleWorkModeChange("onsite")}
                  className="text-text-secondary text-sm font-medium"
                />
                <Checkbox
                  label="Hybrid"
                  name="hybrid"
                  checked={filters.workMode.includes("hybrid")}
                  onChange={() => handleWorkModeChange("hybrid")}
                  className="text-text-secondary text-sm font-medium"
                />
              </div>
              <div className="flex justify-between">
                <Checkbox
                  label="Remote"
                  name="remote"
                  checked={filters.workMode.includes("remote")}
                  onChange={() => handleWorkModeChange("remote")}
                  className="text-text-secondary text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SideBarFilter;
