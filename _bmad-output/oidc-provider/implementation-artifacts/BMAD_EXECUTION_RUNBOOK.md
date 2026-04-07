# BMaD Execution Runbook (OIDC Provider Workspace)

## Active Workspace

- Planning artifacts: `_bmad-output/oidc-provider/planning-artifacts`
- Implementation artifacts: `_bmad-output/oidc-provider/implementation-artifacts`

## Planned Command Chain

1. `bmad-create-prd`
2. `bmad-create-architecture`
3. `bmad-create-epics-and-stories`
4. `bmad-check-implementation-readiness`
5. `bmad-sprint-planning`
6. Per-story loop:
   - `bmad-create-story`
   - `bmad-dev-story`
   - `bmad-code-review`
   - `bmad-qa-generate-e2e-tests`
   - `bmad-sprint-status`
7. `bmad-retrospective` (per completed epic)
8. `bmad-check-implementation-readiness` (final closeout)

## Environment Finding

- On this machine, `bmad-*` shell aliases are not currently available in `PATH`.
- Equivalent artifacts were generated directly under the isolated workspace to unblock implementation.

## Story Execution Rule

- Use `sprint-status.yaml` as source of truth.
- Move story state through:
  - `backlog` -> `ready-for-dev` -> `in-progress` -> `review` -> `done`.
- Update `last_updated` on each state transition.

## Restoration Rule

After OIDC implementation stream completion:

1. Restore `_bmad/bmm/config.yaml` from `_bmad/bmm/config.pre-oidc.yaml`.
2. Keep `_bmad-output/oidc-provider/*` as implementation record.
