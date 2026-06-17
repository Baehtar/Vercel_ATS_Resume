// lib/projectsDb.ts - Preset project templates for the Resume Builder
// Source of truth is Supabase signup_options (category='projects').
// Falls back to the static list below if Supabase is unreachable.
import type { Project } from "./types";

// ── Static fallback list ─────────────────────────────────────────────────────
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

// ── Runtime cache (populated after first Supabase fetch) ─────────────────────
let _cache: Project[] | null = null;

/**
 * Load projects from Supabase (via the API route) and cache them.
 * Falls back to PROJECT_TEMPLATES if the fetch fails or returns empty.
 * Call this once at the top of any component that uses project presets.
 */
export async function loadProjectPresets(): Promise<Project[]> {
  if (_cache) return _cache;
  try {
    const res = await fetch("/api/admin/signup-options?category=projects");
    const json = await res.json();
    if (Array.isArray(json.items) && json.items.length > 0) {
      _cache = json.items as Project[];
      return _cache;
    }
  } catch {
    // silently fall back
  }
  _cache = PROJECT_TEMPLATES;
  return _cache;
}

// ── Sync helpers (used with the cached list after loadProjectPresets()) ───────
const STATIC_MAP: Record<string, Project> = Object.fromEntries(
  PROJECT_TEMPLATES.map((p) => [p.name, p])
);

export function getProjectNames(): string[] {
  return (_cache ?? PROJECT_TEMPLATES).map((p) => p.name);
}

export function getProjectByName(name: string): Project | undefined {
  const list = _cache ?? PROJECT_TEMPLATES;
  return list.find((p) => p.name === name) ?? STATIC_MAP[name];
}
