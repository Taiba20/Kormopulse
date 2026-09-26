import React, { useState } from "react";
import { aiService } from "../../services/aiService";
import { useI18n } from "../../i18n/I18nContext";

const ACCEPTED = ".pdf,.docx,.txt";

/** Uploads a resume, previews the extracted profile, and lets the user merge it into their profile. */
function ResumeImportModal({ onClose, onApplied }) {
  const { t, tError, formatNumber } = useI18n();
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
      setError(tError(err, "profile.import.readFailed"));
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
      setError(tError(err, "profile.import.saveFailed"));
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-background rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h3 className="font-semibold text-text-primary">{t("profile.import.title")}</h3>
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
                <p className="text-sm text-text-primary font-medium">{file ? file.name : t("profile.import.upload")}</p>
                <p className="text-xs text-text-muted mt-1">{t("profile.import.formats")}</p>
              </label>
              {parsing && <p className="text-sm text-text-secondary text-center">{t("profile.import.reading")}</p>}
              {error && <p className="text-sm text-error">{error}</p>}
            </>
          )}

          {profile && (
            <>
              <p className="text-xs text-text-muted">
                {source === "ai" ? t("profile.import.extractedAi") : t("profile.import.extractedRules")} {t("profile.import.reviewEdit")}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary">{t("profile.import.role")}</label>
                  <input value={profile.primaryRole} onChange={(e) => updateField("primaryRole", e.target.value)} className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary">{t("profile.import.years")}</label>
                  <input value={profile.yearsOfExperience} onChange={(e) => updateField("yearsOfExperience", e.target.value)} className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary">{t("profile.import.location")}</label>
                  <input value={profile.location} onChange={(e) => updateField("location", e.target.value)} className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary">{t("profile.import.phone")}</label>
                  <input value={profile.contactNumber} onChange={(e) => updateField("contactNumber", e.target.value)} className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-sm bg-background" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary">{t("profile.import.bio")}</label>
                <textarea value={profile.bio} onChange={(e) => updateField("bio", e.target.value)} rows={3} className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-sm bg-background resize-none" />
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">
                  {t("profile.import.skillsRemove", { n: formatNumber(profile.skills.length) })}
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
                  {profile.skills.length === 0 && <p className="text-xs text-text-muted">{t("profile.import.noSkills")}</p>}
                </div>
              </div>

              {profile.workExperience?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-secondary mb-1">{t("profile.import.workFound")}</p>
                  <ul className="text-sm text-text-primary list-disc list-inside">
                    {profile.workExperience.map((w, i) => (
                      <li key={i}>
                        {w.jobTitle} {w.company?.name && t("profile.import.at", { company: w.company.name })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {profile.education?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-secondary mb-1">{t("profile.import.educationFound")}</p>
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
                {t("profile.import.overwrite")}
              </label>

              {error && <p className="text-sm text-error">{error}</p>}

              <div className="flex gap-3 justify-end">
                <button onClick={() => setProfile(null)} className="px-4 py-2 text-sm border border-neutral-300 rounded-lg text-text-secondary hover:bg-neutral-50">
                  {t("profile.import.another")}
                </button>
                <button onClick={apply} disabled={applying} className="px-5 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50">
                  {applying ? t("profile.saving") : t("profile.import.save")}
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
