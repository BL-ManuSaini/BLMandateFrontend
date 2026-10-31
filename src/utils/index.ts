import { CandidateStatus } from '../types';
import type { MappingStatus, LOIStatus, DriveStatus, MandateStatus, RequirementStatus } from '../types';

// ─── Status color maps ────────────────────────────────────────────────────────
export const CANDIDATE_STATUS_COLOR: Record<CandidateStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  [CandidateStatus.SELECTED]: 'info',
  [CandidateStatus.PROPOSED]: 'secondary',
  [CandidateStatus.MAPPED]: 'primary',
  [CandidateStatus.DISCUSSED]: 'warning',
  [CandidateStatus.LOI_SENT]: 'warning',
  [CandidateStatus.LOI_SIGNED]: 'success',
  [CandidateStatus.CFP_STARTED]: 'success',
  [CandidateStatus.DROPPED]: 'error',
};

export const MAPPING_STATUS_COLOR: Record<MappingStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  Draft: 'default',
  Submitted: 'info',
  'Engineering Review': 'warning',
  'Approved by Eng': 'primary',
  'Confirmed by MIS': 'secondary',
  'In Discussion': 'warning',
  'LOI Issued': 'primary',
  Signed: 'success',
  'CFP Started': 'success',
};

export const LOI_STATUS_COLOR: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  Pending: 'default',
  Sent: 'warning',
  'LOI Sent': 'warning',
  Signed: 'success',
  'LOI Signed': 'success',
  Acknowledged: 'info',
};

export const DRIVE_STATUS_COLOR: Record<DriveStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  planned: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
};

export const MANDATE_STATUS_COLOR: Record<MandateStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  draft: 'default',
  active: 'success',
  on_hold: 'warning',
  closed: 'error',
  cancelled: 'error',
};

export const REQUIREMENT_STATUS_COLOR: Record<RequirementStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  draft: 'default',
  active: 'success',
  on_hold: 'warning',
  fulfilled: 'info',
  cancelled: 'error',
};

// ─── Date formatters ──────────────────────────────────────────────────────────
export const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// ─── ID generation ────────────────────────────────────────────────────────────
export const generateRequirementId = (
  clientShort: string,
  mandateType: string,
  techTag: string,
  intakeTag: string,
  date: string,
  seq?: number | string
) => {
  let dateTag = 'DateTag';
  if (date) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const mon = d.toLocaleString('en-US', { month: 'short' });
      const day = String(d.getDate()).padStart(2, '0');
      dateTag = `${mon}${day}`;
    } else {
      dateTag = date; // fallback if already formatted
    }
  }
  const seqSuffix = seq !== undefined ? `-${seq}` : '';
  return `${clientShort}-${mandateType}-${techTag.replace(/\s+/g, '')}-${intakeTag.replace(/\s+/g, '')}-${dateTag}${seqSuffix}`;
};

export const generateId = () => Math.random().toString(36).slice(2, 10);

// ─── Number helpers ───────────────────────────────────────────────────────────
export const pct = (num: number, den: number) =>
  den === 0 ? 0 : Math.round((num / den) * 100);

export const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);

// ─── Tech stack options ───────────────────────────────────────────────────────
export const TECH_STACKS = [
  'DotNet', 'Java', 'Python', 'React & Frontend',
  'Full Stack', 'Cloud & DevOps', 'Data Engineering',
  'Mobile (React Native)', 'QA & Automation', 'DevSecOps',
];

export const MANDATE_TYPES = ['NEW', 'EXPANSION', 'RENEW', 'REPLACEMENT', 'EXT', 'SUB'];
export const ENGAGEMENT_MODELS = ['FresherISA', 'FresherFixed', 'LateralISA', 'UpSkilling'];
export const INTAKE_TYPES = ['Fresher ISA', 'Lateral', 'Internship', 'Contract'];
export const EXP_LEVELS = ['Fresher', '0-1 Year', '1-2 Years', '2-4 Years'];
export const STREAMS = ['CS', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil'];
export const ALLOCATION_TYPES = ['Primary', 'Secondary'];
export const DISCUSSION_OUTCOMES = ['Interested', 'Not Interested', 'Need Time', 'Unreachable'];

// ─── CSV export ───────────────────────────────────────────────────────────────
export const exportToCSV = <T extends Record<string, unknown>>(data: T[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      const str = Array.isArray(val) ? val.join('; ') : String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
};

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

export interface ParsedCandidateImportRow {
  coeName: string;
  rollNumber: string;
  name: string;
  email: string;
  phone: string;
  graduationYear: number;
  stream: string;
  skills?: string[];
  cgpa?: number;
}

/** Column headers for bulk candidate import (matches POST /candidates/import). */
export const CANDIDATE_IMPORT_CSV_COLUMNS = [
  'Roll Number',
  'Name',
  'Email',
  'Phone',
  'Graduation Year',
  'Stream',
  'Skills',
  'CGPA',
  'COE Name',
] as const;

function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Download a CSV template for bulk import. Opens correctly in Excel and Google Sheets.
 * Required columns: Roll Number, Name, Email, Phone, Graduation Year, Stream, COE Name.
 * Optional columns: Skills, CGPA.
 * COE Name is sent to the API as `coeName`.
 */
export function downloadCandidateImportTemplate(options?: { sampleCoeName?: string }) {
  const sampleCoeName = options?.sampleCoeName ?? 'COE Hyderabad';
  const headerRow = CANDIDATE_IMPORT_CSV_COLUMNS.join(',');
  const sampleRow = [
    '22MCA10045',
    'abc',
    'abc.doe@example.com',
    '9876543210',
    '2025',
    'CSE',
    '"Java,Spring Boot,MySQL"',
    '8.5',
    sampleCoeName,
  ].join(',');
  const csv = `\uFEFF${headerRow}\n${sampleRow}\n`;
  downloadTextFile(csv, 'candidate-import-template.csv', 'text/csv;charset=utf-8;');
}

function normalizeCSVHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^"|"$/g, '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

/** Canonical import keys → accepted normalized header names (includes legacy aliases). */
const IMPORT_COLUMN_ALIASES: Record<string, string[]> = {
  rollnumber: ['rollnumber', 'rollno'],
  name: ['name', 'fullname', 'candidatename'],
  email: ['email', 'emailaddress'],
  phone: ['phone', 'phonenumber', 'mobile'],
  graduationyear: ['graduationyear', 'gradyear', 'passoutyear', 'year', 'graducationyear'],
  stream: ['stream', 'branch', 'department', 'strem'],
  skills: ['skills', 'skill'],
  cgpa: ['cgpa', 'assessmentscore', 'score'],
  coename: ['coename', 'coe'],
};

function findColumnIndex(headers: string[], canonical: string): number {
  const aliases = IMPORT_COLUMN_ALIASES[canonical] ?? [canonical];
  for (const alias of aliases) {
    const index = headers.indexOf(alias);
    if (index !== -1) return index;
  }
  return -1;
}

function formatMissingColumnError(canonical: string): string {
  const labelByCanonical: Record<string, string> = {
    rollnumber: 'Roll Number',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    graduationyear: 'Graduation Year',
    stream: 'Stream',
    coename: 'COE Name',
  };
  const label = labelByCanonical[canonical] ?? canonical;
  const aliases = IMPORT_COLUMN_ALIASES[canonical] ?? [canonical];
  return `Missing required CSV column: ${label} (accepted: ${aliases.join(', ')})`;
}

/** Parse a CSV file into candidate import rows for POST /candidates/import. */
export async function parseCandidateImportCSV(file: File): Promise<ParsedCandidateImportRow[]> {
  const text = (await file.text()).replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one data row');
  }

  const delimiter = lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
  const parseLine = delimiter === ';'
    ? (line: string) => line.split(';').map((v) => v.trim().replace(/^"|"$/g, ''))
    : parseCSVLine;

  const headers = parseLine(lines[0]).map(normalizeCSVHeader);

  const required = ['rollnumber', 'name', 'email', 'phone', 'graduationyear', 'stream', 'coename'] as const;
  for (const col of required) {
    if (findColumnIndex(headers, col) === -1) {
      throw new Error(formatMissingColumnError(col));
    }
  }

  const skillsIdx = findColumnIndex(headers, 'skills');
  const cgpaIdx = findColumnIndex(headers, 'cgpa');

  const colIndex = (canonical: string) => findColumnIndex(headers, canonical);

  return lines.slice(1).map((line, rowNum) => {
    const cols = parseLine(line);
    const get = (canonical: string) => cols[colIndex(canonical)] ?? '';

    const coeName = get('coename').trim();
    const rollNumber = get('rollnumber').trim();
    const name = get('name').trim();
    const email = get('email').trim();
    const phone = get('phone').trim();
    const stream = get('stream').trim();
    const graduationYear = Number(get('graduationyear'));
    const cgpaRaw = cgpaIdx >= 0 ? cols[cgpaIdx] : '';
    const cgpa = cgpaRaw ? Number(cgpaRaw) : undefined;
    const skillsRaw = skillsIdx >= 0 ? cols[skillsIdx] : '';
    const skills = skillsRaw
      ? skillsRaw.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      : undefined;

    if (!rollNumber) {
      throw new Error(`Row ${rowNum + 2}: Roll Number is required`);
    }
    if (!coeName) {
      throw new Error(`Row ${rowNum + 2}: COE Name is required`);
    }
    if (name.length < 2) {
      throw new Error(`Row ${rowNum + 2}: Name must be at least 2 characters`);
    }
    if (!email.includes('@')) {
      throw new Error(`Row ${rowNum + 2}: Invalid email format`);
    }
    if (phone.length < 10) {
      throw new Error(`Row ${rowNum + 2}: Invalid phone number`);
    }
    if (!stream) {
      throw new Error(`Row ${rowNum + 2}: Stream is required`);
    }
    if (!Number.isFinite(graduationYear) || graduationYear < 2020 || graduationYear > 2030) {
      throw new Error(`Row ${rowNum + 2}: Graduation Year must be between 2020 and 2030`);
    }
    if (cgpa !== undefined && Number.isFinite(cgpa) && (cgpa < 0 || cgpa > 10)) {
      throw new Error(`Row ${rowNum + 2}: CGPA must be between 0 and 10`);
    }

    const row: ParsedCandidateImportRow = {
      coeName,
      rollNumber,
      name,
      email,
      phone,
      graduationYear,
      stream,
    };

    if (skills?.length) row.skills = skills;
    if (cgpa !== undefined && Number.isFinite(cgpa)) row.cgpa = cgpa;

    return row;
  });
};

export const getSafeString = (val: any, fallback = ''): string => {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    const clean = val.map(item => getSafeString(item)).filter(Boolean).join(', ');
    return clean || fallback;
  }
  if (val && typeof val === 'object') return val.label || val.name || val.clientName || val.title || val.id || fallback;
  return fallback;
};

export const getSafeArrayString = (val: any, fallback = ''): string => {
  if (Array.isArray(val)) {
    return val.map(v => getSafeString(v)).filter(Boolean).join(', ');
  }
  return getSafeString(val, fallback);
};

export const formatCsvCell = (val: any): string => {
  if (val === null || val === undefined) return '""';
  if (typeof val === 'number' || typeof val === 'boolean') return `"${val}"`;
  if (typeof val === 'string') {
    const clean = val.replace(/"/g, '""').trim();
    return `"${clean}"`;
  }
  if (Array.isArray(val)) {
    const cleanItems = val.map(item => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') return item.label || item.name || item.clientName || item.id || '';
      return String(item);
    }).filter(Boolean).join(', ');
    return `"${cleanItems.replace(/"/g, '""')}"`;
  }
  if (typeof val === 'object') {
    const label = val.label || val.name || val.clientName || val.id || '';
    return `"${String(label).replace(/"/g, '""')}"`;
  }
  return `"${String(val).replace(/"/g, '""')}"`;
};

const KNOWN_ACRONYMS = new Set(['AI', 'ML', 'COE', 'MIS', 'LOI', 'ID', 'API', 'CSV', 'PDF', 'HR', 'CFP', 'URL', 'UI', 'UX', 'SQL']);

export const toTitleCase = (str?: string | null): string => {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (!trimmed) return '';

  return trimmed
    .split(/\s+/)
    .map((word) => {
      return word
        .split('-')
        .map((subWord) => {
          const upper = subWord.toUpperCase();
          if (KNOWN_ACRONYMS.has(upper)) return upper;
          if (subWord.length <= 1) return subWord.toUpperCase();
          return subWord.charAt(0).toUpperCase() + subWord.slice(1).toLowerCase();
        })
        .join('-');
    })
    .join(' ');
};

/**
 * Filters candidates to return only available candidates (isActive === false and not soft-deleted)
 * Used across selection modals/dropdowns in other tables (Mappings, Discussions, LOI, etc.)
 */
export const filterAvailableCandidates = <T extends { isActive?: boolean; isDeleted?: boolean }>(candidates: T[]): T[] => {
  if (!Array.isArray(candidates)) return [];
  return candidates.filter((c) => c.isActive === false && c.isDeleted !== true);
};
