import React, { useState } from "react";
import Searchbar from "./Searchbar";
import SideBarFilter from "./SideBarFilter";
import JobCard from "./JobCard";
import { useEffect } from "react";
import { contentService } from "../../services/contentService";
import { applicationService } from "../../services/applicationService";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useI18n } from "../../i18n/I18nContext";

function MainJobSection() {
  const { t, formatNumber } = useI18n();
  const { userData } = useSelector((store) => store.auth);
  const [searchParams] = useSearchParams();
  const companyFilter = searchParams.get('company');
  const [matches, setMatches] = useState({});

  const [filters, setFilters] = useState({
    datePosted: "",
    jobTypes: [],
    experience: "",
    salaryRange: {
      from: "",
      to: "",
    },
    workMode: [],
    company: companyFilter || "",
  });

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(null);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  const getJobs = async (filters) => {
    setLoading(true);
    console.log('MainJobSection: Calling getJobs with filters:', filters);
    try {
      const res = await contentService.getJobs(filters);
      console.log('MainJobSection: Jobs API response:', res);
      if (res && res.jobs) {
        console.log('MainJobSection: Setting jobs, count:', res.jobs.length);
        const jobList = Array.isArray(res.jobs) ? res.jobs : [];
        setJobs(jobList);
        if (userData?.role === "jobSeeker" && jobList.length > 0) {
          applicationService
            .getMatchScores(jobList.map((j) => j._id))
            .then((data) => setMatches(data.scores || {}))
            .catch(() => {});
        }
      } else {
        console.warn('MainJobSection: Unexpected response structure:', res);
        setJobs([]);
      }
    } catch (error) {
      console.error('MainJobSection: Error fetching jobs:', error);
      setJobs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    console.log(selectedLocation);
    const debounceTimer = setTimeout(() => {
      getJobs({ ...filters, search, location: selectedLocation });
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters, search, selectedLocation]);

  const redirectToDetail = (id) => {
    navigate(`/jobs/${id}`);
  };

  return (
    <div className="flex flex-col px-5 md:px-14 lg:px-5 gap-5 lg:flex-row">
      {/* Left */}
      <div className="border rounded-xl w-full lg:w-[30%] mlg:sticky top-0 lg:h-screen mb-3 hidden lg:block">
        <SideBarFilter filters={filters} setFilters={setFilters} />
      </div>

      {/* Right */}
      <div className=" rounded-xl w-full lg:w-[70%] overflow-auto">
        <div>
          <Searchbar
            setSearch={setSearch}
            search={search}
            setSelectedLocation={setSelectedLocation}
          />
        </div>
        <div>
          <div className="text-text-secondary font-medium my-3 ml-1.5">
            <span>{t("jobs.resultsCount", { count: formatNumber(jobs.length) })}</span>
          </div>
          <div>
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="text-lg text-neutral-600">{t("jobs.loadingJobs")}</div>
              </div>
            ) : jobs.length > 0 ? (
              jobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  redirectToDetail={redirectToDetail}
                  match={matches[job._id]}
                />
              ))
            ) : (
              <div className="flex justify-center items-center p-8">
                <div className="text-lg text-neutral-600">{t("jobs.noJobs")}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainJobSection;
