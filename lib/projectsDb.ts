// lib/projectsDb.ts - Preset project templates for the Resume Builder
import type { Project } from "./types";

export const PROJECT_TEMPLATES: Project[] = [
  {
    name: "Scalable Cloud Data Lakehouse Pipeline with Medallion Architecture for Retail",
    tech: "Azure Data Factory, Azure SQL, ADLS Gen2, Databricks, PySpark, Delta Lake",
    link: "",
    description:
      "Built an end-to-end ETL/ELT pipeline using ADF, Azure SQL, and ADLS to ingest and manage client data. " +
      "Implemented incremental loading using Lookups, dynamic parameters, and stored procedures for automated " +
      "date tracking decisions. " +
      "Performed Bronze-to-Silver transformations in Databricks (PySpark) including schema enforcement, null " +
      "handling, and deduplication. " +
      "Designed Gold-layer Dim & Fact tables using Delta Lake with SCD Type-1 merge logic for accurate record " +
      "updates. " +
      "Delivered a scalable, production-ready pipeline supporting reporting and analytics.",
  },
];

const PROJECT_MAP: Record<string, Project> = Object.fromEntries(
  PROJECT_TEMPLATES.map((p) => [p.name, p])
);

export function getProjectNames(): string[] {
  return PROJECT_TEMPLATES.map((p) => p.name);
}

export function getProjectByName(name: string): Project | undefined {
  return PROJECT_MAP[name];
}
