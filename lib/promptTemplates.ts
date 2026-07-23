export type PromptKey = "experience" | "summary" | "story" | "experience_package";

export const PROMPT_LABELS: Record<PromptKey, string> = {
  experience: "Experience Bullets",
  summary: "Recruiter Summary",
  story: "Interview Story",
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
2. Describe the strongest responsibilities and quantified achievement or business impact.
3. Include relevant certifications, then close with the most important skills, tools, or business differentiator.
4. Write 70-110 words in 3-5 well-connected sentences as one paragraph.
5. Ground every statement only in the resume content. Do not add assumptions or filler.
6. Prioritize specific titles, tools, numbers, certifications, projects, and domains over vague adjectives.

Output only the summary paragraph. No bullets, header, labels, first-person pronouns, third-person language, or extra commentary.`,
  story: `You are a senior technical interview coach who has helped hundreds of candidates land Data Engineering and Data Analyst roles at top companies.

Your task is to take the candidate's resume content below and craft an authentic, compelling INTERVIEW STORY they can tell when asked questions like "Tell me about yourself," "Walk me through this project," or "Tell me about a challenge you faced." The candidate is targeting a {{label}} role, so frame the story around {{storyDiscipline}} work.

### Rules
1. Do NOT just restate the resume bullets. Build a narrative with a clear beginning, challenge, action, and outcome (STAR-style, but conversational, not robotic).
2. Make it sound like something a real person would say out loud in an interview, not a written document.
3. Highlight a specific moment of ownership, problem-solving, or initiative that makes the candidate memorable.
4. Include one believable technical or business obstacle they overcame and how they overcame it.
5. Keep it grounded in the candidate's actual experience. Do not invent achievements that contradict the resume.
6. End with a brief reflection on what they learned or how it shaped their approach to {{storyDiscipline}} work.
7. Write in first person, as if the candidate is speaking.
8. Keep it to 150-220 words - long enough to be substantial, short enough to say in under 90 seconds.
9. Avoid generic phrases like "I'm passionate about data" or "I love solving problems." Make it specific and concrete.
10. If multiple experience entries exist, choose the most compelling/relevant one to build the story around, but you may briefly reference others for context.

Return ONLY valid JSON with this structure:
{"story_title":"A short 4-6 word title for this story","story":"The full first-person interview story (150-220 words)","key_talking_points":["point 1","point 2","point 3"],"follow_up_tip":"One sentence tip on how to handle a likely follow-up question about this story"}`,
  experience_package: `You are an expert {{discipline}} Resume Writer. Transform the information below into realistic, ATS-friendly experience content for a {{label}} role.

Return only valid JSON with keys: summary, bullets, project_story. bullets must be an array of 8-12 strings. Use real responsibilities, tools, and domain context. Do not invent impossible achievements.`,
};

export function renderPromptTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key: string) => values[key] ?? "");
}
