import * as path from 'path';

/**
 * Validates that a given relative path, when resolved against a root directory,
 * does not point to a location outside of that root directory. This prevents
 * path traversal attacks (e.g., '../../etc/passwd').
 *
 * @param rootDir - The absolute path to the workspace or safe root directory.
 * @param relativePath - The user-provided relative path.
 * @returns The resolved, absolute, and normalized path if it is safe.
 * @throws An error if the path is outside the root directory or input is invalid.
 */
export function safePath(rootDir: string, relativePath: string): string {
  // Input validation
  if (!rootDir || typeof rootDir !== 'string') {
    throw new Error('Root directory must be a non-empty string.');
  }
  if (!relativePath || typeof relativePath !== 'string') {
    throw new Error('Relative path must be a non-empty string.');
  }

  // Null byte injection protection
  if (rootDir.includes('\0')) {
    throw new Error('Path contains null byte: root directory is invalid.');
  }
  if (relativePath.includes('\0')) {
    throw new Error('Path contains null byte: relative path is invalid.');
  }

  // Block absolute paths, drive-letter paths and UNC/device style paths.
  if (path.isAbsolute(relativePath) || /^[a-zA-Z]:/.test(relativePath) || /^[/\\]{2}/.test(relativePath)) {
    throw new Error('Relative path must not be absolute or device-qualified.');
  }

  const segments = relativePath.split(/[\\/]+/).filter(Boolean);
  if (segments.some((segment) => segment === '..')) {
    throw new Error(`Path traversal detected. Access to '${relativePath}' is denied.`);
  }

  const resolvedRoot = path.resolve(rootDir);
  const resolvedPath = path.resolve(resolvedRoot, ...segments);
  const normalizedPath = path.normalize(resolvedPath);

  // Ensure the resolved path is still within the root directory.
  // We check if it starts with the root path followed by a path separator
  // to prevent cases like '/root/dir' matching '/root/directory'.
  // On Windows, paths are case-insensitive.
  const safeRoot = process.platform === 'win32' ? resolvedRoot.toLowerCase() : resolvedRoot;
  const safePathCandidate = process.platform === 'win32' ? normalizedPath.toLowerCase() : normalizedPath;
  const rootPrefix = safeRoot.endsWith(path.sep) ? safeRoot : safeRoot + path.sep;
  const isSafe = safePathCandidate === safeRoot || safePathCandidate.startsWith(rootPrefix);

  if (!isSafe) {
    throw new Error(`Path traversal detected. Access to '${relativePath}' is denied.`);
  }

  return normalizedPath;
}
