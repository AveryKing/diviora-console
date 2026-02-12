# Coding standards

TypeScript:
- Strict mode
- No any unless explicitly justified

Validation:
- All external API responses must be validated with Zod before use.

UI:
- Components small and reusable
- Prefer server actions for server calls
- Prefer explicit loading/error/empty states

Logging:
- Server-side: minimal structured logs
- Client-side: avoid noisy logs; no secrets

Dependencies:
- Keep lean. Do not add large UI frameworks unless required.