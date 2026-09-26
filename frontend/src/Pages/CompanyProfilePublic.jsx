import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { reviewService } from "../services/reviewService";
import JobCard from "../components/JobListing/JobCard";
import { useI18n } from "../i18n/I18nContext";

const STAR_RATING = [1, 2, 3, 4, 5];

function StarRating({ value, onChange, readOnly }) {
  return (
    <div className="flex gap-1">
      {STAR_RATING.map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={`text-xl ${n <= value ? "text-warning" : "text-neutral-300"} ${readOnly ? "" : "cursor-pointer"}`}
        >
          <i className="fas fa-star"></i>
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ companyId, existing, onSaved }) {
  const { t, tError } = useI18n();
  const [rating, setRating] = useState(existing?.rating || 0);
  const [title, setTitle] = useState(existing?.title || "");
  const [pros, setPros] = useState(existing?.pros || "");
  const [cons, setCons] = useState(existing?.cons || "");
  const [isAnonymous, setIsAnonymous] = useState(existing?.isAnonymous ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError(t("companyPublic.chooseRating"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { rating, title, pros, cons, isAnonymous };
      if (existing) await reviewService.updateReview(existing._id, payload);
      else await reviewService.createReview(companyId, payload);
      onSaved();
    } catch (err) {
      setError(tError(err, "companyPublic.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-background border border-neutral-200 rounded-xl p-4 flex flex-col gap-2.5">
      <StarRating value={rating} onChange={setRating} />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        minLength={3}
        placeholder={t("companyPublic.headline")}
        className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background"
      />
      <textarea value={pros} onChange={(e) => setPros(e.target.value)} rows={2} placeholder={t("companyPublic.pros")} className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background resize-none" />
      <textarea value={cons} onChange={(e) => setCons(e.target.value)} rows={2} placeholder={t("companyPublic.cons")} className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background resize-none" />
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
        {t("companyPublic.postAnonymously")}
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      <button type="submit" disabled={saving} className="self-start bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
        {saving ? t("companyPublic.saving") : existing ? t("companyPublic.update") : t("companyPublic.post")}
      </button>
    </form>
  );
}

function CompanyProfilePublic() {
  const { t, formatDate, formatNumber } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useSelector((store) => store.auth);
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [profileRes, reviewsRes] = await Promise.all([
        reviewService.getPublicCompany(id),
        reviewService.getCompanyReviews(id),
      ]);
      setCompany(profileRes.company);
      setJobs(profileRes.jobs || []);
      setSummary(reviewsRes.summary);
      setReviews(reviewsRes.reviews || []);
      setMyReview(reviewsRes.myReview);
    } catch (error) {
      console.error("Failed to load company profile", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="mt-16 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!company) {
    return <div className="mt-16 min-h-screen flex items-center justify-center text-text-secondary">{t("companyPublic.notFound")}</div>;
  }

  return (
    <div className="mt-16 min-h-screen bg-background-secondary py-8 px-5 md:px-10">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="bg-background border border-neutral-200 rounded-xl p-5 flex gap-4 items-start">
          <img src={company.companyLogo} alt="" className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{company.companyName}</h1>
            <p className="text-text-secondary text-sm">{company.industry}</p>
            {summary?.count > 0 && (
              <div className="flex items-center gap-2 mt-1.5">
                <StarRating value={Math.round(summary.average)} readOnly />
                <span className="text-sm text-text-secondary">
                  {t("companyPublic.reviewsSummary", { count: summary.count, average: formatNumber(summary.average), percent: formatNumber(summary.recommendPercent) })}
                </span>
              </div>
            )}
            {company.companyDescription && <p className="text-sm text-text-secondary mt-2">{company.companyDescription}</p>}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-text-primary mb-3">{t("companyPublic.openPositions", { count: jobs.length })}</h2>
          {jobs.length === 0 ? (
            <p className="text-text-secondary text-sm">{t("companyPublic.noPositions")}</p>
          ) : (
            jobs.map((job) => (
              <JobCard key={job._id} job={{ ...job, company }} redirectToDetail={(jid) => navigate(`/jobs/${jid}`)} />
            ))
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-text-primary">{t("companyPublic.reviews")}</h2>
            {userData?.role === "jobSeeker" && !showForm && (
              <button onClick={() => setShowForm(true)} className="text-sm text-primary hover:underline">
                {myReview ? t("companyPublic.editReview") : t("companyPublic.writeReview")}
              </button>
            )}
          </div>

          {showForm && (
            <div className="mb-4">
              <ReviewForm
                companyId={id}
                existing={myReview}
                onSaved={() => {
                  setShowForm(false);
                  load();
                }}
              />
            </div>
          )}

          <div className="flex flex-col gap-3">
            {reviews.length === 0 ? (
              <p className="text-text-secondary text-sm">{t("companyPublic.noReviews")}</p>
            ) : (
              reviews.map((r) => (
                <div key={r._id} className="bg-background border border-neutral-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <StarRating value={r.rating} readOnly />
                    <span className="text-xs text-text-muted">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="font-medium text-text-primary">{r.title}</p>
                  {r.pros && <p className="text-sm text-success mt-1">👍 {r.pros}</p>}
                  {r.cons && <p className="text-sm text-error mt-1">👎 {r.cons}</p>}
                  <p className="text-xs text-text-muted mt-2">— {r.author === "Anonymous" ? t("companyPublic.anonymous") : r.author === "Former user" ? t("companyPublic.formerUser") : r.author}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyProfilePublic;
