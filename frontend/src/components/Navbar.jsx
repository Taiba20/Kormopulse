import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { userService } from '../services/userService';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { userData } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogoClick = () => {
    if (userData) {
      if (userData.role === 'jobSeeker') {
        navigate('/my-dashboard');
      } else if (userData.role === 'employer') {
        navigate('/dashboard/home');
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    userService
      .logout()
      .then(() => {
        dispatch(logout());
        navigate('/', { replace: true });
      })
      .catch((error) => {
        console.log(error);
        // Even if logout API fails, clear local state
        dispatch(logout());
        navigate('/', { replace: true });
      });
  };

  return (
    <nav className="bg-gradient-to-r from-primary to-primary-light shadow-xl border-b border-primary-dark fixed top-0 left-0 right-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Left Side */}
          <div className="flex-shrink-0">
            <button 
              onClick={handleLogoClick}
              className="flex items-center font-poppins bg-text-inverse/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-primary-light/30 transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-lg font-bold text-white">K</span>
              <span className="ml-2 text-base font-bold tracking-tight text-primary">Kormopulse</span>
            </button>
          </div>
          
          {/* Navigation - Right Side */}
          <div className="flex items-center">
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                
                {userData && (
                  <>
                  <button
                    onClick={handleLogoClick}
                    className="text-text-inverse hover:text-text-inverse hover:bg-white/20 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105"
                  >
                    Home
                  </button>
                    <a
                      href="/jobs"
                      className="text-text-inverse hover:text-text-inverse hover:bg-white/20 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105"
                    >
                      Find Jobs
                    </a>
                    <a
                      href="/companies"
                      className="text-text-inverse hover:text-text-inverse hover:bg-white/20 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105"
                    >
                      Companies
                    </a>
                  </>
                )}
                {userData ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className="flex items-center text-text-inverse hover:bg-white/20 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden mr-2 border-2 border-white/30">
                        {userData.userProfile?.profilePicture || userData.userProfile?.companyLogo ? (
                          <img
                            src={userData.userProfile?.profilePicture || userData.userProfile?.companyLogo}
                            alt={userData.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/20 flex items-center justify-center">
                            {userData.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      {userData.name}
                      <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showProfileDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                        <Link
                          to={userData.role === 'employer' ? '/dashboard/home' : '/my-dashboard'}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          Profile
                        </Link>
                        <button
                          onClick={() => {handleLogout(); setShowProfileDropdown(false);}}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-text-inverse hover:text-text-inverse hover:bg-white/20 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="bg-text-inverse text-primary hover:bg-neutral-100 hover:text-primary-dark px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 shadow-md"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="ml-4 md:hidden">
              <button
                onClick={toggleMenu}
                className="bg-primary inline-flex items-center justify-center p-2 rounded-md text-text-inverse hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-text-inverse transition duration-300"
              >
                <svg
                  className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-primary-dark">
          <button
            onClick={handleLogoClick}
            className="text-text-inverse hover:text-text-inverse hover:bg-white/20 block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 hover:scale-105 w-full text-left"
          >
            Home
          </button>
          {userData && (
            <>
              <a
                href="#"
                className="text-text-inverse hover:text-text-inverse hover:bg-white/20 block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 hover:scale-105"
              >
                Find Jobs
              </a>
              <a
                href="#"
                className="text-text-inverse hover:text-text-inverse hover:bg-white/20 block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 hover:scale-105"
              >
                Companies
              </a>
            </>
          )}
          {userData ? (
            <>
              <Link
                to={userData.role === 'employer' ? '/dashboard/home' : '/my-dashboard'}
                className="text-text-inverse hover:text-text-inverse hover:bg-white/20 block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 hover:scale-105"
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                className="text-text-inverse hover:text-text-inverse hover:bg-white/20 block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 hover:scale-105"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-text-inverse hover:text-text-inverse hover:bg-white/20 block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 hover:scale-105 w-full text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-text-inverse hover:text-text-inverse hover:bg-white/20 block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 hover:scale-105"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-text-inverse text-primary hover:bg-neutral-100 hover:text-primary-dark block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 hover:scale-105 shadow-md"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
