import React, { useState } from "react";
import { aiService } from "../../services/aiService";

const ACCEPTED = ".pdf,.docx,.txt";

/** Uploads a resume, previews the extracted profile, and lets the user merge it into their profile. */
function ResumeImportModal({ onClose, onApplied }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [source, setSource] = useState(null);
  const [overwrite, setOverwrite] = useState(false);
  const [applying, setApplying] = useState(false);

  const handleFile = async (selected) => {
    if (!selected) return;
    setFile(selected);
    setError("");
    setParsing(true);
    setProfile(null);
    try {
      const result = await aiService.parseResume(selected);
      setProfile(result.profile);
      setSource(result.source);
    } catch (err) {
      setError(err.response?.data?.message || "Could not read this resume. Try a different PDF or DOCX file.");
    } finally {
      setParsing(false);
    }
  };

  const updateField = (key, value) => setProfile((prev) => ({ ...prev, [key]: value }));

  const toggleSkill = (skill) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
    }));
  };

  const apply = async () => {
    setApplying(true);
    setError("");
    try {
      await aiService.applyResume(profile, overwrite);
      onApplied();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update your profile.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-background rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h3 className="font-semibold text-text-primary">Import profile from resume</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {!profile && (
            <>
              <label className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                <input type="file" accept={ACCEPTED} className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                <i className="fa-solid fa-file-arrow-up text-3xl text-text-muted mb-2"></i>
                <p className="text-sm text-text-primary font-medium">{file ? file.name : "Click to upload your resume"}</p>
                <p className="text-xs text-text-muted mt-1">PDF, DOCX or TXT, up to 5MB</p>
              </label>
              {parsing && <p className="text-sm text-text-secondary text-center">Reading your resume...</p>}
              {error && <p className="text-sm text-error">{error}</p>}
            </>
          )}

          {profile && (
            <>
              <p className="text-xs text-text-muted">
                {source === "ai" ? "Extracted with AI." : "Extracted with rule-based parsing (AI not configured)."} Review and edit before saving.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary">Primary role</label>
                  <input value={profile.primaryRole} onChange={(e) => updateField("primaryRole", e.target.value)} className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary">Years of experience</label>
                  <input value={profile.yearsOfExperience} onChange={(e) => updateField("yearsOfExperience", e.target.value)} className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary">Location</label>
                  <input value={profile.location} onChange={(e) => updateField("location", e.target.value)} className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary">Phone</label>
                  <input value={profile.contactNumber} onChange={(e) => updateField("contactNumber", e.target.value)} className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-sm bg-background" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary">Bio</label>
                <textarea value={profile.bio} onChange={(e) => updateField("bio", e.target.value)} rows={3} className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-sm bg-background resize-none" />
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">
                  Skills ({profile.skills.length}) — click to remove
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full hover:bg-error/10 hover:text-error"
                    >
                      {skill} &times;
                    </button>
                  ))}
                  {profile.skills.length === 0 && <p className="text-xs text-text-muted">No skills detected.</p>}
                </div>
              </div>

              {profile.workExperience?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-secondary mb-1">Work experience found</p>
                  <ul className="text-sm text-text-primary list-disc list-inside">
                    {profile.workExperience.map((w, i) => (
                      <li key={i}>
                        {w.jobTitle} {w.company?.name && `at ${w.company.name}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {profile.education?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-secondary mb-1">Education found</p>
                  <ul className="text-sm text-text-primary list-disc list-inside">
                    {profile.education.map((e, i) => (
                      <li key={i}>
                        {e.degree} {e.institution && `— ${e.institution}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
                Overwrite existing profile fields (otherwise only fills in what's empty)
              </label>

              {error && <p className="text-sm text-error">{error}</p>}

              <div className="flex gap-3 justify-end">
                <button onClick={() => setProfile(null)} className="px-4 py-2 text-sm border border-neutral-300 rounded-lg text-text-secondary hover:bg-neutral-50">
                  Choose a different file
                </button>
                <button onClick={apply} disabled={applying} className="px-5 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50">
                  {applying ? "Saving..." : "Save to profile"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResumeImportModal;
