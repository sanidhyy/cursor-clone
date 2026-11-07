import { v } from 'convex/values';

import { LAST_RECENT_MESSAGES } from '@/features/conversations/constants';
import { codeContextsSchema, conversationTitleSchema } from '@/features/conversations/schemas';
import { projectNameSchema } from '@/features/projects/schemas';
import {
  fileContentSchema,
  fileNameSchema,
  filesInputSchema,
} from '@/features/projects/schemas/files';

import type { Id } from '@/../convex/_generated/dataModel';
import { mutation, query } from '@/../convex/_generated/server';
import { codeSchema, promptSchema, queryLimitSchema } from '@/schemas/common';

import { codeContextValidator, messageStatusValidator } from './validators';

const validateInternalKey = (key: string) => {
  const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

  if (!internalKey) throw new Error('POLARIS_CONVEX_INTERNAL_KEY is not configured');
  if (key !== internalKey) throw new Error('Unauthorized');
};

export const getProjectById = query({
  args: {
    internalKey: v.string(),
    projectId: v.id('projects'),
    ownerId: v.string(),
  },

  handler: async ({ db }, { internalKey, projectId, ownerId }) => {
    validateInternalKey(internalKey);

    const project = await db.get('projects', projectId);

    return project?.ownerId === ownerId ? project : null;
  },
});

export const getConversationById = query({
  args: {
    conversationId: v.id('conversations'),
    internalKey: v.string(),
    ownerId: v.string(),
  },

  handler: async ({ db }, { conversationId, internalKey, ownerId }) => {
    validateInternalKey(internalKey);

    const conversation = await db.get('conversations', conversationId);

    if (!conversation) return null;

    const project = await db.get('projects', conversation.projectId);

    return project?.ownerId === ownerId ? conversation : null;
  },
});

export const createMessage = mutation({
  args: {
    internalKey: v.string(),
    conversationId: v.id('conversations'),
    projectId: v.id('projects'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    context: v.optional(v.array(codeContextValidator)),
    status: v.optional(messageStatusValidator),
  },

  handler: async (
    { db },
    { internalKey, conversationId, projectId, role, content, status, context }
  ) => {
    validateInternalKey(internalKey);

    const validatedContext = codeContextsSchema.parse(context ?? []);

    for (const item of validatedContext) {
      const file = await db.get('files', item.fileId as Id<'files'>);

      if (!file || file.projectId !== projectId || file.type !== 'file' || file.storageId)
        throw new Error('Context file not found');
    }

    const messageId = await db.insert('messages', {
      conversationId,
      projectId,
      role,
      content: role === 'user' ? promptSchema.parse(content) : codeSchema.parse(content),
      context: validatedContext.length
        ? validatedContext.map((item) => ({ ...item, fileId: item.fileId as Id<'files'> }))
        : undefined,
      status,
    });

    await db.patch('conversations', conversationId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

export const getMessageById = query({
  args: {
    internalKey: v.string(),
    messageId: v.id('messages'),
    projectId: v.id('projects'),
    conversationId: v.id('conversations'),
  },

  handler: async ({ db }, { internalKey, messageId, projectId, conversationId }) => {
    validateInternalKey(internalKey);

    const message = await db.get('messages', messageId);

    return message?.projectId === projectId && message.conversationId === conversationId
      ? message
      : null;
  },
});

export const updateMessageContent = mutation({
  args: {
    internalKey: v.string(),
    messageId: v.id('messages'),
    content: v.string(),
    status: v.optional(v.union(v.literal('completed'), v.literal('incomplete'))),
  },

  handler: async ({ db }, { internalKey, messageId, content, status = 'completed' }) => {
    validateInternalKey(internalKey);

    await db.patch('messages', messageId, {
      content: codeSchema.parse(content),
      status,
    });
  },
});

export const updateMessageStatus = mutation({
  args: {
    internalKey: v.string(),
    messageId: v.id('messages'),
    status: messageStatusValidator,
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
    beforeMessageId: v.optional(v.id('messages')),
  },

  handler: async (
    { db },
    { internalKey, conversationId, limit = LAST_RECENT_MESSAGES, beforeMessageId }
  ) => {
    validateInternalKey(internalKey);

    const messages = await db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', conversationId))
      .order('asc')
      .collect();

    const end = beforeMessageId
      ? messages.findIndex((message) => message._id === beforeMessageId)
      : messages.length;

    if (end === -1) throw new Error('Message not found');

    return messages
      .slice(0, end)
      .filter(
        (message) =>
          !!message.content.trim() &&
          message.status !== 'cancelled' &&
          message.status !== 'processing' &&
          (message.role === 'user' || message.status === 'completed')
      )
      .slice(-queryLimitSchema.parse(limit));
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
      title: conversationTitleSchema.parse(title),
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
    projectId: v.id('projects'),
    fileId: v.id('files'),
  },

  handler: async ({ db }, { internalKey, projectId, fileId }) => {
    validateInternalKey(internalKey);

    const file = await db.get('files', fileId);

    return file?.projectId === projectId ? file : null;
  },
});

export const updateFile = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id('projects'),
    fileId: v.id('files'),
    content: v.string(),
  },

  handler: async ({ db }, { internalKey, projectId, fileId, content }) => {
    validateInternalKey(internalKey);

    const file = await db.get('files', fileId);

    if (!file || file.projectId !== projectId) throw new Error('File not found');

    await db.patch('files', fileId, {
      content: fileContentSchema.parse(content),
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

    if (!!parentId) {
      const parent = await db.get('files', parentId);

      if (!parent || parent.projectId !== projectId || parent.type !== 'folder')
        throw new Error('Folder not found');
    }

    const trimmedName = fileNameSchema.parse(name);

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
      content: fileContentSchema.parse(content),
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

    if (!!parentId) {
      const parent = await db.get('files', parentId);

      if (!parent || parent.projectId !== projectId || parent.type !== 'folder')
        throw new Error('Folder not found');
    }

    const existingFiles = await db
      .query('files')
      .withIndex('by_project_parent', (q) => q.eq('projectId', projectId).eq('parentId', parentId))
      .collect();

    const results: { name: string; fileId: string; error?: string }[] = [];

    for (const file of filesInputSchema.parse(files)) {
      const trimmedName = file.name;
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

    if (!!parentId) {
      const parent = await db.get('files', parentId);

      if (!parent || parent.projectId !== projectId || parent.type !== 'folder')
        throw new Error('Folder not found');
    }

    const trimmedName = fileNameSchema.parse(name);

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
    projectId: v.id('projects'),
    fileId: v.id('files'),
    newName: v.string(),
  },

  handler: async ({ db }, { internalKey, projectId, fileId, newName }) => {
    validateInternalKey(internalKey);

    const trimmedNewName = fileNameSchema.parse(newName);

    const file = await db.get('files', fileId);

    if (!file || file.projectId !== projectId) throw new Error('File not found');
    if (trimmedNewName === file.name) return fileId;

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
    projectId: v.id('projects'),
    fileId: v.id('files'),
  },

  handler: async ({ db, storage }, { internalKey, projectId, fileId }) => {
    validateInternalKey(internalKey);

    const file = await db.get('files', fileId);

    if (!file || file.projectId !== projectId) throw new Error('File not found');

    // recursively delete file/folder and all descendants
    const deleteRecursive = async (fileId: Id<'files'>) => {
      const item = await db.get('files', fileId);

      if (!item) return;
      if (item.projectId !== projectId) throw new Error('File not found');

      // if its a folder, delete all children first
      if (item.type === 'folder') {
        const children = await db
          .query('files')
          .withIndex('by_project_parent', (q) =>
            q.eq('projectId', projectId).eq('parentId', fileId)
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

export const cleanup = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id('projects'),
  },

  handler: async ({ db, storage }, { internalKey, projectId }) => {
    validateInternalKey(internalKey);

    const files = await db
      .query('files')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect();

    for (const file of files) {
      if (file.storageId) await storage.delete(file.storageId);

      await db.delete(file._id);
    }

    return files.length;
  },
});

export const generateUploadUrl = mutation({
  args: {
    internalKey: v.string(),
  },

  handler: async ({ storage }, { internalKey }) => {
    validateInternalKey(internalKey);

    return await storage.generateUploadUrl();
  },
});

export const createBinaryFile = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id('projects'),
    name: v.string(),
    storageId: v.id('_storage'),
    parentId: v.optional(v.id('files')),
  },

  handler: async ({ db }, { internalKey, projectId, name, storageId, parentId }) => {
    validateInternalKey(internalKey);

    const trimmedName = fileNameSchema.parse(name);

    if (!!parentId) {
      const parent = await db.get('files', parentId);

      if (!parent || parent.projectId !== projectId || parent.type !== 'folder')
        throw new Error('Folder not found');
    }

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
      type: 'file',
      storageId,
      parentId,
      updatedAt: Date.now(),
    });

    return fileId;
  },
});

export const updateImportStatus = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id('projects'),
    status: v.optional(
      v.union(v.literal('importing'), v.literal('completed'), v.literal('failed'))
    ),
  },

  handler: async ({ db }, { internalKey, projectId, status }) => {
    validateInternalKey(internalKey);

    await db.patch('projects', projectId, {
      importStatus: status,
      updatedAt: Date.now(),
    });
  },
});

export const updateExportStatus = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id('projects'),
    status: v.optional(
      v.union(
        v.literal('exporting'),
        v.literal('completed'),
        v.literal('failed'),
        v.literal('cancelled')
      )
    ),
    repoUrl: v.optional(v.string()),
  },

  handler: async ({ db }, { internalKey, projectId, status, repoUrl }) => {
    validateInternalKey(internalKey);

    await db.patch('projects', projectId, {
      exportStatus: status,
      exportRepoUrl: repoUrl,
      updatedAt: Date.now(),
    });
  },
});

export const getProjectFilesWithUrls = query({
  args: {
    internalKey: v.string(),
    projectId: v.id('projects'),
  },

  handler: async ({ db, storage }, { internalKey, projectId }) => {
    validateInternalKey(internalKey);

    const files = await db
      .query('files')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect();

    return await Promise.all(
      files.map(async (file) => {
        if (file.storageId) {
          const url = await storage.getUrl(file.storageId);

          return { ...file, storageUrl: url };
        }

        return { ...file, storageUrl: null };
      })
    );
  },
});

export const createProject = mutation({
  args: {
    internalKey: v.string(),
    name: v.string(),
    ownerId: v.string(),
  },

  handler: async ({ db }, { internalKey, name, ownerId }) => {
    validateInternalKey(internalKey);

    const projectId = await db.insert('projects', {
      name: projectNameSchema.parse(name),
      ownerId,
      updatedAt: Date.now(),
      importStatus: 'importing',
    });

    return projectId;
  },
});

export const createProjectWithConversation = mutation({
  args: {
    internalKey: v.string(),
    projectName: v.string(),
    conversationTitle: v.string(),
    ownerId: v.string(),
  },

  handler: async ({ db }, { internalKey, projectName, conversationTitle, ownerId }) => {
    validateInternalKey(internalKey);

    const now = Date.now();

    const projectId = await db.insert('projects', {
      name: projectNameSchema.parse(projectName),
      ownerId,
      updatedAt: now,
    });

    const conversationId = await db.insert('conversations', {
      projectId,
      title: conversationTitleSchema.parse(conversationTitle),
      updatedAt: now,
    });

    return { projectId, conversationId };
  },
});
