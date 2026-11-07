import type { FileSystemTree, WebContainer } from '@webcontainer/api';

import type { Doc, Id } from '@/../convex/_generated/dataModel';

type FileDoc = Doc<'files'>;

/*
 * Convert flat Convex files to nested FileSystemTree for WebContainer
 */
export const buildFileTree = (files: FileDoc[]): FileSystemTree => {
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
        else if (!file.storageId) current[part] = { file: { contents: file.content ?? '' } };
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
  previousFiles: FileDoc[],
  files: FileDoc[]
) => {
  const getEntries = (items: FileDoc[]) => {
    const filesMap = new Map(items.map((file) => [file._id, file]));
    return new Map(
      items.filter((file) => !file.storageId).map((file) => [getFilePath(file, filesMap), file])
    );
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
    if (oldFile?.type === 'file' && oldFile.content === file.content) continue;

    const parentPath = path.split('/').slice(0, -1).join('/');
    if (parentPath) await fs.mkdir(parentPath, { recursive: true });
    await fs.writeFile(path, file.content ?? '');
  }
};
