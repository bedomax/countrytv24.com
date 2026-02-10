---
description: Create a lean implementation plan from the feature spec.
handoffs:
  - label: Create Tasks
    agent: speckit.tasks
    prompt: Break the plan into tasks
    send: true
  - label: Implement Directly
    agent: speckit.implement
    prompt: Implement the plan
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/setup-plan.sh --json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH.

2. **Load context**: Read FEATURE_SPEC (the spec.md file) and the codebase files relevant to the feature.

3. **Write plan.md** directly in SPECS_DIR with this lean structure:

```markdown
# Plan: [FEATURE NAME]

**Branch**: `[branch]` | **Date**: [DATE] | **Spec**: [link to spec.md]

## Summary
[1-2 sentences: what we're building and why]

## Files to Change
| File | Action | What Changes |
|------|--------|-------------|
| path/to/file | Modify | Brief description |
| path/to/new-file | Create | Brief description |

## Implementation Steps
1. [Step with specific file and what to do]
2. [Step with specific file and what to do]
3. ...

## Testing
- [ ] [How to verify it works]
- [ ] [Edge case to test]
```

4. **Report**: Show branch name, plan path, and suggest next step (`/speckit.tasks` or `/speckit.implement`).

## Rules

- **NO extra files**: Do not generate research.md, data-model.md, contracts/, or quickstart.md
- **Be specific**: Reference actual file paths from the codebase
- **Be concise**: The plan should fit on one screen
- **Read the code first**: Before writing the plan, read the files that will be modified
- Use absolute paths when running scripts
