import React, { useState } from "react";
import { Link } from "react-router-dom";
import heroImage from "./assets/media/heroImage.png";

function Hero() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="md:flex ">
      <div className=" md:w-1/2 bg-neutral-100 ">
        <div className="flex flex-col pt-28 pl-8 md:pl-20 gap-6">
          <p className=" font-semibold text-primary">_/ Get Hired</p>
          <div className="flex flex-col gap-4">
            <h2 className=" text-5xl font-bold text-text-primary">The Quickest way</h2>
            <h2 className=" text-5xl font-bold text-text-primary">to Hire!</h2>
          </div>
          <p className="font-medium text-text-secondary pr-10 md:pr-32">
            We'll help you find{" "}
            <span className="font-semibold text-text-primary">
              Great Opportunities
            </span>
            , Receive your top new job matches directly in your inbox.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-9 md:gap-14 items-center mt-10 md:mt-8 md:pl-20 pl-0">
          <Link to={"/signup"}>
            {
              <button 
                className="py-3 px-5 border-2 border-primary font-semibold text-primary hover:scale-105 duration-150 hover:bg-primary hover:text-text-inverse"
                style={{
                  boxShadow: '4px 4px 0px #9E0A57'
                }}
              >
                Join Our Platform{" "}
                <span className="ml-6">
                  <i className="fa-solid fa-arrow-right"></i>
                </span>
              </button>
            }
          </Link>
         
        </div>
        <div className="mt-24 flex gap-8 items-center md:items-end justify-center md:justify-normal md:pl-20 pl-14 pb-9 md:pb-0 px-5 md:px-0 md:pt-5">
          <div 
            className="py-3.5 w-20 border-2 border-primary font-semibold text-primary hover:scale-105 flex justify-center items-center"
            style={{
              boxShadow: '4px 4px 0px #9E0A57'
            }}
          >
            <svg 
              className="w-10 h-10 text-primary" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
              />
            </svg>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-3xl font-semibold text-text-primary">1.4 Million</p>
            <p className=" text-sm font-medium text-text-secondary">
              Candidate Placed to Top Companies
            </p>
          </div>
        </div>
      </div>
      <div className=" hidden md:w-1/2 bg-primary md:flex items-center justify-center overflow-hidden">
        <img src={heroImage} className="w-11/12 ml-16 md:pt-44 " />
      </div>
    </div>
  );
}

export default Hero;
