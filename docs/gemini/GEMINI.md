# Gemini CLI Instructions

## Primary References

Before generating code, plans, or project guidance, always read and align with:

1. `sonic_app_v2/sonic_app/docs/1) Application_Overview.md`
2. `sonic_app_v2/sonic_app/docs/2) SLOMS_API_Surface.md`

## Required Behavior

1. Treat the two documents above as the source of truth for architecture, routing model, auth/session flow, and API surface.
2. If there is any conflict between ad-hoc assumptions and these docs, follow the docs.
3. When proposing implementation changes, explicitly verify consistency against both documents.
4. Do not invent endpoints, role behaviors, or route structures that contradict those documents.

## Practical Workflow

1. Read `1) Application_Overview.md` first for system shape and constraints.
2. Read `2) SLOMS_API_Surface.md` second for endpoint-level contract details.
3. Only then produce output (code, refactors, bug fixes, or documentation updates).
