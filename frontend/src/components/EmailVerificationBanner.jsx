import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { userService } from "../services/userService";
import { updateUser } from "../store/authSlice";

/** Shown across the app when the logged-in user has not verified their email yet. */
function EmailVerificationBanner() {
  const { userData } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Legacy accounts have no emailVerified field at all and count as verified.
  if (!userData || userData.emailVerified !== false || dismissed) return null;

  const resend = async () => {
    setError("");
    setInfo("");
    try {
      await userService.resendVerification();
      setInfo("A new code has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend the code. Please try again shortly.");
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await userService.verifyEmail(code);
      dispatch(updateUser({ ...userData, emailVerified: true }));
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-warning/15 border-b border-warning/30 text-text-primary text-sm px-4 py-2.5 flex flex-wrap items-center justify-center gap-3 text-center">
        <span>
          <i className="fa-solid fa-envelope-circle-check mr-1.5"></i>
          Please verify your email address to unlock all features.
        </span>
        <button onClick={() => setOpen(true)} className="font-semibold text-primary underline hover:text-primary-dark">
          Verify now
        </button>
        <button onClick={() => setDismissed(true)} className="text-text-muted hover:text-text-primary" aria-label="Dismiss">
          &times;
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-background rounded-2xl shadow-xl p-6">
            <h3 className="font-semibold text-text-primary text-lg mb-1">Verify your email</h3>
            <p className="text-sm text-text-secondary mb-4">
              Enter the 6-digit code sent to <span className="font-medium">{userData.email}</span>.
            </p>
            <form onSubmit={verify} className="flex flex-col gap-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="border border-neutral-300 rounded-lg px-3 py-2.5 text-center text-2xl tracking-[0.4em] bg-background text-text-primary"
                autoFocus
              />
              {error && <p className="text-sm text-error">{error}</p>}
              {info && <p className="text-sm text-success">{info}</p>}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="bg-primary text-white rounded-lg h-11 font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
              <div className="flex justify-between text-sm">
                <button type="button" onClick={resend} className="text-primary hover:underline">
                  Resend code
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-text-secondary hover:underline">
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default EmailVerificationBanner;
