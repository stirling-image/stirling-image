# Contributing to Stirling Image

Thanks for your interest in contributing. There are many ways to help beyond writing code: reporting bugs, suggesting features, improving docs, and adding translations.

## Issues

Before opening an issue, search existing ones to avoid duplicates.

- **Bug reports**: Include steps to reproduce, expected vs. actual behavior, and your environment (OS, Docker version, browser).
- **Feature requests**: Describe the problem you want solved, not just the solution. Context helps.
- **Questions**: Open an issue. We will do our best to respond quickly.

## Pull requests

1. **Open an issue first.** Describe what you want to change and why. Wait for a maintainer to confirm the direction before writing code.
2. **Fork the repo** and create a branch from `main`.
3. **Make your changes.** Follow the conventions in [CLAUDE.md](CLAUDE.md) (formatting, file structure, commit style).
4. **Test your changes.** Run `pnpm test` and `pnpm lint` before pushing. If you changed UI, run `pnpm test:e2e` too.
5. **Submit a PR.** Reference the issue number. Keep the title short and descriptive.

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/) for automated releases:

- `feat:` new feature (triggers a minor version bump)
- `fix:` bug fix (triggers a patch version bump)
- `docs:` documentation only
- `test:` adding or fixing tests
- `refactor:` code change that doesn't fix a bug or add a feature
- `chore:` maintenance (CI, deps, config)

Example: `feat: add HEIC to PNG conversion support`

### What makes a good PR

- One logical change per PR. If you need to refactor something to add a feature, that can be one PR, but don't mix unrelated changes.
- Clear commit messages that explain why, not just what.
- Tests for new behavior when possible.
- No unrelated formatting changes (Biome handles formatting).

## Development setup

Full instructions are in the [Developer Guide](https://stirling-image.github.io/stirling-image/guide/developer). The short version:

```bash
git clone https://github.com/stirling-image/stirling-image.git
cd stirling-image
pnpm install
pnpm dev        # starts both frontend and backend
```

The frontend runs at http://localhost:1349 and proxies API calls to the backend on port 13490.

### Running tests

```bash
pnpm lint           # Biome lint + format check
pnpm typecheck      # TypeScript across all workspaces
pnpm test           # unit + integration tests
pnpm test:e2e       # Playwright end-to-end tests
```

All of these run in CI on every PR. Make sure they pass locally first.

## Adding a new tool

Tools follow a consistent pattern. You will need to touch three places:

1. **Backend route** in `apps/api/src/routes/tools/` using `createToolRoute()` from the tool factory.
2. **Frontend settings component** in `apps/web/src/components/tools/` with the tool's UI controls.
3. **i18n entry** in `packages/shared/src/i18n/en.ts` with the tool's name and description.

See the [Developer Guide](https://stirling-image.github.io/stirling-image/guide/developer) for a walkthrough.

## Translations

We currently ship English only, but the i18n system is designed for easy extension. If you want to add a language, see the [Translation Guide](https://stirling-image.github.io/stirling-image/guide/translations).

## Code style

Biome handles formatting and linting. The rules are in `biome.json` and enforced by a pre-commit hook. Don't modify the Biome or TypeScript config files to silence warnings. Fix the code instead.

Quick summary:

- Double quotes, semicolons, 2-space indentation
- ES modules everywhere
- Zod for API input validation
- No `any` types without justification

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
