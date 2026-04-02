type SvelteSource = {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
};

type SvelteFrame = {
  componentName?: string;
  source?: SvelteSource;
};

type SvelteComponentCandidate = {
  name: string;
  source?: SvelteSource;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function normalizePath(path: string): string {
  return path
    .replace(/^webpack-internal:\/\/\//, "")
    .replace(/^webpack:\/\/\//, "")
    .replace(/^file:\/\//, "")
    .replace(/^https?:\/\/[^/]+\//, "")
    .replace(/^\.\//, "");
}

function formatSource(source?: SvelteSource): string | undefined {
  if (!source?.fileName || !source.lineNumber) return undefined;
  const normalized = normalizePath(source.fileName);
  if (!normalized) return undefined;
  return source.columnNumber ? `${normalized}:${source.lineNumber}:${source.columnNumber}` : `${normalized}:${source.lineNumber}`;
}

function extractFrameMeta(value: unknown): SvelteFrame | null {
  const record = toRecord(value);
  if (!record) return null;

  const source = toRecord(record.source || record.loc || record.location);
  const fileName = typeof source?.file === "string"
    ? source.file
    : typeof source?.filename === "string"
      ? source.filename
      : typeof source?.fileName === "string"
        ? source.fileName
        : undefined;
  const lineNumber = typeof source?.line === "number"
    ? source.line
    : typeof source?.lineNumber === "number"
      ? source.lineNumber
      : undefined;
  const columnNumber = typeof source?.column === "number"
    ? source.column
    : typeof source?.columnNumber === "number"
      ? source.columnNumber
      : undefined;

  const componentName = typeof record.name === "string"
    ? record.name
    : typeof record.componentName === "string"
      ? record.componentName
      : undefined;

  const parsedSource = fileName && typeof lineNumber === "number"
    ? { fileName, lineNumber, columnNumber }
    : undefined;

  if (!componentName && !parsedSource) return null;
  return { componentName, source: parsedSource };
}

function findSvelteFrame(element: HTMLElement): SvelteFrame | null {
  const currentAny = element as unknown as Record<string, unknown>;
  const keys = Object.keys(currentAny);

  for (const key of keys) {
    if (!key.includes("svelte") && !key.includes("Svelte")) continue;
    const meta = extractFrameMeta(currentAny[key]);
    if (meta) return meta;
  }

  const datasetSource = element.dataset?.svelteSource;
  if (datasetSource) {
    const match = datasetSource.match(/^(.*):(\d+)(?::(\d+))?$/);
    if (match) {
      return {
        source: {
          fileName: match[1],
          lineNumber: Number(match[2]),
          columnNumber: match[3] ? Number(match[3]) : undefined
        }
      };
    }
  }

  return null;
}

export function getSvelteSourceLocation(element: HTMLElement): string | undefined {
  let current: HTMLElement | null = element;
  let depth = 0;
  while (current && depth < 12) {
    const frame = findSvelteFrame(current);
    const formatted = formatSource(frame?.source);
    if (formatted) return formatted;
    current = current.parentElement;
    depth += 1;
  }
  return undefined;
}

export function getSvelteComponentHierarchy(element: HTMLElement): string | undefined {
  const seen = new Set<string>();
  const names: string[] = [];

  let current: HTMLElement | null = element;
  let depth = 0;
  while (current && depth < 20) {
    const frame = findSvelteFrame(current);
    if (frame?.componentName && !seen.has(frame.componentName)) {
      seen.add(frame.componentName);
      names.push(frame.componentName);
    }
    current = current.parentElement;
    depth += 1;
  }

  if (names.length === 0) return undefined;
  return names.reverse().map((name) => `<${name}>`).join(" ");
}

export function getSvelteComponentName(element: HTMLElement): string | undefined {
  let current: HTMLElement | null = element;
  let depth = 0;
  while (current && depth < 12) {
    const frame = findSvelteFrame(current);
    if (frame?.componentName) return frame.componentName;
    current = current.parentElement;
    depth += 1;
  }
  return undefined;
}
