import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { safePath } from '../safe-path';

describe('safePath', () => {
  let testRoot: string;

  beforeEach(() => {
    testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'safepath-test-'));
    fs.mkdirSync(path.join(testRoot, 'src'));
    fs.mkdirSync(path.join(testRoot, 'tests'));
  });

  afterEach(() => {
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true, force: true });
    }
  });

  describe('Valid paths', () => {
    it('should resolve simple relative paths', () => {
      const result = safePath(testRoot, 'file.ts');
      expect(result).toBe(path.join(testRoot, 'file.ts'));
    });

    it('should resolve nested paths', () => {
      const result = safePath(testRoot, 'src/index.ts');
      expect(result).toBe(path.join(testRoot, 'src', 'index.ts'));
    });

    it('should resolve paths with multiple levels', () => {
      const result = safePath(testRoot, 'src/lib/utils/helpers.ts');
      expect(result).toBe(path.join(testRoot, 'src', 'lib', 'utils', 'helpers.ts'));
    });

    it('should handle root directory itself', () => {
      const result = safePath(testRoot, '.');
      expect(result).toBe(testRoot);
    });

    it('should handle paths with spaces', () => {
      const result = safePath(testRoot, 'my file.ts');
      expect(result).toBe(path.join(testRoot, 'my file.ts'));
    });

    it('should handle paths with special characters (except null)', () => {
      const result = safePath(testRoot, 'file-with_special.chars.ts');
      expect(result).toBe(path.join(testRoot, 'file-with_special.chars.ts'));
    });

    it('should handle unicode characters', () => {
      const result = safePath(testRoot, '文件.ts');
      expect(result).toBe(path.join(testRoot, '文件.ts'));
    });

    it('should normalize mixed path separators on Windows', () => {
      const mixed = process.platform === 'win32'
        ? 'src\\lib/utils\\helpers.ts'
        : 'src/lib/utils/helpers.ts';
      const result = safePath(testRoot, mixed);
      expect(result).toContain('src');
      expect(result).toContain('helpers.ts');
    });

    it('should handle single dot safely', () => {
      const result = safePath(testRoot, '.');
      expect(result).toBe(testRoot);
    });

    it('should allow legitimate parent references that stay in root', () => {
      const nested = path.join(testRoot, 'a', 'b', 'c');
      fs.mkdirSync(nested, { recursive: true });

      const result = safePath(testRoot, 'a/b/c/../../file.ts');
      expect(result.startsWith(testRoot)).toBe(true);
    });
  });

  describe('Path traversal attacks', () => {
    it('should block simple parent directory traversal', () => {
      expect(() => safePath(testRoot, '../outside.txt')).toThrow('traversal');
    });

    it('should block multiple parent directory sequences', () => {
      expect(() => safePath(testRoot, '../../outside.txt')).toThrow('traversal');
    });

    it('should block parent traversal from nested path', () => {
      expect(() => safePath(testRoot, 'src/../../outside.txt')).toThrow('traversal');
    });

    it('should block deep parent traversal to /etc/passwd', () => {
      expect(() => safePath(testRoot, '../../../etc/passwd')).toThrow('traversal');
    });

    it('should block absolute paths on Unix', () => {
      if (process.platform !== 'win32') {
        expect(() => safePath(testRoot, '/etc/passwd')).toThrow('traversal');
      }
    });

    it('should block absolute paths with different drive on Windows', () => {
      if (process.platform === 'win32') {
        const cRoot = 'C:\\Users\\test';
        expect(() => safePath(cRoot, 'D:\\outside.txt')).toThrow('traversal');
      }
    });

    it('should block UNC paths on Windows', () => {
      if (process.platform === 'win32') {
        expect(() => safePath(testRoot, '\\\\server\\share\\file.txt')).toThrow('traversal');
      }
    });

    it('should handle ~/ paths as relative (stays inside root)', () => {
      const result = safePath(testRoot, '~/file.ts');
      expect(result).toContain('~');
      expect(result.startsWith(testRoot)).toBe(true);
    });
  });

  describe('Null byte injection', () => {
    it('should block null bytes in path', () => {
      expect(() => safePath(testRoot, 'file.txt\0.hidden')).toThrow('null byte');
    });

    it('should block null bytes in root', () => {
      expect(() => safePath(testRoot + '\0.anamnesic', 'file.txt')).toThrow('null byte');
    });
  });

  describe('Invalid inputs', () => {
    it('should throw for empty root directory', () => {
      expect(() => safePath('', 'file.txt')).toThrow('Root directory');
    });

    it('should throw for empty relative path', () => {
      expect(() => safePath(testRoot, '')).toThrow('Relative path');
    });

    it('should throw for non-string root', () => {
      expect(() => safePath(123 as any, 'file.txt')).toThrow('Root directory');
    });

    it('should throw for non-string path', () => {
      expect(() => safePath(testRoot, 123 as any)).toThrow('Relative path');
    });
  });

  describe('Edge cases', () => {
    it('should handle trailing slashes', () => {
      const result = safePath(testRoot, 'src/');
      expect(result).toContain('src');
    });

    it('should handle single file name', () => {
      const result = safePath(testRoot, 'README.md');
      expect(result).toBe(path.join(testRoot, 'README.md'));
    });

    it('should handle extension-less files', () => {
      const result = safePath(testRoot, 'Makefile');
      expect(result).toBe(path.join(testRoot, 'Makefile'));
    });

    it('should handle hidden files (starting with dot)', () => {
      const result = safePath(testRoot, '.gitignore');
      expect(result).toBe(path.join(testRoot, '.gitignore'));
    });

    it('should handle double extensions', () => {
      const result = safePath(testRoot, 'file.test.ts');
      expect(result).toBe(path.join(testRoot, 'file.test.ts'));
    });

    it('should normalize . in middle of path', () => {
      const result = safePath(testRoot, 'src/./index.ts');
      expect(result).toContain('src');
      expect(result).toContain('index.ts');
      expect(result.includes('\\.\\') || result.includes('/./') ).toBe(false);
    });
  });

  describe('Real filesystem operations', () => {
    it('should resolve paths to actual file locations', () => {
      const testFile = path.join(testRoot, 'test-file.ts');
      fs.writeFileSync(testFile, 'content');

      const safed = safePath(testRoot, 'test-file.ts');
      expect(fs.existsSync(safed)).toBe(true);
      expect(fs.readFileSync(safed, 'utf-8')).toBe('content');
    });

    it('should resolve nested directory structure', () => {
      const nestedFile = path.join(testRoot, 'src', 'lib', 'index.ts');
      fs.mkdirSync(path.dirname(nestedFile), { recursive: true });
      fs.writeFileSync(nestedFile, 'export default {}');

      const safed = safePath(testRoot, 'src/lib/index.ts');
      expect(fs.existsSync(safed)).toBe(true);
      expect(fs.readFileSync(safed, 'utf-8')).toBe('export default {}');
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should work with both / and \\ separators', () => {
      const pathWithSlash = safePath(testRoot, 'src/file.ts');
      const pathWithBackslash = safePath(testRoot, 'src\\file.ts');

      expect(path.normalize(pathWithSlash)).toBe(path.normalize(pathWithBackslash));
    });

    it('should return absolute paths from both Unix and Windows roots', () => {
      const result = safePath(testRoot, 'file.ts');
      expect(path.isAbsolute(result)).toBe(true);
    });
  });
});
