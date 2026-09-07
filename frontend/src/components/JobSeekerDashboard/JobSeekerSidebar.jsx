import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { logout } from '../../store/authSlice';

function JobSeekerSidebar() {
  const { userData } = useSelector((store) => store.auth);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/my-dashboard',
      icon: 'fas fa-home',
      current: location.pathname === '/my-dashboard' || location.pathname === '/my-dashboard/'
    },
    {
      name: 'Applications',
      href: '/my-dashboard/applications',
      icon: 'fas fa-paper-plane',
      current: location.pathname === '/my-dashboard/applications'
    },
    {
      name: 'Saved Jobs',
      href: '/my-dashboard/saved-jobs',
      icon: 'fas fa-bookmark',
      current: location.pathname === '/my-dashboard/saved-jobs'
    },
    {
      name: 'Browse Jobs',
      href: '/jobs',
      icon: 'fas fa-search',
      current: location.pathname === '/jobs'
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: 'fas fa-envelope',
      current: location.pathname === '/messages'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: 'fas fa-user',
      current: location.pathname === '/profile'
    }
  ];

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
    <div className="sticky top-0 flex h-screen w-full max-w-[280px] flex-col justify-between border-r border-neutral-200 bg-white px-1 py-5 xl:py-8 xl:px-2">
      <div className="ie-menu mt-2 h-full">
        <div className="flex flex-col items-center gap-3 p-1 xl:items-stretch xl:px-3">
          {navigation.map((item) => {
            return (
              <Link to={item.href} key={item.name} className="group">
                <span
                  className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all ${
                    item.current ? "bg-[var(--color-neutral-100)]" : "group-hover:bg-[var(--color-neutral-50)]"
                  }`}
                >
                  <i
                    className={`${item.icon} text-sm ${
                      item.current
                        ? "text-[var(--color-primary)]"
                        : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)]"
                    }`}
                  />
                  <span
                    className={`hidden text-base font-semibold xl:block ${
                      item.current
                        ? "text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    {item.name}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="ie-user hidden items-center gap-3 px-3 xl:flex">
        <div className="h-10 w-10 rounded-full p-px overflow-hidden border">
          {userData?.userProfile?.profilePicture ? (
            <img
              src={userData.userProfile.profilePicture}
              alt={`${userData.name} Profile`}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full bg-neutral-200 flex items-center justify-center rounded-full">
              <i className="fas fa-user text-neutral-400"></i>
            </div>
          )}
        </div>
        <div className="ie-userDetails flex-1">
          <div className="flex justify-between gap-2">
            <span className="text-base font-semibold text-[var(--color-text-secondary)] truncate">
              {userData?.name || 'Job Seeker'}
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
          <span className="mt-1 block text-sm font-medium text-[var(--color-text-secondary)] truncate">
            Logged in as {userData?.username}
          </span>
        </div>
      </div>
      <div className="ie-userMobile p-1 xl:hidden"></div>
    </div>
  );
}

export default JobSeekerSidebar;