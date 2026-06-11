// lib/types.ts - Shared resume data model types

export interface Personal {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
}

export interface Experience {
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface Education {
  school: string;
  degree: string;
  location: string;
  date: string;
  details: string;
}

export interface Project {
  name: string;
  tech: string;
  link: string;
  description: string;
}

export interface SkillGroup {
  category: string;
  list: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
}

export interface Resume {
  personal: Personal;
  summary: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: SkillGroup[];
  certifications: Certification[];
}

export interface FormattingWarning {
  type: "error" | "warning";
  message: string;
}

export interface ExperienceGap {
  from: string;   // end date of previous role
  to: string;     // start date of next role
  months: number; // gap length in months
}

export interface AtsReport {
  score: number;
  breakdown: {
    must_have_keywords: number;
    good_to_have_keywords: number;
    sections: number;
    formatting: number;
  };
  must_have_matched: string[];
  must_have_missing: string[];
  good_to_have_matched: string[];
  good_to_have_missing: string[];
  formatting_warnings: FormattingWarning[];
  verb_suggestions: string[];
  word_count: number;
  experience_gaps: ExperienceGap[];
}

export interface RoleConfig {
  title: string;
  must_have: string[];
  good_to_have: string[];
  action_verbs: string[];
  skills?: string[];
}

export type RoleKeywords = Record<string, RoleConfig>;

export type TemplateId = "modern" | "professional" | "graduate" | "executive" | "twocolumn";

export interface AppUser {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    batch?: string;
    course?: string;
    [key: string]: unknown;
  };
}
