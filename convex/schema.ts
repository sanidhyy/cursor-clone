import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const schema = defineSchema({
  projects: defineTable({
    name: v.string(),
    ownerId: v.string(),
    updatedAt: v.number(),
    importStatus: v.optional(
      v.union(v.literal('importing'), v.literal('completed'), v.literal('failed'))
    ),
    exportStatus: v.optional(
      v.union(
        v.literal('exporting'),
        v.literal('completed'),
        v.literal('failed'),
        v.literal('cancelled')
      )
    ),
    exportRepoUrl: v.optional(v.string()),
  })
    .index('by_owner', ['ownerId'])
    .index('by_updated_at', ['updatedAt'])
    .index('by_owner_updated_at', ['ownerId', 'updatedAt']),

  files: defineTable({
    projectId: v.id('projects'),
    parentId: v.optional(v.id('files')),
    name: v.string(),
    type: v.union(v.literal('file'), v.literal('folder')),
    content: v.optional(v.string()), // text files only
    storageId: v.optional(v.id('_storage')), // binary files only
    updatedAt: v.number(),
  })
    .index('by_name', ['name'])
    .index('by_project', ['projectId'])
    .index('by_parent', ['parentId'])
    .index('by_project_parent', ['projectId', 'parentId'])
    .index('by_name_project_parent', ['name', 'projectId', 'parentId']),
});

export default schema;
