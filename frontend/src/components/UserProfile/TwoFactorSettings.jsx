import React, { useEffect, useState } from "react";
import { userService } from "../../services/userService";
import { useI18n } from "../../i18n/I18nContext";

/**
 * Account-security panel: turn two-factor authentication on or off, show remaining backup codes,
 * and regenerate them. Shared between the job seeker profile and the employer company profile.
 */
function TwoFactorSettings() {
  const { t, tError } = useI18n();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  // idle | setup | backupCodes | regenerate | disable
  const [view, setView] = useState("idle");
  const [setupData, setSetupData] = useState(null);
  const [backupCodes, setBackupCodes] = useState(null);
  const [backupCodesPurpose, setBackupCodesPurpose] = useState("enable");
  const [confirmCode, setConfirmCode] = useState("");
  const [regenCode, setRegenCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const loadStatus = async () => {
    try {
      const res = await userService.getTwoFactorStatus();
      setStatus(res.data);
    } catch {
      // keep whatever we last knew; the panel below still lets the user retry an action
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const resetToIdle = () => {
    setView("idle");
    setError("");
    setSetupData(null);
    setConfirmCode("");
    setRegenCode("");
    setDisablePassword("");
    setDisableCode("");
  };

  const startSetup = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await userService.setupTwoFactor();
      setSetupData(res.data);
      setView("setup");
    } catch (err) {
      setError(tError(err, "twoFactor.settings.setup.startFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSetup = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await userService.enableTwoFactor(confirmCode);
      setBackupCodes(res.data.backupCodes);
      setBackupCodesPurpose("enable");
      setSetupData(null);
      setConfirmCode("");
      setView("backupCodes");
      await loadStatus();
    } catch (err) {
      setError(tError(err, "twoFactor.settings.setup.invalidCode"));
    } finally {
      setSubmitting(false);
    }
  };

  const submitRegenerate = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await userService.regenerateTwoFactorBackupCodes(regenCode);
      setBackupCodes(res.data.backupCodes);
      setBackupCodesPurpose("regenerate");
      setRegenCode("");
      setView("backupCodes");
      await loadStatus();
    } catch (err) {
      setError(tError(err, "twoFactor.settings.genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisable = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await userService.disableTwoFactor(disablePassword, disableCode);
      resetToIdle();
      setMessage(t("twoFactor.settings.disabledSuccess"));
      await loadStatus();
    } catch (err) {
      setError(tError(err, "twoFactor.settings.genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  const finishBackupCodes = () => {
    setBackupCodes(null);
    resetToIdle();
    setMessage(t(backupCodesPurpose === "enable" ? "twoFactor.settings.enabledSuccess" : "twoFactor.settings.regenerateSuccess"));
  };

  const copySecret = () => {
    navigator.clipboard?.writeText(setupData.secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyAllCodes = () => {
    navigator.clipboard?.writeText(backupCodes.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadCodes = () => {
    const blob = new Blob([`${backupCodes.join("\n")}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kormopulse-backup-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-900">{t("twoFactor.settings.title")}</h2>
      <p className="text-sm text-text-secondary mt-1 mb-4">{t("twoFactor.settings.description")}</p>

      {message && view === "idle" && (
        <div className="mb-4 p-3 rounded-md bg-green-100 text-green-700 border border-green-200 text-sm">{message}</div>
      )}
      {error && view === "idle" && (
        <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 border border-red-200 text-sm">{error}</div>
      )}

      {view === "idle" && (
        <div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mb-4 ${
              status?.enabled ? "bg-success/10 text-success" : "bg-neutral-100 text-text-secondary"
            }`}
          >
            {status?.enabled ? t("twoFactor.settings.enabledBadge") : t("twoFactor.settings.disabledBadge")}
          </span>

          {status?.enabled ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-secondary">
                {t("twoFactor.settings.backupCodesRemaining", { count: status.backupCodesRemaining })}
              </p>
              <button
                type="button"
                onClick={() => setView("regenerate")}
                className="w-full py-2 px-4 rounded-md border border-neutral-300 text-text-primary font-medium hover:bg-neutral-50 transition-colors"
              >
                {t("twoFactor.settings.regenerateBackupCodes")}
              </button>
              <button
                type="button"
                onClick={() => setView("disable")}
                className="w-full py-2 px-4 rounded-md bg-error/10 text-error font-medium hover:bg-error/20 transition-colors"
              >
                {t("twoFactor.settings.disable")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startSetup}
              disabled={submitting}
              className="w-full py-2 px-4 rounded-md text-white font-medium bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {t("twoFactor.settings.enable")}
            </button>
          )}
        </div>
      )}

      {view === "setup" && setupData && (
        <form onSubmit={confirmSetup} className="flex flex-col gap-3">
          <h3 className="font-semibold text-text-primary">{t("twoFactor.settings.setup.title")}</h3>
          <p className="text-sm text-text-secondary">{t("twoFactor.settings.setup.instructions")}</p>
          <img src={setupData.qrCode} alt="" className="mx-auto w-44 h-44 border border-neutral-200 rounded-lg p-2" />
          <div>
            <label className="text-xs font-medium text-text-secondary">{t("twoFactor.settings.setup.manualKey")}</label>
            <div className="flex gap-2 mt-1">
              <code className="flex-1 text-sm bg-neutral-100 rounded-md px-3 py-2 tracking-wider break-all">{setupData.secret}</code>
              <button
                type="button"
                onClick={copySecret}
                className="text-xs px-3 py-2 rounded-md border border-neutral-300 text-text-secondary hover:bg-neutral-50 flex-shrink-0"
              >
                {copied ? t("twoFactor.settings.setup.copied") : t("twoFactor.settings.setup.copyKey")}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary">{t("twoFactor.settings.setup.codeLabel")}</label>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              placeholder="000000"
              className="w-full mt-1 border border-neutral-300 rounded-md px-3 py-2 text-center text-lg tracking-[0.4em] bg-background text-text-primary"
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetToIdle}
              className="flex-1 py-2 px-4 rounded-md border border-neutral-300 text-text-primary hover:bg-neutral-50"
            >
              {t("twoFactor.settings.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting || confirmCode.length !== 6}
              className="flex-1 py-2 px-4 rounded-md text-white bg-primary hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? t("twoFactor.settings.setup.confirming") : t("twoFactor.settings.setup.confirm")}
            </button>
          </div>
        </form>
      )}

      {view === "backupCodes" && backupCodes && (
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-text-primary">{t("twoFactor.settings.backupCodes.title")}</h3>
          <p className="text-sm text-text-secondary">{t("twoFactor.settings.backupCodes.intro")}</p>
          <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-neutral-50 rounded-md p-3 border border-neutral-200">
            {backupCodes.map((code) => (
              <span key={code}>{code}</span>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={copyAllCodes}
              className="flex-1 py-2 px-4 rounded-md border border-neutral-300 text-text-primary hover:bg-neutral-50 text-sm"
            >
              {copied ? t("twoFactor.settings.backupCodes.copied") : t("twoFactor.settings.backupCodes.copyAll")}
            </button>
            <button
              type="button"
              onClick={downloadCodes}
              className="flex-1 py-2 px-4 rounded-md border border-neutral-300 text-text-primary hover:bg-neutral-50 text-sm"
            >
              {t("twoFactor.settings.backupCodes.download")}
            </button>
          </div>
          <button type="button" onClick={finishBackupCodes} className="w-full py-2 px-4 rounded-md text-white bg-primary hover:bg-primary-dark">
            {t("twoFactor.settings.backupCodes.done")}
          </button>
        </div>
      )}

      {view === "regenerate" && (
        <form onSubmit={submitRegenerate} className="flex flex-col gap-3">
          <h3 className="font-semibold text-text-primary">{t("twoFactor.settings.regenerate.title")}</h3>
          <p className="text-sm text-text-secondary">{t("twoFactor.settings.regenerate.intro")}</p>
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={regenCode}
            onChange={(e) => setRegenCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            placeholder="000000"
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-center text-lg tracking-[0.4em] bg-background text-text-primary"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetToIdle}
              className="flex-1 py-2 px-4 rounded-md border border-neutral-300 text-text-primary hover:bg-neutral-50"
            >
              {t("twoFactor.settings.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting || regenCode.length !== 6}
              className="flex-1 py-2 px-4 rounded-md text-white bg-primary hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? t("twoFactor.settings.regenerate.confirming") : t("twoFactor.settings.regenerate.confirm")}
            </button>
          </div>
        </form>
      )}

      {view === "disable" && (
        <form onSubmit={submitDisable} className="flex flex-col gap-3">
          <h3 className="font-semibold text-text-primary">{t("twoFactor.settings.disableForm.title")}</h3>
          <p className="text-sm text-text-secondary">{t("twoFactor.settings.disableForm.intro")}</p>
          <div>
            <label className="text-sm font-medium text-text-primary">{t("twoFactor.settings.disableForm.passwordLabel")}</label>
            <input
              type="password"
              autoFocus
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder={t("twoFactor.settings.disableForm.passwordPlaceholder")}
              className="w-full mt-1 border border-neutral-300 rounded-md px-3 py-2 bg-background text-text-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary">{t("twoFactor.settings.disableForm.codeLabel")}</label>
            <input
              type="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              maxLength={11}
              placeholder={t("twoFactor.settings.disableForm.codePlaceholder")}
              className="w-full mt-1 border border-neutral-300 rounded-md px-3 py-2 bg-background text-text-primary"
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetToIdle}
              className="flex-1 py-2 px-4 rounded-md border border-neutral-300 text-text-primary hover:bg-neutral-50"
            >
              {t("twoFactor.settings.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting || !disablePassword || !disableCode}
              className="flex-1 py-2 px-4 rounded-md text-white bg-error hover:bg-error/90 disabled:opacity-50"
            >
              {submitting ? t("twoFactor.settings.disableForm.confirming") : t("twoFactor.settings.disableForm.confirm")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default TwoFactorSettings;
