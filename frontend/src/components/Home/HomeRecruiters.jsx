import React from "react";
import happyPeople from "../assets/media/happyRecruiters.svg";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";

function HomeRecruiters() {
  const { t } = useI18n();
  return (
    <div className="md:flex px-7 md:px-10 py-8 font-Poppins">
      <div className="md:w-1/2 px-3 md:px-16">
        <div>
          <p className="text-xl font-medium text-primary">{t("home.recruiters.eyebrow")}</p>
        </div>
        <div>
          <h3 className="text-4xl font-semibold md:mr-28 my-7 text-text-primary">
            {t("home.recruiters.title")}
          </h3>
        </div>

        <div className="flex flex-col gap-8 text-left">
          <div className="flex items-center justify-center gap-4">
            <img src="https://assets-global.website-files.com/636dd759d71287e8ac7e6280/636dd759d7128716b37e63bb_Team.svg" />
            <p className="text-text-secondary">
              <span className="font-semibold text-text-primary">{t("home.recruiters.p1a")}</span>
              {t("home.recruiters.p1b")}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <img src="https://assets-global.website-files.com/636dd759d71287e8ac7e6280/636dd759d7128708fd7e63b6_Settings.svg" />
            <p className="text-text-secondary">
              {t("home.recruiters.p2a")}
              <span className="font-semibold text-text-primary">{t("home.recruiters.p2b")}</span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <img src="https://assets-global.website-files.com/636dd759d71287e8ac7e6280/636dd759d71287316a7e63c1_Template.svg" />
            <p className="text-text-secondary">
              {t("home.recruiters.p3a")}
              <span className="font-semibold text-text-primary">{t("home.recruiters.p3b")}</span>
              {t("home.recruiters.p3c")}
            </p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <p className="text-text-secondary">
              {t("home.recruiters.p4a")}<u>{t("home.recruiters.p4b")}</u>{t("home.recruiters.p4c")}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="my-10">
          <Link to="/login">
            <button className="border border-neutral-300 text-text-primary font-medium py-2 px-5 rounded-xl md:shadow hover:bg-primary hover:border-primary hover:text-text-inverse duration-500 mr-5 md:hover:scale-105">
              {t("home.learnMore")}
            </button>
          </Link>
          <Link to="/signup">
            <button className="bg-primary text-text-inverse font-medium py-2 px-5 rounded-xl  hover:bg-primary-dark duration-500 md:hover:scale-105 md:shadow">
              {t("home.signUpNow")}
            </button>
          </Link>
        </div>
      </div>
      {/* Right */}

      <div className="md:w-1/2">
        <div className="sm:p-20 md:p-0">
          <img src={happyPeople} className="md:w-11/12" />
        </div>
      </div>
    </div>
  );
}

export default HomeRecruiters;
