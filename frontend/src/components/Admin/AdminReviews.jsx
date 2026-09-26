import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { reviewService } from "../../services/reviewService";

function AdminReviews() {
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
    if (!window.confirm(`Delete this review of ${review.company?.companyName}?`)) return;
    try {
      await reviewService.deleteReview(review._id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-4">Reviews</h1>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary self-center mt-10" />
        ) : reviews.length === 0 ? (
          <p className="text-text-secondary text-center py-10">No reviews yet.</p>
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
                  By {r.isAnonymous ? "Anonymous" : r.user?.name} ({r.user?.email}) &middot; {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => remove(r)} className="text-xs text-error hover:underline flex-shrink-0">
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border border-neutral-300 rounded disabled:opacity-50">
            Previous
          </button>
          <span className="text-text-secondary">Page {pagination.page} of {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border border-neutral-300 rounded disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminReviews;
