import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { applicationService } from "../services/applicationService";
import ProposeInterviewModal from "../components/CompanyDashboard/ProposeInterviewModal";
import MatchBadge from "../components/Common/MatchBadge";

const COLUMNS = [
  { key: "pending", label: "Applied", color: "border-neutral-400" },
  { key: "reviewed", label: "Reviewed", color: "border-blue-500" },
  { key: "shortlisted", label: "Shortlisted", color: "border-secondary" },
  { key: "interview", label: "Interview", color: "border-warning" },
  { key: "hired", label: "Hired", color: "border-success" },
  { key: "rejected", label: "Rejected", color: "border-error" },
];

const AVATAR_FALLBACK = "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";

function ApplicantCard({ item, onDragStart, onOpenInterview, onMessage }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      className="bg-background border border-neutral-200 rounded-lg p-3 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-2.5 mb-2">
        <img src={item.applicant.profilePicture || AVATAR_FALLBACK} alt="" className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{item.applicant.name}</p>
          <p className="text-xs text-text-secondary truncate">{item.applicant.primaryRole || item.applicant.email}</p>
        </div>
      </div>
      <MatchBadge match={item.match} className="mb-2" />
      {item.match?.matchedSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {item.match.matchedSkills.slice(0, 3).map((s) => (
            <span key={s} className="text-[10px] bg-neutral-100 text-text-secondary px-1.5 py-0.5 rounded">
              {s}
            </span>
          ))}
        </div>
      )}
      <p className="text-[11px] text-text-muted mb-2">Applied {new Date(item.appliedAt).toLocaleDateString()}</p>
      <div className="flex gap-1.5 flex-wrap">
        {item.applicant.resume && (
          <a href={item.applicant.resume} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline">
            <i className="fa-solid fa-file-lines mr-1"></i>Resume
          </a>
        )}
        <button onClick={() => onMessage(item.applicant._id)} className="text-[11px] text-primary hover:underline ml-auto">
          <i className="fa-solid fa-message mr-1"></i>Message
        </button>
        {["reviewed", "shortlisted"].includes(item.status) && (
          <button onClick={() => onOpenInterview(item)} className="text-[11px] text-secondary hover:underline">
            <i className="fa-solid fa-calendar mr-1"></i>Interview
          </button>
        )}
      </div>
    </div>
  );
}

function Pipeline() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [interviewTarget, setInterviewTarget] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await applicationService.getPipeline(jobId);
      setJob(data.job);
      setColumns(data.columns);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  const moveCard = async (item, toStatus) => {
    if (item.status === toStatus) return;
    const fromStatus = item.status;
    // optimistic update
    setColumns((prev) => ({
      ...prev,
      [fromStatus]: prev[fromStatus].filter((c) => c._id !== item._id),
      [toStatus]: [{ ...item, status: toStatus }, ...(prev[toStatus] || [])],
    }));
    try {
      await applicationService.updateStatus(item._id, toStatus);
    } catch (err) {
      alert(err.response?.data?.message || "Could not update status. Reverting.");
      load();
    }
  };

  const onDragStart = (e, item) => {
    e.dataTransfer.setData("text/plain", JSON.stringify(item));
  };

  const onDrop = (e, columnKey) => {
    e.preventDefault();
    setDragOverColumn(null);
    try {
      const item = JSON.parse(e.dataTransfer.getData("text/plain"));
      moveCard(item, columnKey);
    } catch {
      // ignore malformed drag payloads
    }
  };

  if (loading) {
    return (
      <div className="mt-16 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-16 min-h-screen flex items-center justify-center text-error">{error}</div>
    );
  }

  return (
    <div className="mt-16 min-h-screen bg-background-secondary pb-10">
      <div className="px-5 md:px-10 py-6">
        <button onClick={() => navigate(-1)} className="text-sm text-text-secondary hover:text-primary mb-2">
          <i className="fa-solid fa-arrow-left mr-1.5"></i>Back
        </button>
        <h1 className="text-2xl font-bold text-text-primary">{job?.title}</h1>
        <p className="text-text-secondary text-sm">{job?.location} &middot; Drag cards between columns to update a candidate's status.</p>
      </div>

      <div className="px-5 md:px-10 flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumn(col.key);
            }}
            onDragLeave={() => setDragOverColumn((c) => (c === col.key ? null : c))}
            onDrop={(e) => onDrop(e, col.key)}
            className={`flex-shrink-0 w-72 rounded-lg border-t-4 ${col.color} bg-neutral-50 ${
              dragOverColumn === col.key ? "ring-2 ring-primary" : ""
            }`}
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-200">
              <span className="font-semibold text-text-primary text-sm">{col.label}</span>
              <span className="text-xs bg-neutral-200 text-text-secondary rounded-full px-2 py-0.5">
                {columns[col.key]?.length || 0}
              </span>
            </div>
            <div className="p-2 min-h-[120px] max-h-[70vh] overflow-y-auto">
              {(columns[col.key] || []).map((item) => (
                <ApplicantCard
                  key={item._id}
                  item={item}
                  onDragStart={onDragStart}
                  onOpenInterview={setInterviewTarget}
                  onMessage={(id) => navigate(`/messages?chat=${id}`)}
                />
              ))}
              {(columns[col.key] || []).length === 0 && (
                <p className="text-xs text-text-muted text-center py-6">No candidates here</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {interviewTarget && (
        <ProposeInterviewModal
          applicationId={interviewTarget._id}
          candidateName={interviewTarget.applicant.name}
          jobTitle={job?.title}
          onClose={() => setInterviewTarget(null)}
          onScheduled={() => {
            setInterviewTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}

export default Pipeline;
