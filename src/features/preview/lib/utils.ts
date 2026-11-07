import type { FileSystemTree, WebContainer } from '@webcontainer/api';
import ky from 'ky';

import type { Doc, Id } from '@/../convex/_generated/dataModel';

type FileDoc = Doc<'files'>;

export type PreviewFile = FileDoc & { storageUrl: string | null };

export const hasRunnableManifest = (files: PreviewFile[], devCommand?: string): boolean => {
  const manifest = files.find(
    (file) =>
      file.type === 'file' && !file.parentId && file.name === 'package.json' && !file.storageId
  );
  if (!manifest?.content) return false;

  try {
    const pkg = JSON.parse(manifest.content) as { scripts?: { dev?: unknown } } | null;
    if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) return false;
    return (
      !!devCommand?.trim() || (typeof pkg.scripts?.dev === 'string' && !!pkg.scripts.dev.trim())
    );
  } catch {
    return false;
  }
};

const getFileContents = async (file: PreviewFile): Promise<string | Uint8Array> => {
  if (!file.storageId) return file.content ?? '';
  if (!file.storageUrl) throw new Error(`Unable to load binary file: ${file.name}`);

  return new Uint8Array(await ky.get(file.storageUrl).arrayBuffer());
};

/*
 * Convert flat Convex files to nested FileSystemTree for WebContainer
 */
export const buildFileTree = async (files: PreviewFile[]): Promise<FileSystemTree> => {
  const tree: FileSystemTree = Object.create(null);
  const filesMap = new Map(files.map((file) => [file._id, file]));

  const getPath = (file: FileDoc): string[] => {
    const parts: string[] = [file.name];
    let parentId = file.parentId;

    while (!!parentId) {
      const parent = filesMap.get(parentId);
      if (!parent) break;

      parts.unshift(parent.name);
      parentId = parent.parentId;
    }

    return parts;
  };

  for (const file of files) {
    const pathParts = getPath(file);
    let current = tree;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLast = i === pathParts.length - 1;

      if (isLast) {
        if (file.type === 'folder') current[part] ??= { directory: Object.create(null) };
        else current[part] = { file: { contents: await getFileContents(file) } };
      } else {
        if (!current[part]) current[part] = { directory: Object.create(null) };

        const node = current[part];
        if ('directory' in node) current = node.directory;
      }
    }
  }

  return tree;
};

/*
 * Get full path for a file by traversing parent chain
 */
export const getFilePath = (file: FileDoc, filesMap: Map<Id<'files'>, FileDoc>): string => {
  const parts: string[] = [file.name];
  let parentId = file.parentId;

  while (!!parentId) {
    const parent = filesMap.get(parentId);
    if (!parent) break;

    parts.unshift(parent.name);
    parentId = parent.parentId;
  }

  return parts.join('/');
};

export const syncFileSystem = async (
  fs: WebContainer['fs'],
  previousFiles: PreviewFile[],
  files: PreviewFile[]
) => {
  const getEntries = (items: PreviewFile[]) => {
    const filesMap = new Map(items.map((file) => [file._id, file]));
    return new Map(items.map((file) => [getFilePath(file, filesMap), file]));
  };

  const previous = getEntries(previousFiles);
  const current = getEntries(files);

  // Remove old paths before creating replacements; children go before parents.
  const removed = [...previous].filter(([path, file]) => current.get(path)?.type !== file.type);
  removed.sort(([a], [b]) => b.split('/').length - a.split('/').length);
  for (const [path] of removed) await fs.rm(path, { recursive: true, force: true });

  for (const [path, file] of current) {
    if (file.type === 'folder' && previous.get(path)?.type !== 'folder')
      await fs.mkdir(path, { recursive: true });
  }

  for (const [path, file] of current) {
    if (file.type !== 'file') continue;
    const oldFile = previous.get(path);
    if (
      oldFile?.type === 'file' &&
      oldFile.content === file.content &&
      oldFile.storageId === file.storageId
    )
      continue;

    const parentPath = path.split('/').slice(0, -1).join('/');
    if (parentPath) await fs.mkdir(parentPath, { recursive: true });
    await fs.writeFile(path, await getFileContents(file));
  }
};
