import React, { useState } from "react";
import { userService } from "../../services/userService";
import { useI18n } from "../../i18n/I18nContext";

/**
 * Second step of login when the account has two-factor authentication enabled. Shown in place of
 * the normal login form (or the Google button) once the password/Google credential is accepted
 * but before a session is granted. Redeems `twoFactorToken` with a TOTP or backup code.
 */
function TwoFactorPrompt({ twoFactorToken, onVerified, onBack }) {
  const { t, tError } = useI18n();
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await userService.verifyTwoFactorLogin(twoFactorToken, code);
      onVerified(response.data.data.user);
    } catch (err) {
      setError(tError(err, "twoFactor.login.invalid"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-text-primary">{t("twoFactor.login.title")}</h2>
      <p className="mt-3 text-text-secondary">{t("twoFactor.login.subtitle")}</p>
      <form className="mt-6" onSubmit={submit}>
        <div className="flex flex-col">
          <input
            type="text"
            inputMode={useBackupCode ? "text" : "numeric"}
            autoFocus
            required
            value={code}
            onChange={(e) => setCode(useBackupCode ? e.target.value : e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={useBackupCode ? 11 : 6}
            // A literal example, not translated: an authenticator app always shows Latin digits, and a
            // backup code always looks like this, whichever language the page is in.
            placeholder={useBackupCode ? "XXXXX-XXXXX" : "000000"}
            className="rounded h-10 text-base pl-5 mb-3 border-x border-y border-neutral-400 bg-background text-text-primary tracking-widest"
          />

          {error && <span className="text-error text-sm ml-2 mb-3">{error}</span>}

          <button
            type="submit"
            disabled={submitting || !code}
            className="bg-primary rounded-md text-text-inverse font-normal text-sm h-11 hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {submitting ? t("twoFactor.login.submitting") : t("twoFactor.login.submit")}
          </button>
        </div>
      </form>

      <div className="mt-5 flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => {
            setUseBackupCode((v) => !v);
            setCode("");
            setError("");
          }}
          className="underline text-primary hover:text-primary-dark"
        >
          {useBackupCode ? t("twoFactor.login.useApp") : t("twoFactor.login.useBackup")}
        </button>
        <button type="button" onClick={onBack} className="text-text-secondary hover:underline">
          {t("twoFactor.login.back")}
        </button>
      </div>
    </div>
  );
}

export default TwoFactorPrompt;
