import { v } from 'convex/values';

import { LAST_RECENT_MESSAGES } from '@/features/conversations/constants';

import type { Id } from '@/../convex/_generated/dataModel';
import { mutation, query } from '@/../convex/_generated/server';

const validateInternalKey = (key: string) => {
  const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;
  if (!internalKey) throw new Error('POLARIS_CONVEX_INTERNAL_KEY is not configured');
  if (key !== internalKey) throw new Error('Unauthorized');
};

export const getConversationById = query({
  args: {
    conversationId: v.id('conversations'),
    internalKey: v.string(),
  },
  handler: async ({ db }, { conversationId, internalKey }) => {
    validateInternalKey(internalKey);

    return await db.get('conversations', conversationId);
  },
});

export const createMessage = mutation({
  args: {
    internalKey: v.string(),
    conversationId: v.id('conversations'),
    projectId: v.id('projects'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    status: v.optional(
      v.union(v.literal('processing'), v.literal('completed'), v.literal('cancelled'))
    ),
  },
  handler: async ({ db }, { internalKey, conversationId, projectId, role, content, status }) => {
    validateInternalKey(internalKey);

    const messageId = await db.insert('messages', {
      conversationId,
      projectId,
      role,
      content,
      status,
    });

    await db.patch('conversations', conversationId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

export const updateMessageContent = mutation({
  args: {
    internalKey: v.string(),
    messageId: v.id('messages'),
    content: v.string(),
  },
  handler: async ({ db }, { internalKey, messageId, content }) => {
    validateInternalKey(internalKey);

    await db.patch('messages', messageId, { content, status: 'completed' });
  },
});

export const updateMessageStatus = mutation({
  args: {
    internalKey: v.string(),
    messageId: v.id('messages'),
    status: v.union(v.literal('processing'), v.literal('completed'), v.literal('cancelled')),
  },
  handler: async ({ db }, { internalKey, messageId, status }) => {
    validateInternalKey(internalKey);

    await db.patch('messages', messageId, { status });
  },
});

export const processingMessages = query({
  args: {
    internalKey: v.string(),
    projectId: v.id('projects'),
  },
  handler: async ({ db }, { internalKey, projectId }) => {
    validateInternalKey(internalKey);

    const messages = await db
      .query('messages')
      .withIndex('by_project_status', (q) =>
        q.eq('projectId', projectId).eq('status', 'processing')
      )
      .collect();

    return messages;
  },
});

export const getRecentMessages = query({
  args: {
    internalKey: v.string(),
    conversationId: v.id('conversations'),
    limit: v.optional(v.number()),
  },
  handler: async ({ db }, { internalKey, conversationId, limit = LAST_RECENT_MESSAGES }) => {
    validateInternalKey(internalKey);

    const messages = await db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', conversationId))
      .order('asc')
      .collect();

    return messages.slice(-limit);
  },
});

export const updateConversationTitle = mutation({
  args: {
    internalKey: v.string(),
    conversationId: v.id('conversations'),
    title: v.string(),
  },
  handler: async ({ db }, { internalKey, conversationId, title }) => {
    validateInternalKey(internalKey);

    await db.patch('conversations', conversationId, {
      title,
      updatedAt: Date.now(),
    });

    return conversationId;
  },
});

export const getProjectFiles = query({
  args: {
    internalKey: v.string(),
    projectId: v.id('projects'),
  },
  handler: async ({ db }, { internalKey, projectId }) => {
    validateInternalKey(internalKey);

    const projectFiles = db
      .query('files')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect();

    return projectFiles;
  },
});

export const getFileById = query({
  args: {
    internalKey: v.string(),
    fileId: v.id('files'),
  },
  handler: async ({ db }, { internalKey, fileId }) => {
    validateInternalKey(internalKey);

    const file = await db.get('files', fileId);
    return file;
  },
});

export const updateFile = mutation({
  args: {
    internalKey: v.string(),
    fileId: v.id('files'),
    content: v.string(),
  },
  handler: async ({ db }, { internalKey, fileId, content }) => {
    validateInternalKey(internalKey);

    const file = await db.get('files', fileId);
    if (!file) throw new Error('File not found');

    await db.patch('files', fileId, {
      content,
      updatedAt: Date.now(),
    });

    return fileId;
  },
});

export const createFile = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id('projects'),
    name: v.string(),
    content: v.string(),
    parentId: v.optional(v.id('files')),
  },
  handler: async ({ db }, { internalKey, projectId, name, content, parentId }) => {
    validateInternalKey(internalKey);

    const trimmedName = name.trim();

    // check if file or folder with same name already exists in this parent folder
    const existingFilesOrFolders = await db
      .query('files')
      .withIndex('by_name_project_parent', (q) =>
        q.eq('name', trimmedName).eq('projectId', projectId).eq('parentId', parentId)
      )
      .collect();
    if (!!existingFilesOrFolders.length) throw new Error('File or Folder already exists');

    const fileId = await db.insert('files', {
      projectId,
      name: trimmedName,
      content,
      parentId,
      type: 'file',
      updatedAt: Date.now(),
    });

    return fileId;
  },
});

export const createFiles = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id('projects'),
    parentId: v.optional(v.id('files')),
    files: v.array(
      v.object({
        name: v.string(),
        content: v.string(),
      })
    ),
  },
  handler: async ({ db }, { internalKey, projectId, parentId, files }) => {
    validateInternalKey(internalKey);

    const existingFiles = await db
      .query('files')
      .withIndex('by_project_parent', (q) => q.eq('projectId', projectId).eq('parentId', parentId))
      .collect();

    const results: { name: string; fileId: string; error?: string }[] = [];

    for (const file of files) {
      const trimmedName = file.name.trim();
      const existingFile = existingFiles.find((f) => f.name === trimmedName);

      if (!!existingFile) {
        results.push({
          name: existingFile.name,
          fileId: existingFile._id,
          error: 'File or Folder already exists',
        });
        continue;
      }

      const fileId = await db.insert('files', {
        projectId,
        name: trimmedName,
        content: file.content,
        parentId,
        type: 'file',
        updatedAt: Date.now(),
      });

      results.push({ name: trimmedName, fileId });
    }

    return results;
  },
});

export const createFolder = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id('projects'),
    name: v.string(),
    parentId: v.optional(v.id('files')),
  },
  handler: async ({ db }, { internalKey, projectId, name, parentId }) => {
    validateInternalKey(internalKey);

    const trimmedName = name.trim();

    // check if file or folder with same name already exists in this parent folder
    const existingFilesOrFolders = await db
      .query('files')
      .withIndex('by_name_project_parent', (q) =>
        q.eq('name', trimmedName).eq('projectId', projectId).eq('parentId', parentId)
      )
      .collect();
    if (!!existingFilesOrFolders.length) throw new Error('File or Folder already exists');

    const folderId = await db.insert('files', {
      projectId,
      name: trimmedName,
      parentId,
      type: 'folder',
      updatedAt: Date.now(),
    });

    return folderId;
  },
});

export const renameFile = mutation({
  args: {
    internalKey: v.string(),
    fileId: v.id('files'),
    newName: v.string(),
  },
  handler: async ({ db }, { internalKey, fileId, newName }) => {
    validateInternalKey(internalKey);

    const trimmedNewName = newName.trim();

    const file = await db.get('files', fileId);
    if (!file) throw new Error('File not found');

    // check if file or folder with new name already exists in this parent folder
    const existingFilesOrFolders = await db
      .query('files')
      .withIndex('by_name_project_parent', (q) =>
        q.eq('name', trimmedNewName).eq('projectId', file.projectId).eq('parentId', file.parentId)
      )
      .collect();
    if (!!existingFilesOrFolders.length) throw new Error('File or Folder already exists');

    await db.patch('files', fileId, {
      name: trimmedNewName,
      updatedAt: Date.now(),
    });

    return fileId;
  },
});

export const deleteFile = mutation({
  args: {
    internalKey: v.string(),
    fileId: v.id('files'),
  },
  handler: async ({ db, storage }, { internalKey, fileId }) => {
    validateInternalKey(internalKey);

    const file = await db.get('files', fileId);
    if (!file) throw new Error('File not found');

    // recursively delete file/folder and all descendants
    const deleteRecursive = async (fileId: Id<'files'>) => {
      const item = await db.get('files', fileId);
      if (!item) return;

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

    return fileId;
  },
});
