import React from "react";
import happyPeople from "../assets/media/happy.svg";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";

function JobSeekers() {
  const { t } = useI18n();
  return (
    <div className="md:flex px-5 md:px-10 py-20 md:py-32 font-Poppins">
      <div className="md:w-1/2">
        <div className="sm:p-20 md:p-0">
          <img src={happyPeople} className=" md:w-11/12" />
        </div>
      </div>

      {/* Right */}
      <div className="md:w-1/2 px-5 md:px-16">
        <div>
          <p className="text-xl font-medium my-10 text-primary">{t("home.seekers.eyebrow")}</p>
        </div>
        <div>
          <h3 className="text-4xl font-semibold mr-4 md:mr-20 my-7 text-text-primary">
            {t("home.seekers.title")}
          </h3>
        </div>

        <div className="flex flex-col gap-8 text-left">
          <div className="flex items-center justify-center gap-4">
            <img src="https://assets-global.website-files.com/636dd759d71287e8ac7e6280/636dd759d71287fab77e63b3_Star.svg" />
            <p className="text-text-secondary">
              {t("home.seekers.p1a")}<span className="font-semibold text-text-primary">{t("home.seekers.p1b")}</span>{t("home.seekers.p1c")}
              <span className="font-semibold text-text-primary">{t("home.seekers.p1d")}</span>{t("home.seekers.p1e")}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <img src="https://assets-global.website-files.com/636dd759d71287e8ac7e6280/636dd759d7128775587e63ec_Click.svg" />
            <p className="text-text-secondary">
              {t("home.seekers.p2a")}
              <span className="font-semibold text-text-primary">{t("home.seekers.p2b")}</span>{t("home.seekers.p2c")}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <img src="https://assets-global.website-files.com/636dd759d71287e8ac7e6280/636dd759d71287515d7e63b2_List.svg" />
            <p className="text-text-secondary">
              {t("home.seekers.p3a")}
              <span className="font-semibold text-text-primary">{t("home.seekers.p3b")}</span>{t("home.seekers.p3c")}
              <span className="font-semibold text-text-primary">{t("home.seekers.p3d")}</span>{t("home.seekers.p3e")}
            </p>
          </div>

          <div className=" flex items-center justify-center gap-4">
            <img src="https://assets-global.website-files.com/636dd759d71287e8ac7e6280/636dd759d71287b6b07e63ed_Connect.svg" />
            <p className="text-text-secondary">
              {t("home.seekers.p4a")}
              <span className="font-semibold text-text-primary">{t("home.seekers.p4b")}</span>{t("home.seekers.p4c")}
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
    </div>
  );
}

export default JobSeekers;
