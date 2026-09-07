import React from "react";
import logo from "./assets/media/logo.png";
function Footer() {
  return (
    <div className="md:flex justify-between py-12 border-t border-neutral-300  ">
      <div className="md:w-2/5 ml-6 md:ml-20 flex flex-col gap-2 py-4 md:py-0">
        <img src={logo} className="w-3/5 md:w-3/6" />
        <div className=" flex gap-3 text-2xl ml-3.5 text-text-secondary">
          <i className="fa-brands fa-twitter cursor-pointer hover:text-primary"></i>
          <i className="fa-brands fa-instagram cursor-pointer hover:text-primary"></i>
          <i className="fa-brands fa-linkedin-in cursor-pointer hover:text-primary"></i>
        </div>
      </div>
      <div className="md:flex justify-between md:w-3/5 px-10 md:px-0">
        <div className="flex flex-col gap-2.5 py-5 md:py-0">
          <h3 className="font-semibold md:text-base text-xl text-text-primary">For Candidates</h3>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            Overview
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            Startup Jobs
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            Web3 Jobs
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            Featured
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            Startup Hiring Data
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            Tech Startups
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            Remote
          </p>
        </div>
        <div className="flex flex-col gap-2.5 py-5 md:py-0">
          <h3 className="font-semibold md:text-base text-xl text-text-primary">
            For Recruiters
          </h3>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            Overview
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            Recruit Pro
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            Curated
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            RecruiterCloud
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            Hire Developers
          </p>
          <p className=" cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            Pricing
          </p>
        </div>
        <div className="flex flex-col gap-2.5 py-5 md:py-0">
          <h3 className="font-semibold md:text-base text-xl text-text-primary">Company</h3>
          <p className="cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            About
          </p>
          <p className="cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            AngelList Venture
          </p>
          <p className="cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            Blog
          </p>
          <p className="cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            Terms & Risks
          </p>
          <p className="cursor-pointer text-lg md:text-base hover:underline hover:text-primary text-text-secondary">
            Privacy & Cookies
          </p>
        </div>
        <div></div>
      </div>
    </div>
  );
}

export default Footer;
