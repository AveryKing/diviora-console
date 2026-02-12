# CI/CD

GitHub Actions:
- Run on pull_request:
  - install
  - lint
  - typecheck
  - test
  - build

Secrets:
- None required for v0.1
- If hub integration needs key, use repository secrets and server-side only.