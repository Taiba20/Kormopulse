import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../store/authSlice';
import { registerUser, getCurrentUser } from '../../services/userService';
import { useNavigate } from "react-router-dom";
import useUpdateUserData from "../../hooks/useUpdateUserData";
import { IoEye, IoEyeOff } from 'react-icons/io5';

function Signup() {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();
  const updateUser = useUpdateUserData();

  const [userType, setUserType] = useState("jobSeeker");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const resetErrorMessage = () => {
    setTimeout(() => {
      setErrorMessage("");
    }, 5000);
  };

  const handleFormSubmission = (event) => {
    event.preventDefault();

    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;

    if (!passwordPattern.test(formData.password)) {
      setErrorMessage(
        "Password must include at least one uppercase letter, one lowercase letter, one digit, one special character, and be at least 6 characters long."
      );

      resetErrorMessage();
    } else if (formData.password !== formData.confirmPassword) {
      setErrorMessage(
        "The passwords you entered don't match. Please check and try again."
      );
      resetErrorMessage();
    } else {
      postUserData(formData);
    }
  };

  const postUserData = async (data) => {
    dispatch(loginStart());
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: userType,  // Mapped 'userType' to 'role' for backend
      };
      const response = await registerUser(payload);  // Updated to send 'payload' instead of 'data'
      dispatch(loginSuccess(response.data.data.user));
      alert('Account created successfully!');
      const currentUserResponse = await getCurrentUser();
      const userData = currentUserResponse.data.data.user;
      if (userData) {
        console.log(userData);
        if (userData.role === "jobSeeker") {
          navigate("/user-onboarding");
        } else {
          navigate("/company-onboarding");
        }

        updateUser();
      }
       setLoading(false);
    } catch (error) {
      dispatch(loginFailure());
      setErrorMessage(error.response?.data?.message || 'Registration failed.');
      resetErrorMessage();
    }
    finally{
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
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
              {userType === "jobSeeker"
                ? "Find the job made for you."
                : userType === "employer" &&
                (Math.random() > 0.5
                  ? "Discover the perfect fit for your team."
                  : "Unearth the gem your organization needs.")}
            </h2>

            <p className="hidden sm:block font-light sm:pl-3 sm:text-lg text-text-inverse xl:text-xl xl:pl-16">
              {userType === "jobSeeker"
                ? "Browse over 130K jobs at top companies and fast-growing startups."
                : "Browse through a vast pool of talented job seekers."}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-3/6 pt-1.5 md:w-2/5">
          <div className="flex flex-col md:flex-row justify-center items-center gap-5 ">
            <div
              onClick={() => setUserType("jobSeeker")}
              className={`rounded-md px-5 py-1 cursor-pointer font-semibold text-text-secondary transition-colors ${userType === "jobSeeker" ? "bg-primary text-white" : "bg-neutral-200 hover:bg-neutral-300"
                }`}
            >
              I am a Job Seeker
            </div>
            <div
              onClick={() => setUserType("employer")}
              className={`rounded-md px-5 py-1 cursor-pointer font-semibold text-text-secondary transition-colors ${userType === "employer" ? "bg-primary text-white" : "bg-neutral-200 hover:bg-neutral-300"
                }`}
            >
              I am an Employer
            </div>
          </div>

          <div className="p-3 sm:p-10 ">
            <h2 className=" text-3xl font-bold text-text-primary">Create Account</h2>
            <p className="mt-3 text-text-secondary">
              {userType === "jobSeeker"
                ? "Find your next opportunity!"
                : "Find the best talents!"}
            </p>

            <form className="mt-3" onSubmit={handleFormSubmission}>
              <div className="flex flex-col">
                <label className=" font-semibold text-text-primary">
                  {userType === "employer" ? "Company Name:" : "Full Name:"}
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="rounded h-10 text-base pl-5 mb-3 border-x border-y border-neutral-400 bg-background text-text-primary"
                  placeholder={`Enter ${userType === "employer" ? "company name" : "name"
                    }`}
                />

                <label className=" font-semibold text-text-primary">Email Address:</label>
                <input
                  type="text"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="rounded h-10 text-base pl-5 mb-3 border-x border-y border-neutral-400 bg-background text-text-primary"
                  placeholder="user@mail.com"
                />

                <label className=" font-semibold text-text-primary">Password:</label>
                <div className="relative mb-3">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="rounded h-10 pl-5 pr-12 text-base w-full border-x border-y border-neutral-400 bg-background text-text-primary"
                    placeholder="min 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-primary hover:text-primary transition-colors"
                  >
                    {showPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                  </button>
                </div>

                <label className=" font-semibold text-text-primary">Confirm Password:</label>
                <div className="relative mb-3">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="rounded h-10 pl-5 pr-12 text-base w-full border-x border-y border-neutral-400 bg-background text-text-primary"
                    placeholder="confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-primary hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                  </button>
                </div>
                <span className="text-error text-sm ml-2">
                  {errorMessage}
                </span>
                <button
                  type="submit"
                  className="bg-primary rounded-md text-text-inverse font-normal text-sm h-11 mt-3 hover:bg-primary-dark transition-colors"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>

            {/* Hidden signup with google */}
            <div className="hidden">
              <div className="flex items-center justify-center gap-5 my-4">
                <div className="bg-gray-400 h-px w-1/4"></div>
                <p className=" text-gray-400 text-sm">or Login with Email</p>
                <div className="bg-gray-400 h-px w-1/4"></div>
              </div>
              <button className="px-10 items-center justify-center gap-2 flex h-11 rounded-md text-black text-sm w-full border-x border-y border-gray-400">
                <img
                  className="w-10 p-1"
                  src="https://www.freepnglogos.com/uploads/google-logo-png/google-logo-png-suite-everything-you-need-know-about-google-newest-0.png"
                  alt="Google Sign-In"
                />
                <span className="text-black font-normal">
                  Sign in with Google
                </span>
              </button>
            </div>
            <div className="mt-3">
              <p className=" cursor-pointer text-center text-text-secondary">
                Already have an account?
                <Link
                  to="/login"
                  className="underline pl-1 text-primary hover:text-primary-dark"
                >
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
