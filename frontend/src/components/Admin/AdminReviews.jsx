import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { reviewService } from "../../services/reviewService";
import { useI18n } from "../../i18n/I18nContext";

function AdminReviews() {
  const { t, tError, formatDate, formatNumber } = useI18n();
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.listReviews({ page, limit: 15 });
      setReviews(data.reviews || []);
      setPagination(data.pagination || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const remove = async (review) => {
    if (!window.confirm(t("admin.reviews.confirmDelete", { company: review.company?.companyName }))) return;
    try {
      await reviewService.deleteReview(review._id);
      load();
    } catch (err) {
      alert(tError(err, "admin.actionFailed"));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-4">{t("admin.reviews.title")}</h1>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary self-center mt-10" />
        ) : reviews.length === 0 ? (
          <p className="text-text-secondary text-center py-10">{t("admin.reviews.none")}</p>
        ) : (
          reviews.map((r) => (
            <div key={r._id} className="bg-background border border-neutral-200 rounded-xl p-4 flex justify-between items-start gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-text-primary">{r.company?.companyName}</span>
                  <span className="text-xs text-warning">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                </div>
                <p className="text-sm text-text-primary">{r.title}</p>
                <p className="text-xs text-text-muted mt-1">
                  {t("admin.reviews.by", { name: r.isAnonymous ? t("admin.reviews.anonymous") : r.user?.name, email: r.user?.email })} &middot; {formatDate(r.createdAt)}
                </p>
              </div>
              <button onClick={() => remove(r)} className="text-xs text-error hover:underline flex-shrink-0">
                {t("admin.reviews.delete")}
              </button>
            </div>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border border-neutral-300 rounded disabled:opacity-50">
            {t("admin.previous")}
          </button>
          <span className="text-text-secondary">{t("admin.pageOf", { page: formatNumber(pagination.page), total: formatNumber(pagination.totalPages) })}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border border-neutral-300 rounded disabled:opacity-50">
            {t("admin.next")}
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminReviews;
