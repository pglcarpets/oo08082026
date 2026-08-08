/**
 * Wipe the cross-fork generator-model cache once per Vitest run so the first
 * file rebuilds from the live repo and later files reuse the snapshot.
 */
import { clearSharedRepoModelCache } from './helpers/shared-repo-model.mjs'

export default function globalSetup() {
  clearSharedRepoModelCache()
}
