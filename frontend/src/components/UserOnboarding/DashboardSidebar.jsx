import {
  HomeIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  ChatBubbleBottomCenterIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

import { NavLink, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { userService } from "../../services/userService";
import { logout } from "../../store/authSlice";
import useUpdateUserData from "../../hooks/useUpdateUserData";
import { useEffect } from "react";

const sidebarLinks = [
  {
    name: "Dashboard",
    href: "/dashboard/home",
    icon: HomeIcon,
  },
  {
    name: "Applications",
    href: "/dashboard/applications",
    icon: UserPlusIcon,
  },
  {
    name: "Shortlisted",
    href: "/dashboard/shortlisted",
    icon: ShieldCheckIcon,
  },
  {
    name: "Messages",
    href: "/dashboard/messages",
    icon: ChatBubbleBottomCenterIcon,
  },
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: UserCircleIcon,
  },
];

function DashboardSidebar() {
  const updateUser = useUpdateUserData();
  const { userData } = useSelector((store) => store.auth);

  useEffect(() => {
    updateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = () => {
    userService
      .logout()
      .then(() => {
        dispatch(logout());
        navigate("/");
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <div className="sticky top-0 flex h-screen w-full flex-col justify-between border-r border-gray-200 bg-white px-1 py-5 xl:py-8 xl:px-2">
      <div className="ie-menu mt-2 h-full">
        <div className="flex flex-col items-center gap-3 p-1 xl:items-stretch xl:px-3">
          {sidebarLinks.map((item) => {
            return (
              <NavLink to={item.href} key={item.name} className="group">
                {({ isActive }) => {
                  return (
                    <span
                      className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all ${
                        isActive ? "bg-[var(--color-neutral-100)]" : "group-hover:bg-[var(--color-neutral-50)]"
                      }`}
                    >
                      <item.icon
                        className={`h-5 stroke-2 ${
                          isActive
                            ? "stroke-[var(--color-primary)]"
                            : "stroke-[var(--color-text-secondary)] group-hover:stroke-[var(--color-primary)]"
                        }`}
                      />
                      <span
                        className={`hidden text-base font-semibold xl:block ${
                          isActive
                            ? "text-[var(--color-text-primary)]"
                            : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]"
                        }`}
                      >
                        {item.name}
                      </span>
                    </span>
                  );
                }}
              </NavLink>
            );
          })}
        </div>
      </div>
      <div className="ie-user hidden items-center gap-3 px-3 xl:flex">
        <div className="h-10 w-10 rounded-full p-px overflow-hidden border">
          {userData?.userProfile?.companyLogo ? (
            <img
              src={userData.userProfile.companyLogo}
              alt={`${userData?.userProfile?.companyName} Logo`}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-full">
              <i className="fas fa-building text-gray-400"></i>
            </div>
          )}
        </div>
        <div className="ie-userDetails">
          <div className="flex justify-between gap-2">
            <span className="text-base font-semibold text-[var(--color-text-secondary)]">
              {userData?.userProfile?.companyName || userData?.name}
            </span>
            <div className="group flex cursor-pointer items-center gap-1 rounded-full bg-[var(--color-neutral-100)] px-2 py-1 transition-all hover:bg-[var(--color-neutral-50)]">
              <span
                className="text-xs font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-error)]"
                onClick={handleLogout}
              >
                Logout
              </span>
            </div>
          </div>
          <span className="mt-1 block text-sm font-medium text-[var(--color-text-secondary)]">
            Logged in as {userData?.username}
          </span>
        </div>
      </div>
      <div className="ie-userMobile p-1 xl:hidden"></div>
    </div>
  );
}

export default DashboardSidebar;
