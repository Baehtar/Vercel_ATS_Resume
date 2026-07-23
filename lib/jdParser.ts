// lib/jdParser.ts
// Extracts meaningful tech/skill keywords from a raw job description string.
// Pure client-side — no API calls needed.

import { getResumeFullText } from "./atsAnalyzer";
import type { Resume } from "./types";

// ─── Curated tech-term dictionary ────────────────────────────────────────────
// Multi-word phrases are checked first (longest-match), then single tokens.
// All entries are lowercased for matching; display names are Title Case.

const TECH_TERMS: string[] = [
  // Languages
  "Python", "SQL", "Java", "Scala", "R", "Go", "Rust", "C++", "C#", "JavaScript",
  "TypeScript", "Bash", "Shell", "YAML", "JSON", "XML",

  // Data / ML
  "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "LLM",
  "Generative AI", "GenAI", "Agentic AI", "RAG", "Prompt Engineering",
  "LangChain", "Hugging Face", "PyTorch", "TensorFlow", "Keras",
  "Scikit-learn", "Pandas", "NumPy", "Matplotlib", "Seaborn", "Plotly",
  "Jupyter", "A/B Testing", "Statistical Analysis", "Hypothesis Testing",
  "Regression Analysis", "Time Series", "Forecasting", "Cohort Analysis",
  "Segmentation", "EDA", "Feature Engineering", "Model Deployment",
  "MLflow", "Kubeflow", "Vertex AI", "SageMaker",

  // Data Engineering
  "ETL", "ELT", "Data Pipeline", "Data Warehouse", "Data Lake", "Data Lakehouse",
  "Batch Processing", "Stream Processing", "Real-Time Processing",
  "Incremental Load", "SCD", "Data Modeling", "Star Schema",
  "Data Governance", "Schema Design", "Schema Evolution", "Data Quality",
  "Data Lineage", "Orchestration", "Medallion Architecture",
  "Apache Spark", "PySpark", "Spark SQL", "Structured Streaming",
  "Apache Kafka", "Kafka Streams", "Apache Flink", "Apache Airflow",
  "Airflow", "dbt", "Great Expectations",
  "Delta Lake", "Delta Live Tables", "Auto Loader", "ACID Transactions",
  "Parquet", "Avro", "ORC", "Protobuf", "Delta Format",

  // Cloud
  "AWS", "Azure", "GCP", "Google Cloud",
  "Azure Data Factory", "Azure Databricks", "ADLS Gen2",
  "Azure Synapse Analytics", "Azure Key Vault", "Azure Event Hub",
  "Azure DevOps", "Managed Identity", "Azure OpenAI Service",
  "Amazon S3", "Amazon Redshift", "Amazon EMR", "Amazon Glue",
  "AWS Lambda", "AWS Glue", "Amazon Athena", "Amazon Kinesis",
  "BigQuery", "Dataflow", "Pub/Sub", "Cloud Composer",
  "Snowflake", "Databricks", "Redshift",

  // Databases
  "PostgreSQL", "MySQL", "SQL Server", "Oracle", "SQLite",
  "MongoDB", "Cassandra", "DynamoDB", "Redis", "Elasticsearch",
  "HBase", "CouchDB", "Neo4j", "InfluxDB",
  "Hadoop", "HDFS", "Hive", "Pig", "HBase",

  // BI / Visualisation
  "Power BI", "Tableau", "Looker", "Grafana", "Superset",
  "DAX", "Power Query", "DirectQuery", "Row-Level Security",
  "Data Visualization", "Data Storytelling", "Dashboard",
  "KPI", "Metrics", "Business Intelligence", "Reporting",
  "Google Analytics", "Google Data Studio",

  // DevOps / Infra
  "Docker", "Kubernetes", "Terraform", "Helm", "Ansible",
  "CI/CD", "GitHub Actions", "Jenkins", "GitLab CI", "ArgoCD",
  "Git", "Linux", "Unix",

  // Software Engineering
  "REST API", "GraphQL", "gRPC", "Microservices",
  "Event-Driven Architecture", "NoSQL", "OLAP", "OLTP",
  "Distributed Systems", "System Design", "API Design",
  "Unit Testing", "Integration Testing", "TDD",

  // Soft / process
  "Agile", "Scrum", "Jira", "Confluence", "Stakeholder Communication",
  "Data-Driven", "Cross-functional",

  // Certifications / Tools
  "Excel", "Google Sheets", "Spark", "Kafka", "Flink",
  "Window Functions", "CTEs", "Query Optimization",
  "Unity Catalog", "Z-Ordering", "Liquid Clustering", "Time Travel",
];

// Sort longest first so multi-word phrases are matched before their sub-words
const SORTED_TERMS = [...TECH_TERMS].sort((a, b) => b.length - a.length);

// Named products, platforms, libraries, and infrastructure belong in a tools
// group when tailoring a resume. Broader capabilities stay in Skills.
const TOOL_TERMS = new Set(
  [
    "LangChain", "Hugging Face", "PyTorch", "TensorFlow", "Keras", "Scikit-learn",
    "Pandas", "NumPy", "Matplotlib", "Seaborn", "Plotly", "Jupyter", "MLflow",
    "Kubeflow", "Vertex AI", "SageMaker",
    "Apache Spark", "PySpark", "Spark SQL", "Structured Streaming", "Apache Kafka",
    "Kafka Streams", "Apache Flink", "Apache Airflow", "Airflow", "dbt",
    "Great Expectations", "Delta Lake", "Delta Live Tables", "Auto Loader",
    "AWS", "Azure", "GCP", "Google Cloud", "Azure Data Factory", "Azure Databricks",
    "ADLS Gen2", "Azure Synapse Analytics", "Azure Key Vault", "Azure Event Hub",
    "Azure DevOps", "Azure OpenAI Service", "Amazon S3", "Amazon Redshift",
    "Amazon EMR", "Amazon Glue", "AWS Lambda", "AWS Glue", "Amazon Athena",
    "Amazon Kinesis", "BigQuery", "Dataflow", "Pub/Sub", "Cloud Composer",
    "Snowflake", "Databricks", "Redshift",
    "PostgreSQL", "MySQL", "SQL Server", "Oracle", "SQLite", "MongoDB", "Cassandra",
    "DynamoDB", "Redis", "Elasticsearch", "HBase", "CouchDB", "Neo4j", "InfluxDB",
    "Hadoop", "HDFS", "Hive", "Pig",
    "Power BI", "Tableau", "Looker", "Grafana", "Superset", "Google Analytics",
    "Google Data Studio", "Excel", "Google Sheets",
    "Docker", "Kubernetes", "Terraform", "Helm", "Ansible", "GitHub Actions",
    "Jenkins", "GitLab CI", "ArgoCD", "Git", "Jira", "Confluence",
  ].map((term) => term.toLowerCase())
);

// ─── Main extraction function ─────────────────────────────────────────────────

export interface JdParseResult {
  /** All unique tech terms found in the JD, preserving display casing */
  allKeywords: string[];
  /** Keywords already present in the resume text */
  matched: string[];
  /** Keywords in JD but missing from resume */
  missing: string[];
  /** Frequency of each keyword in the JD (for sorting by importance) */
  frequency: Record<string, number>;
}

export function splitJdKeywordsForResume(keywords: string[]): {
  skills: string[];
  tools: string[];
} {
  const skills: string[] = [];
  const tools: string[] = [];

  for (const keyword of keywords) {
    (TOOL_TERMS.has(keyword.toLowerCase()) ? tools : skills).push(keyword);
  }

  return { skills, tools };
}

export function parseJd(jdText: string, resume: Resume): JdParseResult {
  if (!jdText.trim()) {
    return { allKeywords: [], matched: [], missing: [], frequency: {} };
  }

  const jdLower = jdText.toLowerCase();
  const resumeText = getResumeFullText(resume).toLowerCase();

  const frequency: Record<string, number> = {};
  const found = new Set<string>();

  for (const term of SORTED_TERMS) {
    const lower = term.toLowerCase();
    // Count occurrences in JD
    let count = 0;
    let idx = 0;
    while ((idx = jdLower.indexOf(lower, idx)) !== -1) {
      // Word-boundary guard: char before and after must be non-word (or string edge)
      const before = idx === 0 ? " " : jdLower[idx - 1];
      const after = idx + lower.length >= jdLower.length ? " " : jdLower[idx + lower.length];
      const wordChar = /[\w#+]/;
      if (!wordChar.test(before) && !wordChar.test(after)) {
        count++;
      }
      idx += lower.length;
    }
    if (count > 0) {
      found.add(term);
      frequency[term] = count;
    }
  }

  // Sort by frequency desc, then alphabetically
  const allKeywords = [...found].sort((a, b) => {
    const diff = (frequency[b] ?? 0) - (frequency[a] ?? 0);
    return diff !== 0 ? diff : a.localeCompare(b);
  });

  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of allKeywords) {
    const kwLower = kw.toLowerCase();
    // Substring match is fine for resume text (already our own content)
    if (resumeText.includes(kwLower)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }

  return { allKeywords, matched, missing, frequency };
}
