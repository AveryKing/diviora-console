# Security

- Never put API keys in NEXT_PUBLIC_ env vars.
- All calls to Hub that require auth must be server-side only.
- Validate and sanitize user inputs before sending upstream.
- Render untrusted JSON safely (no dangerouslySetInnerHTML).