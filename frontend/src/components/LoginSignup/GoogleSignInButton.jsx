import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../store/authSlice";
import { userService } from "../../services/userService";
import TwoFactorPrompt from "../Common/TwoFactorPrompt";
import { useI18n } from "../../i18n/I18nContext";

const GOOGLE_CONFIGURED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

/**
 * "Sign in with Google" button. Handles both existing users (signs them straight in) and
 * brand-new Google users (asks whether they are a job seeker or an employer first).
 * Renders nothing if VITE_GOOGLE_CLIENT_ID is not configured.
 */
function GoogleSignInButton({ onAuthenticated, onError, initialRole }) {
  const dispatch = useDispatch();
  const { t, tError, lang } = useI18n();
  const [pendingCredential, setPendingCredential] = useState(null);
  const [twoFactorToken, setTwoFactorToken] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!GOOGLE_CONFIGURED) return null;

  const finish = async (credential, role) => {
    // Note: deliberately not dispatching the Redux loginStart/loginFailure actions here -- see
    // the matching comment in Login.jsx's makeLoginRequest for why that would unmount this
    // component (and lose pendingCredential/twoFactorToken) on every attempt.
    setBusy(true);
    try {
      const response = await userService.googleLogin(credential, role, lang);
      const { needsRole, twoFactorRequired, twoFactorToken: token, user } = response.data.data;
      if (needsRole) {
        setPendingCredential(credential);
        return;
      }
      if (twoFactorRequired) {
        setPendingCredential(null);
        setTwoFactorToken(token);
        return;
      }
      setPendingCredential(null);
      dispatch(loginSuccess(user));
      onAuthenticated?.(user);
    } catch (error) {
      setPendingCredential(null);
      onError?.(tError(error, "auth.google.failed"));
    } finally {
      setBusy(false);
    }
  };

  const handleTwoFactorVerified = (user) => {
    setTwoFactorToken(null);
    dispatch(loginSuccess(user));
    onAuthenticated?.(user);
  };

  if (twoFactorToken) {
    return <TwoFactorPrompt twoFactorToken={twoFactorToken} onVerified={handleTwoFactorVerified} onBack={() => setTwoFactorToken(null)} />;
  }

  if (pendingCredential) {
    return (
      <div className="border border-neutral-300 rounded-lg p-4 text-center">
        <p className="text-sm text-text-primary mb-3">{t("auth.google.oneMoreStep")}</p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            disabled={busy}
            onClick={() => finish(pendingCredential, "jobSeeker")}
            className="px-4 py-2 text-sm rounded-md border border-primary text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
          >
            {t("auth.google.imSeeker")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => finish(pendingCredential, "employer")}
            className="px-4 py-2 text-sm rounded-md border border-primary text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
          >
            {t("auth.google.imEmployer")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={(cred) => finish(cred.credential, initialRole)}
        onError={() => onError?.(t("auth.google.failed"))}
        useOneTap={false}
        width="320"
      />
    </div>
  );
}

export default GoogleSignInButton;
