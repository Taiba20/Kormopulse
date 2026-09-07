import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../store/authSlice';
import { loginUser } from '../../services/userService';
import { useNavigate } from "react-router-dom";
import useUpdateUserData from "../../hooks/useUpdateUserData";
import { IoEye, IoEyeOff } from 'react-icons/io5';

function Login() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const updateUser = useUpdateUserData();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const resetErrorMessage = () => {
    setTimeout(() => {
      setErrorMessage("");
    }, 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFormSubmission = (e) => {
    e.preventDefault();
    makeLoginRequest(formData);
  };

  const makeLoginRequest = async (userData) => {
    dispatch(loginStart());
    setLoading(true);
    try {
      const response = await loginUser(userData);
      const loggedInUser = response.data.data.user;
      dispatch(loginSuccess(loggedInUser));
      //alert('Login successful!');
      
      // Update user data in Redux store
      await updateUser();
      
      // Navigate based on user role and onboarding status
      if (loggedInUser.role === "jobSeeker") {
        // Check if user has a jobSeekerProfile and if onboarding is done
        const hasProfile = loggedInUser.jobSeekerProfile || loggedInUser.userProfile?.doneOnboarding;
        if (hasProfile) {
          navigate("/my-dashboard", { state: { fromLogin: true } });
        } else {
          navigate("/user-onboarding");
        }
      } else if (loggedInUser.role === "employer") {
        // Check if user has a companyProfile and if onboarding is done
        const hasProfile = loggedInUser.companyProfile || loggedInUser.userProfile?.doneOnboarding;
        if (hasProfile) {
          console.log("Sending to dashboard");
          navigate("/dashboard/home", { state: { fromLogin: true } });
        } else {
          console.log(loggedInUser);
          navigate("/company-onboarding");
        }
      }
    } catch (error) {
      dispatch(loginFailure());
      setErrorMessage(error.response?.data?.message || 'Login failed.');
      resetErrorMessage();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="hidden font-semibold text-xl cursor-pointer md:flex items-center text-text-primary px-16 mt-3">
        <Link to="/" className="flex items-center font-poppins">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-bold text-white">K</span>
          <span className="ml-3 text-2xl font-bold tracking-tight">Kormopulse</span>
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-3/6 sm:h-screen flex items-center justify-center sm:pt-5 sm:pl-5 md:w-3/5 lg:pl-16 lg:pt-5">
          <div className="h-full w-full sm:text-right sm:pr-12 bg-primary sm:pt-24 sm:pl-14 text-text-inverse sm:rounded-t-lg lg:pt-44">
            <h2 className="py-4 text-xl text-center sm:text-5xl sm:text-right font-bold sm:mb-5 sm:pl-4 xl:text-6xl ">
              Find the job made for you.
            </h2>
            <p className="hidden sm:block font-light sm:pl-3 sm:text-lg text-text-inverse xl:text-xl xl:pl-16">
              Browse over 130K jobs at top companies and fast-growing startups.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-3/6 pt-7 sm:pt-14 md:w-2/5">
          <div className="p-3 sm:p-10">
            <h2 className="text-3xl font-bold text-text-primary">Login</h2>
            <p className="mt-3 text-text-secondary">Find the job made for you!</p>
            <form className="mt-6" onSubmit={handleFormSubmission}>
              <div className="flex flex-col">
                <label className="font-semibold text-text-primary">Email:</label>

                <input
                  type="text"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="rounded h-10 text-base pl-5 mb-3 border-x border-y border-neutral-400 bg-background text-text-primary"
                  placeholder="Email"
                />
                <label className="font-semibold text-text-primary">Password:</label>

                <div className="relative mb-3">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="rounded h-10 pl-5 pr-12 text-base w-full border-x border-y border-neutral-400 bg-background text-text-primary"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-primary hover:text-primary transition-colors"
                  >
                    {showPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-error text-sm ml-2">
                    {errorMessage}
                  </span>
                  <Link
                    to="/forgot-password"
                    className="text-right font-light text-text-primary cursor-pointer mb-3 underline"
                  >
                    Forget Password?
                  </Link>
                </div>

                <button className="bg-primary rounded-md text-text-inverse font-normal text-sm h-11 hover:bg-primary-dark transition-colors">
                  {loading ? "Logging in..." : "Login"}
                </button>
              </div>

              {/* Temp Hidden */}
              <div className="hidden">
                <div className="flex items-center justify-center gap-5 my-6">
                  <div className="bg-gray-400 h-px w-1/4"></div>
                  <p className="text-gray-400 text-sm">or Login with Google</p>
                  <div className="bg-gray-400 h-px w-1/4"></div>
                </div>
              </div>
            </form>

            {/* Hidden google login button */}
            <button className="hidden">
              <div className="px-10 flex items-center justify-center gap-2 h-11 rounded-md text-black text-sm w-full border-x border-y border-gray-400">
                <img
                  className="w-10 p-1"
                  src="https://www.freepnglogos.com/uploads/google-logo-png/google-logo-png-suite-everything-you-need-know-about-google-newest-0.png"
                  alt="Google Sign-In"
                />
                <span className="text-black font-normal">
                  Sign in with Google
                </span>
              </div>
            </button>
            <div className="mt-5">
              <p className="cursor-pointer text-center text-text-secondary">
                Don't have an account?{" "}
                <Link 
                  to="/signup" 
                  className="underline text-primary hover:text-primary-dark"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
