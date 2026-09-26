import React from "react";
import { useI18n } from "../../i18n/I18nContext";
function Footer() {
  const { t } = useI18n();
  return (
    <div className="md:flex justify-between py-12 border-t border-neutral-300  ">
      <div className="md:w-2/5 ml-6 md:ml-20 flex flex-col gap-2 py-4 md:py-0">
        <span className="ml-3.5 text-4xl font-bold tracking-tight text-primary">Kormopulse</span>
        <div className=" flex gap-3 text-2xl ml-3.5 text-text-secondary">
          <i className="fa-brands fa-twitter cursor-pointer hover:text-primary"></i>
          <i className="fa-brands fa-instagram cursor-pointer hover:text-primary"></i>
          <i className="fa-brands fa-linkedin-in cursor-pointer hover:text-primary"></i>
        </div>
      </div>
      <div className="md:flex justify-between md:w-3/5 px-10 md:px-0">
        <div className="flex flex-col gap-2.5 py-5 md:py-0">
          <h3 className="font-semibold md:text-base text-xl text-text-primary">{t("footer.forCandidates")}</h3>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.overview")}
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.startupJobs")}
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.web3Jobs")}
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.featured")}
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.hiringData")}
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.techStartups")}
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.remote")}
          </p>
        </div>
        <div className="flex flex-col gap-2.5 py-5 md:py-0">
          <h3 className="font-semibold md:text-base text-xl text-text-primary">
            {t("footer.forRecruiters")}
          </h3>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.overview")}
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.recruitPro")}
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.curated")}
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.recruiterCloud")}
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.hireDevelopers")}
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.pricing")}
          </p>
        </div>
        <div className="flex flex-col gap-2.5 py-5 md:py-0">
          <h3 className="font-semibold md:text-base text-xl text-text-primary">{t("footer.company")}</h3>
          <p className="cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.about")}
          </p>
          <p className="cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.ventures")}
          </p>
          <p className="cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.blog")}
          </p>
          <p className="cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.terms")}
          </p>
          <p className="cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            {t("footer.privacy")}
          </p>
        </div>
        <div></div>
      </div>
    </div>
  );
}

export default Footer;
