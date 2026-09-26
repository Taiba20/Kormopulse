import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { interviewService } from "../services/interviewService";
import { useI18n } from "../i18n/I18nContext";

const STATUS_STYLE = {
  proposed: "bg-warning/10 text-warning",
  confirmed: "bg-success/10 text-success",
  declined: "bg-error/10 text-error",
  cancelled: "bg-neutral-200 text-text-secondary",
  completed: "bg-primary/10 text-primary",
};

function InterviewCard({ interview, role, onConfirm, onDecline, onCancel, onComplete }) {
  const { t, tOr, locale } = useI18n();
  const formatDate = (d) =>
    new Date(d).toLocaleString(locale, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const otherParty = role === "employer" ? interview.candidate : interview.employer;
  const [slotIndex, setSlotIndex] = useState(0);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="bg-background border border-neutral-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="font-semibold text-text-primary">{interview.job?.title}</p>
          <p className="text-sm text-text-secondary">
            {role === "employer" ? t("interviews.candidate", { name: otherParty?.name }) : t("interviews.employer", { name: otherParty?.name })}
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[interview.status]}`}>
          {tOr(`enums.interviewStatus.${interview.status}`, interview.status)}
        </span>
      </div>

      {interview.status === "proposed" && role === "jobSeeker" && (
        <div className="mt-3">
          <p className="text-sm font-medium text-text-primary mb-1.5">{t("interviews.chooseTime")}</p>
          <div className="flex flex-col gap-1.5 mb-3">
            {interview.slots.map((slot, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input type="radio" name={`slot-${interview._id}`} checked={slotIndex === i} onChange={() => setSlotIndex(i)} />
                {formatDate(slot)}
              </label>
            ))}
          </div>
          {!declining ? (
            <div className="flex gap-2">
              <button onClick={() => onConfirm(interview._id, slotIndex)} className="bg-primary text-white text-sm px-4 py-1.5 rounded-lg hover:bg-primary-dark">
                {t("interviews.confirm")}
              </button>
              <button onClick={() => setDeclining(true)} className="text-sm text-error hover:underline px-2">
                {t("interviews.noneWork")}
              </button>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("interviews.reasonPlaceholder")}
                className="flex-1 border border-neutral-300 rounded-md px-2 py-1.5 text-sm bg-background"
              />
              <button onClick={() => onDecline(interview._id, reason)} className="text-sm bg-error/10 text-error px-3 py-1.5 rounded-lg hover:bg-error/20">
                {t("interviews.decline")}
              </button>
              <button onClick={() => setDeclining(false)} className="text-sm text-text-secondary hover:underline">
                {t("interviews.cancel")}
              </button>
            </div>
          )}
        </div>
      )}

      {interview.status === "proposed" && role === "employer" && (
        <p className="text-sm text-text-secondary mt-2">{t("interviews.waiting")}</p>
      )}

      {interview.status === "confirmed" && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-sm text-text-primary font-medium">{formatDate(interview.selectedSlot)}</p>
          {interview.meetingLink && (
            <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
              <i className="fa-solid fa-video mr-1"></i>{t("interviews.joinLink")}
            </a>
          )}
          {interview.location && <span className="text-sm text-text-secondary">{interview.location}</span>}
          <a href={interviewService.icsUrl(interview._id)} className="text-sm text-text-secondary hover:underline">
            <i className="fa-solid fa-calendar-plus mr-1"></i>{t("interviews.addToCalendar")}
          </a>
          {role === "employer" && (
            <div className="ml-auto flex gap-2">
              <button onClick={() => onComplete(interview._id)} className="text-xs bg-success/10 text-success px-3 py-1 rounded-full hover:bg-success/20">
                {t("interviews.markCompleted")}
              </button>
              <button onClick={() => onCancel(interview._id)} className="text-xs bg-error/10 text-error px-3 py-1 rounded-full hover:bg-error/20">
                {t("interviews.cancel")}
              </button>
            </div>
          )}
        </div>
      )}

      {interview.declineReason && interview.status === "declined" && (
        <p className="text-sm text-text-secondary mt-2">{t("interviews.reason", { reason: interview.declineReason })}</p>
      )}
    </div>
  );
}

function Interviews() {
  const { t, tError } = useI18n();
  const { userData } = useSelector((store) => store.auth);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    try {
      const data = await interviewService.getMine();
      setInterviews(data.interviews || []);
    } catch (error) {
      console.error("Failed to load interviews", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (fn) => {
    try {
      await fn();
      load();
    } catch (error) {
      alert(tError(error, "interviews.actionFailed"));
    }
  };

  const visible = interviews.filter((i) => filter === "all" || i.status === filter);

  return (
    <div className="mt-16 min-h-screen bg-background-secondary py-8 px-5 md:px-10">
      <h1 className="text-2xl font-bold text-text-primary mb-1">{t("interviews.title")}</h1>
      <p className="text-text-secondary text-sm mb-5">
        {userData?.role === "employer" ? t("interviews.subtitleEmployer") : t("interviews.subtitleSeeker")}
      </p>

      <div className="flex gap-2 mb-5 flex-wrap">
        {["all", "proposed", "confirmed", "completed", "declined", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full capitalize ${filter === f ? "bg-primary text-white" : "bg-neutral-100 text-text-secondary hover:bg-neutral-200"}`}
          >
            {t(`interviews.filters.${f}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : visible.length === 0 ? (
        <p className="text-center text-text-secondary py-16">{t("interviews.empty")}</p>
      ) : (
        <div className="flex flex-col gap-3 max-w-3xl">
          {visible.map((interview) => (
            <InterviewCard
              key={interview._id}
              interview={interview}
              role={userData?.role}
              onConfirm={(id, idx) => act(() => interviewService.confirm(id, idx))}
              onDecline={(id, reason) => act(() => interviewService.decline(id, reason))}
              onCancel={(id) => act(() => interviewService.cancel(id))}
              onComplete={(id) => act(() => interviewService.complete(id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Interviews;
