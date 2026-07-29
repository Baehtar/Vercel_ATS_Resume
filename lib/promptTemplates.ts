export type PromptKey = "experience" | "summary" | "story" | "interview_prep" | "experience_package";

export const PROMPT_LABELS: Record<PromptKey, string> = {
  experience: "Experience Bullets",
  summary: "Recruiter Summary",
  story: "Interview Story",
  interview_prep: "Interview Prep Questions",
  experience_package: "Combined Experience Package",
};

export const DEFAULT_PROMPT_TEMPLATES: Record<PromptKey, string> = {
  experience: `You are an expert {{discipline}} Resume Writer with experience hiring {{label}}s at product companies, consulting firms, and Fortune 500 organizations.

Your task is to transform my actual work experience into highly professional, ATS-friendly, interview-ready {{label}} experience bullet points.

### Instructions
1. Generate ONLY the Experience Section.
2. Do not create a resume summary, skills section, certifications, or projects.
3. Convert my existing responsibilities into {{adjective}}-focused responsibilities wherever logically possible.
4. Maintain realism. Do not invent impossible achievements.
5. Make the experience sound genuine and believable to an experienced interviewer.
6. Use strong action verbs and professional corporate language.
7. Write each bullet point as if it was performed in a real production / business environment.
8. Include measurable business impact whenever reasonable.
9. Create a coherent business story behind the work instead of listing random technologies.
10. If a client name is provided, naturally incorporate it into the experience.
11. If a domain is provided, create domain-specific {{storyDiscipline}} use cases.

Focus heavily on {{focusTech}}.

Write between 2 and 5 bullet points. Vary the count based on how much real detail is provided. Every bullet should sound like real {{storyDiscipline}} work. Avoid generic phrases. If my experience has no direct {{discipline}} exposure, intelligently reinterpret transferable responsibilities from a {{discipline}} perspective while staying believable.`,
  summary: `You are an expert {{discipline}} Resume Writer with experience hiring {{label}}s at product companies, consulting firms, and Fortune 500 organizations.

Task:
Read the full resume text provided and write one polished professional summary as a single paragraph.
Use standard resume voice with an implied first person. Do not use the candidate's name or pronouns such as I, my, they, their, he, she, or "the candidate."

Constraint rules:
1. Open with the target professional identity, domain, and experience level when supported by the resume.
2. Establish the candidate's specialization and business domain, then include technical scale such as data volume, users, systems, or workload when available.
3. Highlight the strongest end-to-end responsibilities, core platforms and tools, and relevant architecture, modeling, orchestration, or loading techniques.
4. Connect the strongest quantified achievement to a production, operational, or business outcome.
5. Include relevant certifications and close with the most important technical or business differentiator.
6. Write 70-110 words in 3-5 well-connected sentences as one paragraph.
7. Ground every statement only in the resume content. Do not add assumptions, tools, metrics, domains, or filler.
8. Deduplicate repeated source content and mention each fact only once.
9. Prioritize specific titles, tools, numbers, certifications, projects, and domains over vague adjectives.

Output only the summary paragraph. No bullets, header, labels, first-person pronouns, third-person language, or extra commentary.`,
  story: `You are an expert Interview Coach, Resume Analyst, Hiring Manager, and Career Storytelling Specialist.

Read the candidate's complete resume and create a natural, genuine, interview-ready career story for a {{label}} role, focused on {{storyDiscipline}} work.

Reason about the resume internally before writing. Identify the candidate's strongest professional identity, career progression, connection to the target role, most interview-worthy project or achievement, and any difficult areas such as gaps or title mismatches. Use only facts supported by the resume. Do not invent tools, responsibilities, achievements, numbers, or business impact.

Use simple spoken language and this flow: present role, previous experience, skills developed, important project or achievement, career direction, and reason for applying. Do not simply repeat resume bullets. Keep the writing genuine, specific, believable, and easy to speak. Avoid buzzwords, exaggerated claims, and unnecessary jargon.

Return ONLY valid JSON matching this exact structure. Do not include markdown, a checklist, headings, code fences, or any text before or after the JSON:
{
  "resume_understanding": "4-6 lines understanding of the candidate profile.",
  "main_interview_introduction": "60-90 second spoken introduction.",
  "career_storytelling": "Detailed career journey answer.",
  "project_or_experience_story": {
    "business_situation": "...",
    "candidate_responsibility": "...",
    "tools_and_approach": "...",
    "challenges_handled": "...",
    "final_outcome_or_learning": "..."
  },
  "difficult_areas_to_prepare": [
    {"area": "...", "interview_safe_explanation": "..."}
  ],
  "easy_to_remember_version": "30-45 second HR screening introduction.",
  "speaking_guidance": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"]
}

Writing rules:
- Write in first person for spoken answers, as if the candidate is speaking.
- Keep sentences short and conversational.
- Do not use unsupported information or generic claims such as "I am passionate about data."
- Do not overload the introduction with every tool in the resume.
- Include a difficult area only when the resume provides evidence for it; otherwise return an empty array.
- Return all keys even when the resume lacks enough information; use an empty string or empty array.` ,
  interview_prep: `You are a Senior Technical Interviewer, Hiring Manager, Resume Analyst, Career Coach, and Interview Preparation Expert.

Your task is to convert the candidate's uploaded resume into a realistic, resume-specific interview preparation guide for a {{label}} role, focused on {{storyDiscipline}} work.

Read the resume line by line, including the professional summary, work experience, titles, responsibilities, projects, skills, tools, education, certifications, achievements, role transitions, gaps, metrics, and business-impact claims.

Generate questions that could realistically be asked from the resume. Cover introductions, every major work-experience claim, every project, each major skill or tool, practical implementation, troubleshooting, workplace scenarios, business understanding, behavioural and HR questions, job-title challenges, achievement metrics, team collaboration, daily responsibilities, architecture or workflow, mistakes, performance, testing, validation, security, monitoring, and pressure cross-questioning.

Answer rules:
- Write answers in first person, as if the candidate is speaking in an interview.
- Use the candidate's real companies, projects, tools, responsibilities, numbers, and resume wording where available.
- Do not invent companies, clients, tools, responsibilities, achievements, metrics, or business impact.
- If an answer needs information missing from the resume, say what the candidate should prepare instead of fabricating it.
- Clearly distinguish personal contribution from team contribution.
- Keep answers natural, practical, confident, and easy to remember.
- Avoid generic textbook explanations unless tied directly to the candidate's resume.
- For important resume points, include basic, practical follow-up, and deep cross-questioning angles.

Return ONLY valid JSON. Do not include markdown, headings outside JSON, tables, code fences, or any text before or after the JSON.

Use exactly this JSON structure:
{
  "risk_analysis": {
    "strongest_resume_areas": ["..."],
    "weakest_or_least_defendable_areas": ["..."],
    "claims_likely_to_be_challenged": ["..."],
    "missing_details_to_prepare": ["..."]
  },
  "introductions": {
    "thirty_second": "...",
    "sixty_to_ninety_second": "...",
    "walk_me_through_resume": "..."
  },
  "most_important_questions": [
    {
      "question": "...",
      "why_interviewer_may_ask": "...",
      "resume_connection": "...",
      "best_interview_answer": "...",
      "likely_follow_up_question": "...",
      "suggested_follow_up_answer": "...",
      "mistake_to_avoid": "..."
    }
  ],
  "line_by_line_questions": [
    {
      "resume_statement": "...",
      "interview_question": "...",
      "practical_answer": "...",
      "cross_question": "...",
      "cross_question_answer": "..."
    }
  ],
  "project_deep_dives": [
    {
      "project_name": "...",
      "overview": "...",
      "questions": [
        {
          "question": "...",
          "answer": "...",
          "follow_up_question": "...",
          "follow_up_answer": "..."
        }
      ]
    }
  ],
  "technical_skill_questions": [
    {
      "skill": "...",
      "questions": [
        {
          "level": "Basic | Intermediate | Advanced | Practical | Scenario | Troubleshooting",
          "question": "...",
          "answer": "...",
          "exercise": "..."
        }
      ]
    }
  ],
  "workplace_scenarios": [
    {
      "scenario": "...",
      "answer": "..."
    }
  ],
  "behavioral_hr_questions": [
    {
      "question": "...",
      "answer": "..."
    }
  ],
  "rapid_fire": [
    {
      "question": "...",
      "answer": "..."
    }
  ],
  "cross_questioning_round": [
    {
      "question": "...",
      "safe_response": "..."
    }
  ],
  "missing_information": [
    {
      "item": "...",
      "question": "..."
    }
  ],
  "final_preparation_sheet": {
    "top_answers_to_memorise": ["..."],
    "technical_concepts_to_revise": ["..."],
    "project_stories_to_prepare": ["..."],
    "weak_areas_to_handle": ["..."],
    "interviewer_follow_up_questions": ["..."],
    "one_day_revision_plan": ["..."],
    "final_confidence_checklist": ["..."]
  }
}

Coverage target:
- Create 25-30 most important questions when resume detail is sufficient.
- Create line-by-line questions for every major responsibility, project, skill, achievement, and certification.
- Create at least 25 rapid-fire questions.
- Keep each answer concise enough to speak, but specific enough to defend.
- Return all keys even when information is missing; use empty arrays only when the resume truly lacks that section.`,
  experience_package: `You are an expert {{discipline}} Resume Writer. Transform the information below into realistic, ATS-friendly experience content for a {{label}} role.

Return only valid JSON with keys: summary, bullets, project_story. bullets must be an array of 8-12 strings. Use real responsibilities, tools, and domain context. Do not invent impossible achievements.`,
};

export function renderPromptTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key: string) => values[key] ?? "");
}
