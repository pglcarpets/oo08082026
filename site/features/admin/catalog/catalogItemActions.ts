"use server";

import { actionClient } from "@/lib/safe-action";
import {
  assertActionRateLimit,
  requireAdminAction,
  runAdminDomain,
} from "@/features/admin/api/adminActionGuards";
import {
  ConfiguratorActiveToggleWithIdSchema,
  ConfiguratorProductBodySchema,
  CreateStandardCatalogItemSchema,
  DeleteConfiguratorCatalogItemSchema,
  DeleteStandardCatalogItemSchema,
  PatchConfiguratorProductWithIdSchema,
  PatchStandardCatalogItemWithIdSchema,
} from "@/features/shared/api/schemas";
import {
  createConfiguratorCatalogItem,
  createStandardCatalogItem,
  deleteConfiguratorCatalogItem,
  deleteStandardCatalogItem,
  patchConfiguratorCatalogItem,
  patchStandardCatalogItem,
  setConfiguratorCatalogActive,
} from "@/features/admin/api/catalogAdminHandlers";

// ---------------------------------------------------------------------------
// Standard (planner_managed_products)
// ---------------------------------------------------------------------------

/**
 * Create a standard (managed) catalog item. Same domain path as
 * `POST /api/admin/catalogs/standard` — both call `createStandardCatalogItem`.
 */
export const createStandardCatalogItemAction = actionClient
  .inputSchema(CreateStandardCatalogItemSchema)
  .action(async ({ parsedInput }) => {
    await requireAdminAction();
    await assertActionRateLimit("admin-catalogs:post", 20);
    return runAdminDomain(() => createStandardCatalogItem(parsedInput));
  });

/**
 * Patch a standard (managed) catalog item by id. Same domain path as
 * `PATCH /api/admin/catalogs/standard/[id]`.
 */
export const patchStandardCatalogItemAction = actionClient
  .inputSchema(PatchStandardCatalogItemWithIdSchema)
  .action(async ({ parsedInput }) => {
    await requireAdminAction();
    await assertActionRateLimit("admin-catalogs:patch", 40);
    const { id, ...body } = parsedInput;
    return runAdminDomain(() => patchStandardCatalogItem(id, body));
  });

/**
 * Delete a standard (managed) catalog item by id. Same domain path as
 * `DELETE /api/admin/catalogs/standard/[id]`.
 */
export const deleteStandardCatalogItemAction = actionClient
  .inputSchema(DeleteStandardCatalogItemSchema)
  .action(async ({ parsedInput }) => {
    await requireAdminAction();
    await assertActionRateLimit("admin-catalogs:delete", 15);
    return runAdminDomain(() => deleteStandardCatalogItem(parsedInput.id));
  });

// ---------------------------------------------------------------------------
// Configurator (configurator_products)
// ---------------------------------------------------------------------------

/**
 * Create a configurator product. Same domain path as
 * `POST /api/admin/catalogs/configurator`.
 */
export const createConfiguratorCatalogItemAction = actionClient
  .inputSchema(ConfiguratorProductBodySchema)
  .action(async ({ parsedInput }) => {
    await requireAdminAction();
    await assertActionRateLimit("admin-catalogs:post", 20);
    return runAdminDomain(() => createConfiguratorCatalogItem(parsedInput));
  });

/**
 * Full-body patch for a configurator product. Same domain path as
 * `PATCH /api/admin/catalogs/configurator/[id]` (non-toggle body).
 */
export const patchConfiguratorCatalogItemAction = actionClient
  .inputSchema(PatchConfiguratorProductWithIdSchema)
  .action(async ({ parsedInput }) => {
    await requireAdminAction();
    await assertActionRateLimit("admin-catalogs:patch", 40);
    const { id, ...body } = parsedInput;
    return runAdminDomain(() => patchConfiguratorCatalogItem(id, body));
  });

/**
 * Active-only toggle (skips full product validation). Same as REST body
 * `{ active }` on `PATCH /api/admin/catalogs/configurator/[id]`.
 */
export const setConfiguratorCatalogActiveAction = actionClient
  .inputSchema(ConfiguratorActiveToggleWithIdSchema)
  .action(async ({ parsedInput }) => {
    await requireAdminAction();
    await assertActionRateLimit("admin-catalogs:patch", 40);
    const { id, active } = parsedInput;
    return runAdminDomain(() => setConfiguratorCatalogActive(id, { active }));
  });

/**
 * Soft-archive a configurator product. Same domain path as
 * `DELETE /api/admin/catalogs/configurator/[id]`.
 */
export const deleteConfiguratorCatalogItemAction = actionClient
  .inputSchema(DeleteConfiguratorCatalogItemSchema)
  .action(async ({ parsedInput }) => {
    await requireAdminAction();
    await assertActionRateLimit("admin-catalogs:delete", 15);
    return runAdminDomain(() => deleteConfiguratorCatalogItem(parsedInput.id));
  });
