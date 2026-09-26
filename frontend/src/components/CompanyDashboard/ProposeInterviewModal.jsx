import React, { useState } from "react";
import { interviewService } from "../../services/interviewService";
import { useI18n } from "../../i18n/I18nContext";

const emptySlot = () => "";

/** Employer-side modal: offer up to 5 interview time slots for an application. */
function ProposeInterviewModal({ applicationId, candidateName, jobTitle, onClose, onScheduled }) {
  const { t, tError, formatNumber } = useI18n();
  const [slots, setSlots] = useState([emptySlot(), emptySlot()]);
  const [mode, setMode] = useState("online");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateSlot = (i, value) => setSlots((prev) => prev.map((s, idx) => (idx === i ? value : s)));
  const addSlot = () => slots.length < 5 && setSlots((prev) => [...prev, emptySlot()]);
  const removeSlot = (i) => setSlots((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const validSlots = slots.filter(Boolean);
    if (validSlots.length === 0) {
      setError(t("propose.needSlot"));
      return;
    }
    setSubmitting(true);
    try {
      await interviewService.propose({
        applicationId,
        slots: validSlots.map((s) => new Date(s).toISOString()),
        durationMinutes: Number(duration),
        mode,
        meetingLink: mode === "online" ? meetingLink : undefined,
        location: mode !== "online" ? location : undefined,
        notes,
      });
      onScheduled();
    } catch (err) {
      setError(tError(err, "propose.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h3 className="font-semibold text-text-primary">{t("propose.title", { name: candidateName })}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl leading-none">
            &times;
          </button>
        </div>

        <form onSubmit={submit} className="p-5 flex flex-col gap-3">
          <p className="text-xs text-text-secondary -mt-1">{t("propose.intro", { job: jobTitle })}</p>

          {slots.map((slot, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={slot}
                onChange={(e) => updateSlot(i, e.target.value)}
                className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background text-text-primary"
              />
              {slots.length > 1 && (
                <button type="button" onClick={() => removeSlot(i)} className="text-text-muted hover:text-error px-1">
                  &times;
                </button>
              )}
            </div>
          ))}
          {slots.length < 5 && (
            <button type="button" onClick={addSlot} className="text-xs text-primary hover:underline self-start">
              {t("propose.addTime")}
            </button>
          )}

          <div className="flex gap-2">
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="flex-1 border border-neutral-300 rounded-lg px-2 py-2 text-sm bg-background">
              <option value="online">{t("propose.online")}</option>
              <option value="onsite">{t("propose.onsite")}</option>
              <option value="phone">{t("propose.phone")}</option>
            </select>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className="border border-neutral-300 rounded-lg px-2 py-2 text-sm bg-background">
              {[15, 30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {t("propose.minutes", { n: formatNumber(m) })}
                </option>
              ))}
            </select>
          </div>

          {mode === "online" && (
            <input
              type="url"
              required
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder={t("propose.meetingLink")}
              className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background text-text-primary"
            />
          )}
          {mode === "onsite" && (
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("propose.officeAddress")}
              className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background text-text-primary"
            />
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t("propose.notes")}
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm resize-none bg-background text-text-primary"
          />

          {error && <p className="text-sm text-error">{error}</p>}

          <div className="flex gap-3 justify-end mt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-neutral-300 rounded-lg text-text-secondary hover:bg-neutral-50">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50">
              {submitting ? t("propose.sending") : t("propose.send")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProposeInterviewModal;
