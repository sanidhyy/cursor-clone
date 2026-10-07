import { v } from 'convex/values';

import type { Doc, Id } from '@/../convex/_generated/dataModel';
import { mutation, query } from '@/../convex/_generated/server';

import { verifyAuth } from './auth';

export const getFiles = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async ({ auth, db }, { projectId }) => {
    const user = await verifyAuth(auth);

    const project = await db.get('projects', projectId);
    if (!project || project.ownerId !== user.subject) throw new Error('Project not found');

    const files = await db
      .query('files')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect();

    return files;
  },
});

export const getFile = query({
  args: {
    id: v.id('files'),
  },
  handler: async ({ auth, db }, { id: fileId }) => {
    const user = await verifyAuth(auth);

    const file = await db.get('files', fileId);
    if (!file) throw new Error('File not found');

    const project = await db.get('projects', file.projectId);
    if (!project || project.ownerId !== user.subject) throw new Error('File not found');

    return file;
  },
});

export const getFolderContents = query({
  args: {
    projectId: v.id('projects'),
    parentId: v.optional(v.id('files')),
  },
  handler: async ({ auth, db }, { projectId, parentId }) => {
    const user = await verifyAuth(auth);

    const project = await db.get('projects', projectId);
    if (!project || project.ownerId !== user.subject) throw new Error('Project not found');

    const files = await db
      .query('files')
      .withIndex('by_project_parent', (q) => q.eq('projectId', projectId).eq('parentId', parentId))
      .collect();

    // sort: folders first, then files, alphabetically within each group
    const sortedFiles = files.sort((a, b) => {
      // folders come before files
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;

      // within same type, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

    return sortedFiles;
  },
});

export const getFilePath = query({
  args: {
    id: v.id('files'),
  },
  handler: async ({ auth, db }, { id: fileId }) => {
    const user = await verifyAuth(auth);

    const file = await db.get('files', fileId);
    if (!file) throw new Error('File not found');

    const project = await db.get('projects', file.projectId);
    if (!project || project.ownerId !== user.subject) throw new Error('File not found');

    const path: { _id: Id<'files'>; name: string }[] = [];
    let currentId: Id<'files'> | undefined = fileId;

    while (currentId) {
      const file = (await db.get('files', currentId)) as Doc<'files'> | undefined;
      if (!file) break;

      path.unshift({ _id: file._id, name: file.name });
      currentId = file.parentId;
    }

    return path;
  },
});

export const createFile = mutation({
  args: {
    projectId: v.id('projects'),
    parentId: v.optional(v.id('files')),
    name: v.string(),
    content: v.string(),
  },
  handler: async ({ auth, db }, { projectId, parentId, name, content }) => {
    const now = Date.now();
    const trimmedName = name.trim();
    const user = await verifyAuth(auth);

    const project = await db.get('projects', projectId);
    if (!project || project.ownerId !== user.subject) throw new Error('Project not found');

    // check if file or folder with same name already exists in this parent folder
    const existingFilesOrFolders = await db
      .query('files')
      .withIndex('by_name_project_parent', (q) =>
        q.eq('name', trimmedName).eq('projectId', projectId).eq('parentId', parentId)
      )
      .collect();

    if (!!existingFilesOrFolders.length) throw new Error('File or Folder already exists');

    await db.insert('files', {
      projectId,
      name: trimmedName,
      content,
      parentId,
      type: 'file',
      updatedAt: now,
    });

    await db.patch('projects', projectId, {
      updatedAt: now,
    });
  },
});

export const createFolder = mutation({
  args: {
    projectId: v.id('projects'),
    parentId: v.optional(v.id('files')),
    name: v.string(),
  },
  handler: async ({ auth, db }, { projectId, parentId, name }) => {
    const now = Date.now();
    const trimmedName = name.trim();
    const user = await verifyAuth(auth);

    const project = await db.get('projects', projectId);
    if (!project || project.ownerId !== user.subject) throw new Error('Project not found');

    // check if file or folder with same name already exists in this parent folder
    const existingFilesOrFolders = await db
      .query('files')
      .withIndex('by_name_project_parent', (q) =>
        q.eq('name', trimmedName).eq('projectId', projectId).eq('parentId', parentId)
      )
      .collect();

    if (!!existingFilesOrFolders.length) throw new Error('File or Folder already exists');

    await db.insert('files', {
      projectId,
      name: trimmedName,
      parentId,
      type: 'folder',
      updatedAt: now,
    });

    await db.patch('projects', projectId, {
      updatedAt: now,
    });
  },
});

export const renameFile = mutation({
  args: {
    id: v.id('files'),
    newName: v.string(),
  },
  handler: async ({ auth, db }, { id: fileId, newName }) => {
    const now = Date.now();
    const trimmedNewName = newName.trim();
    const user = await verifyAuth(auth);

    const file = await db.get('files', fileId);
    if (!file) throw new Error('File not found');

    if (trimmedNewName === file.name) return fileId;

    const project = await db.get('projects', file.projectId);
    if (!project || project.ownerId !== user.subject) throw new Error('File not found');

    // check if a file or folder with the new name already exists in the same parent folder
    const existingFilesOrFolders = await db
      .query('files')
      .withIndex('by_name_project_parent', (q) =>
        q.eq('name', trimmedNewName).eq('projectId', file.projectId).eq('parentId', file.parentId)
      )
      .collect();

    if (!!existingFilesOrFolders.length) throw new Error('File or Folder already exists');

    // update the file's name
    await db.patch('files', fileId, {
      name: trimmedNewName,
      updatedAt: now,
    });

    await db.patch('projects', file.projectId, {
      updatedAt: now,
    });

    return fileId;
  },
});

export const deleteFile = mutation({
  args: {
    id: v.id('files'),
  },
  handler: async ({ auth, db, storage }, { id: fileId }) => {
    const now = Date.now();
    const user = await verifyAuth(auth);

    const file = await db.get('files', fileId);
    if (!file) throw new Error('File not found');

    const project = await db.get('projects', file.projectId);
    if (!project || project.ownerId !== user.subject) throw new Error('File not found');

    // recursively delete file/folder and all descendants
    const deleteRecursive = async (fileId: Id<'files'>) => {
      const item = await db.get('files', fileId);
      if (!item) throw new Error('File not found');

      // if its a folder, delete all children first
      if (item.type === 'folder') {
        const children = await db
          .query('files')
          .withIndex('by_project_parent', (q) =>
            q.eq('projectId', item.projectId).eq('parentId', fileId)
          )
          .collect();

        for (const child of children) await deleteRecursive(child._id);
      }

      // delete storage file if it exists
      if (item.storageId) await storage.delete(item.storageId);

      // delete the file/folder itself
      await db.delete('files', fileId);
    };

    await deleteRecursive(fileId);

    await db.patch('projects', file.projectId, {
      updatedAt: now,
    });
  },
});

export const updateFile = mutation({
  args: {
    id: v.id('files'),
    content: v.string(),
  },
  handler: async ({ auth, db }, { id: fileId, content }) => {
    const now = Date.now();
    const user = await verifyAuth(auth);

    const file = await db.get('files', fileId);
    if (!file) throw new Error('File not found');

    const project = await db.get('projects', file.projectId);
    if (!project || project.ownerId !== user.subject) throw new Error('File not found');

    await db.patch('files', fileId, {
      content,
      updatedAt: now,
    });

    await db.patch('projects', file.projectId, {
      updatedAt: now,
    });
  },
});
