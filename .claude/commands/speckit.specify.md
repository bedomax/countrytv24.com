---
description: Create or update the feature specification from a natural language feature description.
handoffs:
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec
    send: true
  - label: Implement Directly
    agent: speckit.implement
    prompt: Implement the feature
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## GitHub Issue Integration

**Before anything else**, check if `$ARGUMENTS` matches a GitHub issue reference pattern (e.g., `#4`, `#12`, `issue 4`, `issue #4`).

If it does:
1. Extract the issue number
2. Run: `gh issue view <NUMBER> --json title,body,comments,labels`
3. Use the issue **title** as the feature name
4. Use the issue **body** as the feature description
5. Include relevant **comments** as additional context
6. Include **labels** for classification hints

If `$ARGUMENTS` does NOT match an issue pattern, treat it as a direct feature description.

## Outline

Given the feature description, do this:

1. **Generate a concise short name** (2-4 words) for the branch:
   - Use action-noun format (e.g., "add-user-auth", "fix-payment-bug")
   - Examples:
     - "I want to add user authentication" → "user-auth"
     - "Fix payment processing timeout bug" → "fix-payment-timeout"

2. **Create the branch**:

   a. Fetch remote branches: `git fetch --all --prune`

   b. Find highest feature number across remote branches, local branches, and `specs/` directories matching the short-name.

   c. Run: `.specify/scripts/bash/create-new-feature.sh --json --number N+1 --short-name "your-short-name" "Feature description"`

   **IMPORTANT**: Run this script only once. Parse the JSON output for BRANCH_NAME and SPEC_FILE.

3. **Load** `.specify/templates/spec-template.md` for the structure.

4. **Write the spec** to SPEC_FILE:
   - Extract key concepts: actors, actions, data, constraints
   - Make informed guesses for unclear aspects (don't ask unless critical)
   - Maximum 3 [NEEDS CLARIFICATION] markers, only for decisions that significantly impact scope
   - Fill: User Scenarios, Functional Requirements, Success Criteria
   - Each requirement must be testable

5. **Quick validation** - scan the spec for:
   - No implementation details leaked in (no frameworks, APIs, languages)
   - All mandatory sections filled
   - Requirements are testable
   - If [NEEDS CLARIFICATION] markers remain, ask the user (max 3 questions)

6. **Report**: Show branch name, spec file path, and suggest next step (`/speckit.plan` or implement directly).

**NOTE:** The script creates and checks out the new branch.

## Guidelines

- Focus on **WHAT** users need and **WHY**, not HOW
- Be concise - the spec should be scannable, not a novel
- Make reasonable defaults instead of asking questions
- Do NOT generate checklist files - keep output to spec.md only
