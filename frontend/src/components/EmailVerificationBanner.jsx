import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { userService } from "../services/userService";
import { updateUser } from "../store/authSlice";
import { useI18n } from "../i18n/I18nContext";

/** Shown across the app when the logged-in user has not verified their email yet. */
function EmailVerificationBanner() {
  const { userData } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const { t, tError } = useI18n();
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
      setInfo(t("auth.verify.resent"));
    } catch (err) {
      setError(tError(err, "auth.verify.resendFailed"));
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
      setError(tError(err, "auth.verify.invalid"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-warning/15 border-b border-warning/30 text-text-primary text-sm px-4 py-2.5 flex flex-wrap items-center justify-center gap-3 text-center">
        <span>
          <i className="fa-solid fa-envelope-circle-check mr-1.5"></i>
          {t("auth.verify.banner")}
        </span>
        <button onClick={() => setOpen(true)} className="font-semibold text-primary underline hover:text-primary-dark">
          {t("auth.verify.now")}
        </button>
        <button onClick={() => setDismissed(true)} className="text-text-muted hover:text-text-primary" aria-label={t("auth.verify.dismiss")}>
          &times;
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-background rounded-2xl shadow-xl p-6">
            <h3 className="font-semibold text-text-primary text-lg mb-1">{t("auth.verify.title")}</h3>
            <p className="text-sm text-text-secondary mb-4">
              {t("auth.verify.enterCode", { email: userData.email })}
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
                {loading ? t("auth.verify.submitting") : t("auth.verify.submit")}
              </button>
              <div className="flex justify-between text-sm">
                <button type="button" onClick={resend} className="text-primary hover:underline">
                  {t("auth.verify.resend")}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-text-secondary hover:underline">
                  {t("common.close")}
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
