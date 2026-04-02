function parseSourceLocation(sourceLocation: string): { filePath: string; line: number; column?: number } | null {
  const trimmed = sourceLocation.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(.*):(\d+)(?::(\d+))?$/);
  if (!match) return null;

  const [, rawPath, rawLine, rawColumn] = match;
  const filePath = rawPath.trim();
  const line = Number(rawLine);
  const column = rawColumn ? Number(rawColumn) : undefined;

  if (!filePath || !Number.isFinite(line) || line <= 0) return null;
  if (column !== undefined && (!Number.isFinite(column) || column <= 0)) return null;

  return { filePath, line, column };
}

function isAbsolutePath(path: string): boolean {
  return path.startsWith("/") || /^[A-Za-z]:[\\/]/.test(path);
}

function resolveFilePath(filePath: string, workspaceRoot?: string): string {
  const trimmedPath = filePath.trim().replace(/^\.\//, "");
  if (isAbsolutePath(trimmedPath)) return trimmedPath;

  const trimmedRoot = workspaceRoot?.trim().replace(/\/$/, "");
  if (!trimmedRoot) return trimmedPath;

  return `${trimmedRoot}/${trimmedPath}`;
}

export function toVSCodeUrl(sourceLocation: string, workspaceRoot?: string): string | null {
  const parsed = parseSourceLocation(sourceLocation);
  if (!parsed) return null;

  const resolvedPath = resolveFilePath(parsed.filePath, workspaceRoot);
  const normalizedPath = resolvedPath.startsWith("/") ? resolvedPath : `/${resolvedPath}`;
  const locationSuffix = parsed.column !== undefined
    ? `${parsed.line}:${parsed.column}`
    : `${parsed.line}`;

  return `vscode://file${encodeURI(normalizedPath)}:${locationSuffix}`;
}

export function openSourceInVSCode(sourceLocation?: string, workspaceRoot?: string): boolean {
  if (typeof window === "undefined" || !sourceLocation) return false;

  const url = toVSCodeUrl(sourceLocation, workspaceRoot);
  if (!url) return false;

  window.location.href = url;
  return true;
}
