import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { loginStart, loginSuccess, loginFailure } from "../../store/authSlice";
import { userService } from "../../services/userService";

const GOOGLE_CONFIGURED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

/**
 * "Sign in with Google" button. Handles both existing users (signs them straight in) and
 * brand-new Google users (asks whether they are a job seeker or an employer first).
 * Renders nothing if VITE_GOOGLE_CLIENT_ID is not configured.
 */
function GoogleSignInButton({ onAuthenticated, onError, initialRole }) {
  const dispatch = useDispatch();
  const [pendingCredential, setPendingCredential] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!GOOGLE_CONFIGURED) return null;

  const finish = async (credential, role) => {
    dispatch(loginStart());
    setBusy(true);
    try {
      const response = await userService.googleLogin(credential, role);
      const { needsRole, user } = response.data.data;
      if (needsRole) {
        setPendingCredential(credential);
        dispatch(loginFailure());
        return;
      }
      setPendingCredential(null);
      dispatch(loginSuccess(user));
      onAuthenticated?.(user);
    } catch (error) {
      dispatch(loginFailure());
      setPendingCredential(null);
      onError?.(error.response?.data?.message || "Google sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (pendingCredential) {
    return (
      <div className="border border-neutral-300 rounded-lg p-4 text-center">
        <p className="text-sm text-text-primary mb-3">One more step: how will you use Kormopulse?</p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            disabled={busy}
            onClick={() => finish(pendingCredential, "jobSeeker")}
            className="px-4 py-2 text-sm rounded-md border border-primary text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
          >
            I'm a job seeker
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => finish(pendingCredential, "employer")}
            className="px-4 py-2 text-sm rounded-md border border-primary text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
          >
            I'm an employer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={(cred) => finish(cred.credential, initialRole)}
        onError={() => onError?.("Google sign-in failed. Please try again.")}
        useOneTap={false}
        width="320"
      />
    </div>
  );
}

export default GoogleSignInButton;
