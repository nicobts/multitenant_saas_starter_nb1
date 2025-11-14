# Contributing to Multitenant SaaS Starter

Thank you for considering contributing to this project! Here are some guidelines to help you get started.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Set up PostgreSQL database
5. Run migrations: `npm run db:migrate`
6. Start dev server: `npm run dev`

## Code Style

This project uses:
- **ESLint** for linting
- **Prettier** for formatting
- **TypeScript** strict mode

Run before committing:
```bash
npm run lint
npm run format
npm run type-check
```

## Commit Convention

We follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build/tooling changes

Example:
```
feat: add user profile page
fix: resolve authentication bug
docs: update README installation steps
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Update documentation if needed
6. Submit PR with clear description

## Testing

- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`
- Ensure all tests pass before submitting PR

## Questions?

Open an issue for discussion before starting major changes.

Thank you for contributing!
