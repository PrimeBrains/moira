import { defineConfig } from 'vitest/config';

// Plain NodeNext (no vite plugins / path aliases), mirroring moira/backend. Vite
// resolves the `.js`-extension relative imports to their `.ts` sources, and the
// bare `moira-backend` import resolves via its package `exports` to dist/.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // issue #13: clear ambient MOIRA_DIR at worker startup so a new test file
    // that forgets --dir / per-file delete cannot silently corrupt the
    // developer's real log-home. See src/test-setup.ts for the rationale.
    setupFiles: ['./src/test-setup.ts'],
  },
});
