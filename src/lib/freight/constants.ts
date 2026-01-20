// NOTE: Single source of truth for DB-persisted enum codes lives in `src/db/enums/`.
// This module re-exports them for backwards compatibility inside freight feature code.
export * from '../../db/enums/index';
