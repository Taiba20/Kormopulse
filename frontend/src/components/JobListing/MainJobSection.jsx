import React, { useState } from "react";
import Searchbar from "./Searchbar";
import SideBarFilter from "./SideBarFilter";
import JobCard from "./JobCard";
import { useEffect } from "react";
import { contentService } from "../../services/contentService";
import { applicationService } from "../../services/applicationService";
import { savedSearchService } from "../../services/savedSearchService";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useI18n } from "../../i18n/I18nContext";

function MainJobSection() {
  const { t, tError, formatNumber } = useI18n();
  const { userData } = useSelector((store) => store.auth);
  const [searchParams] = useSearchParams();
  const companyFilter = searchParams.get('company');
  const [matches, setMatches] = useState({});
  const routerLocation = useLocation();
  // Bumped whenever a saved search is applied, so Searchbar remounts and picks up the new
  // initialSearch/initialLocationQuery (it only reads them once, at mount).
  const [searchbarKey, setSearchbarKey] = useState(0);
  const [initialSearch, setInitialSearch] = useState("");
  const [initialLocationQuery, setInitialLocationQuery] = useState("");

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

  // Re-running a saved search (from the Saved Searches page) arrives as router state rather than
  // a query param, since the filter object is richer than a URL can hold cleanly.
  useEffect(() => {
    const applied = routerLocation.state?.savedSearch;
    if (!applied) return;
    const f = applied.filters || {};
    setFilters({
      datePosted: f.datePosted || "",
      jobTypes: f.jobTypes || [],
      experience: f.experience || "",
      salaryRange: f.salaryRange || { from: "", to: "" },
      workMode: f.workMode || [],
      company: f.company || "",
    });
    setInitialSearch(f.search || "");
    setInitialLocationQuery(f.location || "");
    setSearchbarKey((key) => key + 1);
    // Clear the state so refreshing or navigating back doesn't silently reapply it.
    navigate(routerLocation.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerLocation.state]);

  const redirectToDetail = (id) => {
    navigate(`/jobs/${id}`);
  };

  const describeCurrentSearch = () => {
    const base = search || t("savedSearches.defaultAllJobs");
    return selectedLocation ? t("savedSearches.inLocation", { search: base, location: selectedLocation }) : base;
  };

  const handleSaveSearch = async () => {
    const name = window.prompt(t("savedSearches.namePrompt"), describeCurrentSearch());
    if (!name) return;
    try {
      await savedSearchService.create({ name, filters: { ...filters, search, location: selectedLocation } });
      alert(t("savedSearches.saved"));
    } catch (error) {
      alert(tError(error, "savedSearches.saveFailed"));
    }
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
            key={searchbarKey}
            setSearch={setSearch}
            search={search}
            setSelectedLocation={setSelectedLocation}
            initialSearch={initialSearch}
            initialLocationQuery={initialLocationQuery}
          />
        </div>
        <div>
          <div className="flex items-center justify-between my-3 ml-1.5 flex-wrap gap-2">
            <span className="text-text-secondary font-medium">{t("jobs.resultsCount", { count: formatNumber(jobs.length) })}</span>
            {userData?.role === "jobSeeker" && (
              <button
                type="button"
                onClick={handleSaveSearch}
                className="text-sm text-primary hover:underline flex items-center gap-1.5"
              >
                <i className="fa-regular fa-bookmark"></i>
                {t("savedSearches.save")}
              </button>
            )}
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
