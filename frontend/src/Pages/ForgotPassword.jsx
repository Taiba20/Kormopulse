import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from '../services/userService';
import { IoEye, IoEyeOff } from 'react-icons/io5';
import { useI18n } from '../i18n/I18nContext';

function ForgotPassword() {
  const { t, tError } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("email"); // "email" -> "reset"
  const [infoMessage, setInfoMessage] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    password: "",
    confirmPassword: ""
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      await forgotPassword({ email: formData.email });
      setStep("reset");
      setInfoMessage(t('auth.forgot.sentInfo'));
    } catch (error) {
      setErrorMessage(tError(error, 'common.somethingWrong'));
      resetErrorMessage();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage(t('auth.forgot.mismatch'));
      resetErrorMessage();
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage(t('auth.forgot.tooShort'));
      resetErrorMessage();
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await resetPassword(formData);
      alert(t('auth.forgot.done'));
      navigate("/login");
    } catch (error) {
      setErrorMessage(tError(error, "common.somethingWrong"));
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
              {t('auth.forgot.heading')}
            </h2>
            <p className="hidden sm:block font-light sm:pl-3 sm:text-lg text-text-inverse xl:text-xl xl:pl-16">
              {t('auth.forgot.intro')}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-3/6 pt-7 sm:pt-14 md:w-2/5">
          <div className="p-3 sm:p-10">
            <h2 className="text-3xl font-bold text-text-primary">{t('auth.forgot.title')}</h2>
            <p className="mt-3 text-text-secondary">
              {step === "email" ? t('auth.forgot.stepEmail') : t('auth.forgot.stepReset')}
            </p>
            {infoMessage && <p className="mt-3 text-sm text-primary">{infoMessage}</p>}
            
            <form className="mt-6" onSubmit={step === "email" ? handleSendCode : handleResetPassword}>
              <div className="flex flex-col">
                <label className="font-semibold text-text-primary">{t('auth.email')}</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  readOnly={step === "reset"}
                  className="rounded h-10 text-base pl-5 mb-3 border-x border-y border-neutral-400 bg-background text-text-primary"
                  placeholder={t('auth.forgot.emailPlaceholder')}
                />
                
                {step === "reset" && (
                  <>
                <label className="font-semibold text-text-primary">{t('auth.forgot.code')}</label>
                <input
                  type="text"
                  name="code"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="rounded h-10 text-base pl-5 mb-3 border-x border-y border-neutral-400 bg-background text-text-primary tracking-widest"
                  placeholder={t('auth.forgot.codePlaceholder')}
                />

                <label className="font-semibold text-text-primary">{t('auth.forgot.newPassword')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="rounded h-10 text-base pl-5 pr-12 mb-3 border-x border-y border-neutral-400 bg-background text-text-primary w-full"
                    placeholder={t('auth.forgot.newPasswordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-text-primary hover:text-text-secondary"
                  >
                    {showPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                  </button>
                </div>

                <label className="font-semibold text-text-primary">{t('auth.forgot.confirmPassword')}</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="rounded h-10 text-base pl-5 pr-12 mb-3 border-x border-y border-neutral-400 bg-background text-text-primary w-full"
                    placeholder={t('auth.forgot.confirmPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2 text-text-primary hover:text-text-secondary"
                  >
                    {showConfirmPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                  </button>
                </div>
                
                  </>
                )}

                <div className="flex justify-between">
                  <span className="text-error text-sm ml-2">
                    {errorMessage}
                  </span>
                  <Link
                    to="/login"
                    className="text-right font-light text-text-primary cursor-pointer mb-3 underline"
                  >
                    {t('auth.forgot.backToLogin')}
                  </Link>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-primary rounded-md text-text-inverse font-normal text-sm h-11 hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {step === "email" ? (loading ? t('auth.forgot.sending') : t('auth.forgot.sendCode')) : (loading ? t('auth.forgot.updating') : t('auth.forgot.update'))}
                </button>
              </div>
            </form>

            <div className="mt-5">
              <p className="cursor-pointer text-center text-text-secondary">
                {t('auth.forgot.remember')}{" "}
                <Link 
                  to="/login" 
                  className="underline text-primary hover:text-primary-dark"
                >
                  {t('auth.forgot.login')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
