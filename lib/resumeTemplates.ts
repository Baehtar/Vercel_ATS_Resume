// lib/resumeTemplates.ts - HTML layout templates, print styles, and default schemas
// Ported from resume_templates.py
import type { Resume, TemplateId } from "./types";

/** HTML-escape a resume field value to prevent XSS in the preview iframe. */
function _safe(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** Ensure a link has exactly one https:// prefix. */
function _normalizeUrl(link: string): string {
  if (!link) return "";
  link = link.trim();
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  return `https://${link}`;
}

export function getDefaultSample(): Resume {
  return {
    personal: {
      fullName: "Alex Mercer",
      headline: "Software Engineer | Full Stack Development | Cloud Architecture",
      email: "alex.mercer@email.com",
      phone: "(555) 019-2834",
      location: "San Francisco, CA",
      linkedin: "linkedin.com/in/alexmercer",
      github: "github.com/alexmercer",
      website: "alexmercer.dev",
    },
    summary:
      "Results-driven Software Engineer with 4+ years of experience designing, developing, and deploying scalable full-stack web applications. Expert in React, Node.js, and cloud architectures. Proven track record of spearheading cross-functional teams to automate workflows, optimize API response times by 40%, and deliver secure, high-performance customer portals.",
    experience: [
      {
        company: "InnovateTech Solutions",
        role: "Senior Full Stack Engineer",
        location: "San Francisco, CA",
        startDate: "2023-03",
        endDate: "Present",
        bullets: [
          "Spearheaded development of a high-traffic B2B SaaS platform using React, TypeScript, and Node.js, increasing active monthly users by 35%.",
          "Orchestrated migration of legacy services to AWS ECS microservices, reducing infrastructure costs by 22% and improving system uptime to 99.99%.",
          "Optimized SQL database query execution plans and implemented Redis caching, lowering average API latency from 450ms to 120ms.",
          "Mentored 4 junior engineers on clean code practices, Git workflows, and CI/CD pipelines, increasing team velocity by 18%.",
        ],
      },
      {
        company: "Nexus Digital Group",
        role: "Software Engineer II",
        location: "Austin, TX",
        startDate: "2021-06",
        endDate: "2023-02",
        bullets: [
          "Designed and implemented interactive dashboards and charts using React and D3.js, boosting customer engagement metrics by 25%.",
          "Automated unit and integration testing suites utilizing Jest and Cypress, raising overall test coverage from 60% to 92% and preventing regression bugs.",
          "Collaborated closely with product managers and UX designers to build responsive, accessible web pages conforming to WCAG 2.1 compliance.",
        ],
      },
    ],
    education: [
      {
        school: "University of California, Berkeley",
        degree: "Bachelor of Science in Computer Science",
        location: "Berkeley, CA",
        date: "2017-09 to 2021-05",
        details: "GPA: 3.82/4.0. Relevant coursework: Data Structures, Algorithms, Databases.",
      },
    ],
    projects: [
      {
        name: "CloudScale Task Manager",
        tech: "React, Node.js, PostgreSQL, Docker",
        link: "github.com/alexmercer/cloudscale",
        description:
          "A secure, dockerized collaborative project workspace tool. Built real-time notifications via WebSockets and integrated OAuth2 authentication.",
      },
      {
        name: "NeuroText NLP Tool",
        tech: "Python, Flask, TensorFlow, JavaScript",
        link: "github.com/alexmercer/neurotext",
        description:
          "An AI-powered client text analyzer that extracts semantic keywords and summarizes text. Processed over 10,000 requests monthly.",
      },
    ],
    skills: [
      {
        category: "Languages & Frameworks",
        list: "JavaScript, TypeScript, Python, HTML5, SQL, React, Node.js, Express.js",
      },
      {
        category: "Cloud & Dev Tools",
        list: "AWS, Docker, PostgreSQL, Redis, Git, GitHub, REST APIs, GraphQL, CI/CD",
      },
      {
        category: "Methodologies",
        list: "Agile, Scrum, Test-Driven Development (TDD), Responsive Web Design",
      },
    ],
    certifications: [
      {
        name: "AWS Certified Solutions Architect – Associate",
        issuer: "Amazon Web Services",
        date: "2024-04",
      },
      { name: "Certified ScrumMaster (CSM)", issuer: "Scrum Alliance", date: "2022-11" },
    ],
  };
}

export function getEmptySchema(): Resume {
  return {
    personal: {
      fullName: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      website: "",
    },
    summary: "",
    experience: [],
    education: [],
    projects: [],
    skills: [
      { category: "Technical Skills", list: "" },
      { category: "Tools & Methodologies", list: "" },
    ],
    certifications: [],
  };
}

export function getIdealTemplate(targetRole: string): Resume {
  const common: Resume = {
    personal: {
      fullName: "Your Name",
      headline: "Data Analyst | Business Intelligence | Data Visualization",
      email: "your.email@example.com",
      phone: "+91 98765 43210",
      location: "Bengaluru, India",
      linkedin: "linkedin.com/in/yourname",
      github: "github.com/yourname",
      website: "yourname.dev",
    },
    summary: "",
    experience: [],
    education: [
      {
        school: "Your University",
        degree: "Bachelor of Technology in Computer Science",
        location: "Bengaluru, India",
        date: "2018-08 to 2022-05",
        details:
          "GPA: 8.7/10. Relevant coursework: Databases, Statistics, Data Structures, Cloud Computing.",
      },
    ],
    projects: [],
    skills: [],
    certifications: [
      { name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", date: "2024-03" },
      { name: "SQL for Data Science", issuer: "Coursera", date: "2023-11" },
    ],
  };

  if (targetRole === "data_analyst") {
    common.summary =
      "Data Analyst with 3+ years of experience translating complex datasets into actionable business insights. Proficient in SQL, Python, Excel, Tableau, and Power BI, with hands-on expertise in data cleaning, statistical analysis, A/B testing, KPI reporting, and stakeholder communication. Automated reporting workflows and built dashboards that improved decision-making speed by 35%.";
    common.experience = [
      {
        company: "Example Analytics Pvt. Ltd.",
        role: "Data Analyst",
        location: "Bengaluru, India",
        startDate: "2023-01",
        endDate: "Present",
        bullets: [
          "Analyzed customer behavior using SQL, Python, Pandas, and NumPy, identifying retention opportunities that increased repeat purchases by 14%.",
          "Built Tableau and Power BI dashboards for 20+ KPIs, reducing weekly reporting time by 65% and improving stakeholder visibility.",
          "Evaluated A/B tests with hypothesis testing and regression analysis, enabling product teams to improve onboarding conversion by 11%.",
          "Automated Excel and Python reporting workflows, saving 18 analyst hours per month and improving data accuracy.",
        ],
      },
      {
        company: "Example Retail Technologies",
        role: "Junior Data Analyst",
        location: "Pune, India",
        startDate: "2022-06",
        endDate: "2022-12",
        bullets: [
          "Cleaned and validated 500K+ transaction records for exploratory data analysis and monthly business intelligence reporting.",
          "Presented funnel analysis, cohort analysis, and customer segmentation findings to marketing stakeholders, supporting a 9% increase in campaign ROI.",
        ],
      },
    ];
    common.projects = [
      {
        name: "E-commerce Sales Intelligence Dashboard",
        tech: "SQL, Python, Pandas, Tableau",
        link: "github.com/yourname/sales-dashboard",
        description:
          "Built an interactive dashboard for revenue, customer segmentation, cohort analysis, and KPI tracking. Cleaned 100K+ records and delivered data storytelling insights for product and marketing teams.",
      },
      {
        name: "Customer Churn Analysis",
        tech: "Python, NumPy, Seaborn, Scikit-learn",
        link: "github.com/yourname/churn-analysis",
        description:
          "Performed EDA, correlation analysis, and regression modeling to identify churn drivers and recommend targeted retention strategies.",
      },
    ];
    common.skills = [
      {
        category: "Analytics",
        list: "SQL, Python, Excel, Pandas, NumPy, Statistical Analysis, A/B Testing, Hypothesis Testing, Regression Analysis, EDA",
      },
      {
        category: "Visualization & BI",
        list: "Tableau, Power BI, Looker, Data Visualization, Dashboard Design, KPI Reporting, Data Storytelling",
      },
      {
        category: "Business Analysis",
        list: "Business Intelligence, Product Analytics, Funnel Analysis, Cohort Analysis, Segmentation, Stakeholder Communication, Google Analytics",
      },
    ];
    return common;
  }

  // Default: data_engineer
  common.personal.headline = "Data Engineer | Data Pipelines | ETL and Cloud Platforms";
  common.summary =
    "Data Engineer with 3+ years of experience designing scalable ETL and ELT data pipelines, data warehouses, and cloud-based analytics platforms. Proficient in Python, SQL, Apache Spark, Apache Kafka, Airflow, AWS, Snowflake, and dbt. Engineered reliable batch and stream processing systems that reduced pipeline latency by 45% while improving data quality and observability.";
  common.experience = [
    {
      company: "Example Data Platforms Pvt. Ltd.",
      role: "Data Engineer",
      location: "Bengaluru, India",
      startDate: "2023-01",
      endDate: "Present",
      bullets: [
        "Engineered ETL and ELT data pipelines using Python, SQL, Apache Spark, and Airflow to process 15M+ records daily with 99.9% reliability.",
        "Designed a Snowflake data warehouse and dbt transformation models, reducing analytics query time by 42% and improving schema consistency.",
        "Built Apache Kafka stream processing workflows on AWS, cutting data availability latency from 60 minutes to under 10 minutes.",
        "Implemented automated data quality checks, monitoring, and CI/CD with Docker and GitHub Actions, reducing production incidents by 30%.",
      ],
    },
    {
      company: "Example Cloud Solutions",
      role: "Junior Data Engineer",
      location: "Hyderabad, India",
      startDate: "2022-06",
      endDate: "2022-12",
      bullets: [
        "Developed Python and SQL ingestion jobs for PostgreSQL, REST API, and S3 data sources, automating daily batch processing workflows.",
        "Optimized data models and Spark jobs for a cloud data lake, lowering processing costs by 18% while maintaining data governance standards.",
      ],
    },
  ];
  common.projects = [
    {
      name: "Real-Time Analytics Pipeline",
      tech: "Python, Kafka, Spark, Airflow, AWS, Docker",
      link: "github.com/yourname/realtime-data-pipeline",
      description:
        "Architected an event-driven data pipeline that ingests, validates, and transforms streaming events into an analytics-ready data lake with monitoring and data quality checks.",
    },
    {
      name: "Cloud Data Warehouse",
      tech: "SQL, Snowflake, dbt, PostgreSQL, Terraform",
      link: "github.com/yourname/cloud-data-warehouse",
      description:
        "Designed dimensional data models and reusable dbt transformations for a Snowflake warehouse. Added CI/CD validation, lineage documentation, and automated tests.",
    },
  ];
  common.skills = [
    {
      category: "Data Engineering",
      list: "Python, SQL, ETL, ELT, Data Pipeline, Data Modeling, Schema Design, Batch Processing, Stream Processing, Data Quality",
    },
    {
      category: "Platforms & Tools",
      list: "Apache Spark, Apache Kafka, Airflow, Snowflake, dbt, PostgreSQL, MongoDB, Redis, Docker, Kubernetes, Terraform",
    },
    {
      category: "Cloud & DevOps",
      list: "AWS, Azure, GCP, Data Warehouse, Data Lake, Databricks, CI/CD, GitHub Actions, Data Governance, Data Lineage",
    },
  ];
  return common;
}

interface LayoutConfig {
  font_family: string;
  font_title: string;
  accent_color: string;
  border_color: string;
  header_alignment: string;
  order: string[];
}

export function generateResumeHtml(data: Resume, templateId: string): string {
  const personal = data.personal || ({} as Resume["personal"]);
  const summary = data.summary || "";
  const experience = data.experience || [];
  const education = data.education || [];
  const projects = data.projects || [];
  const skills = data.skills || [];
  const certifications = data.certifications || [];

  // Contact items
  const contactParts: string[] = [];
  if (personal.phone) contactParts.push(_safe(personal.phone));
  if (personal.email)
    contactParts.push(`<a href="mailto:${_safe(personal.email)}">${_safe(personal.email)}</a>`);
  if (personal.location) contactParts.push(_safe(personal.location));
  if (personal.linkedin) contactParts.push(_safe(personal.linkedin));
  if (personal.github) contactParts.push(_safe(personal.github));
  if (personal.website) contactParts.push(_safe(personal.website));
  const contactHtml = contactParts.join(" | ");

  // 1. Experience
  let experienceHtml = "";
  let experienceInner = "";
  if (experience.length) {
    const expItems = experience
      .map((exp) => {
        const bulletsHtml = (exp.bullets || [])
          .filter((b) => b.trim())
          .map((b) => `<li>${_safe(b)}</li>`)
          .join("");
        const bulletsList = bulletsHtml
          ? `<ul class="resume-bullets">${bulletsHtml}</ul>`
          : "";
        return `
                <div class="resume-item">
                    <table class="item-table">
                        <tr>
                            <td class="company-name"><strong>${_safe(exp.company)}</strong></td>
                            <td class="item-date" align="right">${_safe(exp.startDate)} – ${_safe(exp.endDate)}</td>
                        </tr>
                        <tr>
                            <td class="role-title"><em>${_safe(exp.role)}</em></td>
                            <td class="item-location" align="right">${_safe(exp.location)}</td>
                        </tr>
                    </table>
                    ${bulletsList}
                </div>`;
      })
      .join("");
    experienceInner = expItems;
    experienceHtml = `
            <div class="resume-section">
                <h2 class="section-title">WORK EXPERIENCE</h2>
                ${expItems}
            </div>`;
  }

  // 2. Education
  let educationHtml = "";
  let educationInner = "";
  if (education.length) {
    const eduItems = education
      .map((edu) => {
        const detailsHtml = edu.details
          ? `<p class="edu-details">${_safe(edu.details)}</p>`
          : "";
        return `
                <div class="resume-item">
                    <table class="item-table">
                        <tr>
                            <td class="school-name"><strong>${_safe(edu.school)}</strong></td>
                            <td class="item-date" align="right">${_safe(edu.date)}</td>
                        </tr>
                        <tr>
                            <td class="degree-title"><em>${_safe(edu.degree)}</em></td>
                            <td class="item-location" align="right">${_safe(edu.location)}</td>
                        </tr>
                    </table>
                    ${detailsHtml}
                </div>`;
      })
      .join("");
    educationInner = eduItems;
    educationHtml = `
            <div class="resume-section">
                <h2 class="section-title">EDUCATION</h2>
                ${eduItems}
            </div>`;
  }

  // 3. Projects
  let projectsHtml = "";
  let projectsInner = "";
  if (projects.length) {
    const projItems = projects
      .map((proj) => {
        const techSpan = proj.tech
          ? `<span class="project-tech">[${_safe(proj.tech)}]</span>`
          : "";
        let linkHtml = "";
        if (proj.link) {
          const normalized = _normalizeUrl(proj.link);
          linkHtml = `<a href='${normalized}' target='_blank'>${_safe(proj.link)}</a>`;
        }
        return `
                <div class="resume-item">
                    <table class="item-table">
                        <tr>
                            <td class="project-name"><strong>${_safe(proj.name)}</strong> ${techSpan}</td>
                            <td class="project-link" align="right">${linkHtml}</td>
                        </tr>
                    </table>
                    <p class="project-desc">${_safe(proj.description)}</p>
                </div>`;
      })
      .join("");
    projectsInner = projItems;
    projectsHtml = `
            <div class="resume-section">
                <h2 class="section-title">PROJECTS</h2>
                ${projItems}
            </div>`;
  }

  // 4. Skills
  let skillsHtml = "";
  let skillsInner = "";
  const activeSkills = skills.filter(
    (s) => (s.category || "").trim() && (s.list || "").trim()
  );
  if (activeSkills.length) {
    const skillRows = activeSkills
      .map(
        (s) => `
                <div class="skill-category-row">
                    <strong>${_safe(s.category)}:</strong> ${_safe(s.list)}
                </div>`
      )
      .join("");
    skillsInner = `<div class="skills-block">${skillRows}</div>`;
    skillsHtml = `
            <div class="resume-section">
                <h2 class="section-title">SKILLS</h2>
                <div class="skills-block">
                    ${skillRows}
                </div>
            </div>`;
  }

  // 5. Certifications
  let certificationsHtml = "";
  let certificationsInner = "";
  if (certifications.length) {
    const certRows = certifications
      .map(
        (cert) => `
                <div class="cert-row">
                    <strong>${_safe(cert.name)}</strong>
                </div>`
      )
      .join("");
    certificationsInner = `<div class="certifications-block">${certRows}</div>`;
    certificationsHtml = `
            <div class="resume-section">
                <h2 class="section-title">CERTIFICATIONS</h2>
                <div class="certifications-block">
                    ${certRows}
                </div>
            </div>`;
  }

  // 6. Summary
  let summaryHtml = "";
  let summaryInner = "";
  if (summary.trim()) {
    summaryInner = `<p class="summary-text">${_safe(summary)}</p>`;
    summaryHtml = `
            <div class="resume-section">
                <h2 class="section-title">SUMMARY</h2>
                <p class="summary-text">${_safe(summary)}</p>
            </div>`;
  }

  const sectionMap: Record<string, string> = {
    summary: summaryHtml,
    experience: experienceHtml,
    education: educationHtml,
    projects: projectsHtml,
    skills: skillsHtml,
    certifications: certificationsHtml,
  };

  const layouts: Record<string, LayoutConfig> = {
    modern: {
      font_family: "Helvetica, Arial, sans-serif",
      font_title: "Helvetica, Arial, sans-serif",
      accent_color: "#1a365d",
      border_color: "#cbd5e1",
      header_alignment: "center",
      order: ["summary", "experience", "education", "projects", "skills", "certifications"],
    },
    professional: {
      font_family: "Helvetica, Arial, sans-serif",
      font_title: "Helvetica, Arial, sans-serif",
      accent_color: "#111827",
      border_color: "#111827",
      header_alignment: "left",
      order: ["summary", "skills", "experience", "projects", "education", "certifications"],
    },
    graduate: {
      font_family: "Helvetica, Arial, sans-serif",
      font_title: "Helvetica, Arial, sans-serif",
      accent_color: "#1d4ed8",
      border_color: "#93c5fd",
      header_alignment: "left",
      order: ["summary", "education", "projects", "skills", "experience", "certifications"],
    },
    executive: {
      font_family: "'Times New Roman', Times, serif",
      font_title: "'Times New Roman', Times, serif",
      accent_color: "#111111",
      border_color: "#222222",
      header_alignment: "left",
      order: ["summary", "experience", "skills", "education", "projects", "certifications"],
    },
    twocolumn: {
      font_family: "'Times New Roman', Georgia, serif",
      font_title: "Calibri, 'Segoe UI', Helvetica, Arial, sans-serif",
      accent_color: "#33697a",
      border_color: "#000000",
      header_alignment: "left",
      order: ["summary", "experience", "projects", "skills", "education", "certifications"],
    },
  };

  const sectionTitles: Record<string, string> = {
    summary: "SUMMARY",
    experience: "WORK EXPERIENCE",
    projects: "PROJECTS",
    skills: "SKILLS",
    education: "EDUCATION",
    certifications: "CERTIFICATIONS",
  };
  const sectionInnerMap: Record<string, string> = {
    summary: summaryInner,
    experience: experienceInner,
    education: educationInner,
    projects: projectsInner,
    skills: skillsInner,
    certifications: certificationsInner,
  };

  const layout = layouts[templateId] || layouts.modern;
  const isTwoColumn = templateId === "twocolumn";
  const sectionsHtml = isTwoColumn
    ? `<table class="tc-table">${layout.order
        .filter((key) => (sectionInnerMap[key] || "").trim())
        .map(
          (key) => `
            <tr class="tc-row">
                <td class="tc-label">${sectionTitles[key]}:</td>
                <td class="tc-content">${sectionInnerMap[key]}</td>
            </tr>`
        )
        .join("")}</table>`
    : layout.order.map((key) => sectionMap[key]).join("");
  const headlineHtml = personal.headline
    ? `<div class="professional-headline">${_safe(personal.headline)}</div>`
    : "";
  const primaryColor = "#111111";

  return `
    <html>
    <head>
        <meta charset="utf-8" />
        <style>
            @page {
                size: a4;
                margin: 15mm 15mm 15mm 15mm;
            }
            * { box-sizing: border-box; }
            body {
                font-family: ${layout.font_family};
                color: ${primaryColor};
                line-height: 1.4;
                font-size: 9.5pt;
                background-color: #ffffff;
                margin: 0;
                padding: 18mm 15mm;
            }
            .resume-header {
                text-align: ${layout.header_alignment};
                margin-bottom: 12pt;
            }
            .user-name {
                font-family: ${layout.font_title};
                font-weight: bold;
                font-size: 22pt;
                margin: 0 0 4pt 0;
                color: ${layout.accent_color};
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .contact-info { font-size: 9pt; color: #333333; }
            .professional-headline {
                color: ${layout.accent_color};
                font-size: 10pt;
                font-weight: bold;
                margin: -1pt 0 3pt 0;
            }
            .contact-info a { color: #111111; text-decoration: none; }
            .resume-section { margin-top: 10pt; }
            .section-title {
                font-family: ${layout.font_title};
                font-weight: bold;
                font-size: 10.5pt;
                border-bottom: 1px solid ${layout.border_color};
                padding-bottom: 2pt;
                margin: 0 0 6pt 0;
                letter-spacing: 0.8px;
                color: ${layout.accent_color};
            }
            .resume-item { margin-bottom: 6pt; }
            .item-table { width: 100%; margin-bottom: 2pt; border-collapse: collapse; }
            .item-table td { padding: 0; font-size: 9.5pt; vertical-align: top; }
            .company-name, .school-name, .project-name { font-weight: bold; }
            .item-date, .cert-date { color: #333333; }
            .item-location, .role-title, .degree-title { font-size: 9pt; }
            .summary-text, .edu-details, .project-desc {
                font-size: 9.2pt;
                margin: 0 0 3pt 0;
                text-align: justify;
            }
            .resume-bullets { margin: 0; padding-left: 14pt; }
            .resume-bullets li { font-size: 9.2pt; margin-bottom: 2pt; list-style-type: disc; }
            .skills-block, .certifications-block { font-size: 9.2pt; }
            .skill-category-row { margin-bottom: 2pt; }
            .project-tech { font-size: 8.5pt; color: #555555; font-weight: normal; }
            body.layout-professional .resume-header {
                border-bottom: 2px solid ${layout.border_color};
                padding-bottom: 6pt;
            }
            body.layout-professional .section-title { border-bottom-width: 2px; }
            body.layout-graduate .user-name { font-size: 20pt; text-transform: none; }
            body.layout-graduate .section-title { font-size: 10pt; }
            body.layout-executive .user-name { font-size: 24pt; letter-spacing: 0; }

            /* Two-column (label on left, content on right) */
            body.layout-twocolumn { padding: 16mm 14mm; }
            body.layout-twocolumn .user-name {
                text-transform: none;
                font-size: 21pt;
                letter-spacing: 0;
            }
            body.layout-twocolumn .resume-header {
                border-bottom: 1.5px solid #000000;
                padding-bottom: 6pt;
                margin-bottom: 0;
            }
            body.layout-twocolumn .professional-headline { font-weight: normal; }
            .tc-table { width: 100%; border-collapse: collapse; }
            .tc-row { border-bottom: 1px solid #000000; }
            .tc-label {
                width: 23%;
                vertical-align: top;
                padding: 8pt 10pt 8pt 0;
                font-family: ${layout.font_title};
                font-weight: bold;
                font-size: 10.5pt;
                letter-spacing: 0.5px;
                color: ${layout.accent_color};
            }
            .tc-content {
                vertical-align: top;
                padding: 8pt 0;
                font-size: 9.3pt;
            }
            .tc-content .resume-item:last-child { margin-bottom: 0; }
            body.layout-twocolumn .summary-text { text-align: left; }
        </style>
    </head>
    <body class="layout-${templateId}">
        <div class="resume-header">
            <h1 class="user-name">${_safe(personal.fullName) || "Your Name"}</h1>
            ${headlineHtml}
            <div class="contact-info">
                ${contactHtml}
            </div>
        </div>
        ${sectionsHtml}
    </body>
    </html>
    `;
}

export const TEMPLATE_OPTIONS: Record<TemplateId, string> = {
  modern: "Modern",
  professional: "Professional",
  graduate: "Graduate / Fresher",
  executive: "Executive",
  twocolumn: "Two-Column (Classic)",
};
