// components/PrepTab.tsx - Resume-specific interview preparation
"use client";

import type { Resume } from "@/lib/types";
import InterviewStoryCard from "./InterviewStoryCard";
import InterviewPrepGuide from "./InterviewPrepGuide";

export default function PrepTab({ resume, targetRole }: { resume: Resume; targetRole: string }) {
  return (
    <div>
      <h2>Interview Preparation</h2>
      <p className="caption">Build a resume-specific interview story and question plan.</p>

      <InterviewStoryCard resume={resume} targetRole={targetRole} />
      <InterviewPrepGuide resume={resume} targetRole={targetRole} />
    </div>
  );
}
