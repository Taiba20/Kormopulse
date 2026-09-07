import React from "react";
import styles from "./JobDescription.module.css";

function JobDescription({ jobData }) {
  const { description, skills } = jobData;
  return (
    <div className="border border-neutral-200 bg-background p-5 rounded-3xl shadow-md mb-10">
      <div
        className={styles.descriptionContainer}
        dangerouslySetInnerHTML={{ __html: description }}
      />

      <div className="py-2">
        <h3 className="font-medium text-text-primary">Key Skills</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {skills?.map((skill, index) => (
            <span
              className="text-xs bg-background-secondary text-text-secondary px-2 py-1 rounded-lg border border-neutral-200 shadow-sm font-medium hover:bg-primary hover:text-white hover:scale-105 transition-all duration-200 cursor-pointer"
              key={index}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default JobDescription;
