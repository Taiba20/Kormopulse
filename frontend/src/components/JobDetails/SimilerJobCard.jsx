import React from "react";
import { useNavigate } from "react-router-dom";

function SimilerJobCard({ jobData }) {
  const navigate = useNavigate();

  if (!jobData) {
    return null;
  }

  const {
    _id,
    title,
    company = {},
    location,
    createdAt
  } = jobData;

  // Calculate time ago
  const datePosted = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now - datePosted);
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let timeAgo = "Just now";
  if (diffHours < 24) {
    timeAgo = diffHours > 0 ? `${diffHours} hours ago` : "Just now";
  } else {
    timeAgo = `${diffDays} days ago`;
  }

  const companyName = company?.companyName || "Company Name Not Available";
  const companyLogo = company?.companyLogo || "https://via.placeholder.com/56x56?text=C";

  const handleJobClick = () => {
    navigate(`/job-details/${_id}`);
  };

  return (
    <div 
      className="border-b border-neutral-200 pb-3 hover:bg-background-secondary transition-colors duration-200 rounded-lg p-2 cursor-pointer"
      onClick={handleJobClick}
    >
      <div className="flex justify-between">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <p className="font-medium text-text-primary hover:text-primary transition-colors duration-200 line-clamp-2">
              {title}
            </p>
            <p className="text-[.78rem] font-medium text-text-secondary line-clamp-1">
              {companyName}
            </p>
          </div>
          <div>
            <div>
              <div className="flex gap-3 text-sm text-text-secondary">
                <span className="text-primary">
                  <i className="fa-solid fa-location-dot"></i>
                </span>
                <span className="line-clamp-1">{location || "Location not specified"}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-5 items-end">
          <div className="h-14 w-14 rounded-3xl border border-neutral-200 overflow-hidden flex justify-center items-center bg-background-secondary">
            <img 
              src={companyLogo} 
              alt={`${companyName} logo`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/56x56?text=C";
              }}
            />
          </div>
          <div>
            <span className="text-xs font-light text-text-muted">Posted {timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimilerJobCard;
