import React from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import AdminOverview from "../components/Admin/AdminOverview";
import AdminUsers from "../components/Admin/AdminUsers";
import AdminJobs from "../components/Admin/AdminJobs";
import AdminReviews from "../components/Admin/AdminReviews";
import { useI18n } from "../i18n/I18nContext";

const links = [
  { to: "/admin/overview", key: "overview", icon: "fa-chart-pie" },
  { to: "/admin/users", key: "users", icon: "fa-users" },
  { to: "/admin/jobs", key: "jobs", icon: "fa-briefcase" },
  { to: "/admin/reviews", key: "reviews", icon: "fa-star" },
];

function AdminDashboard() {
  const { t } = useI18n();
  const { userData } = useSelector((store) => store.auth);

  if (userData && userData.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mt-16 min-h-screen flex">
      <aside className="w-56 flex-shrink-0 border-r border-neutral-200 bg-background py-6 hidden md:block">
        <p className="px-5 text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">{t("admin.label")}</p>
        <nav className="flex flex-col gap-1 px-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? "bg-primary/10 text-primary" : "text-text-secondary hover:bg-neutral-100"
                }`
              }
            >
              <i className={`fa-solid ${l.icon} w-4`}></i>
              {t(`admin.nav.${l.key}`)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0 bg-background-secondary">
        <Routes>
          <Route path="overview" element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="jobs" element={<AdminJobs />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="" element={<Navigate to="overview" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default AdminDashboard;
