#!/usr/bin/env node

/**
 * Claude Issue Planner with Mem0 Memory
 *
 * When an issue is created, Claude analyzes it, checks Mem0 for project context,
 * and responds with an implementation plan including branch name and steps.
 */

import Anthropic from '@anthropic-ai/sdk';
import MemoryClient from 'mem0ai';
import fs from 'fs';

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MEM0_USER_ID = 'countrytv24-project';

async function main() {
  try {
    console.log('🧠 Starting Claude Issue Planner...\n');

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const mem0Key = process.env.MEM0_API_KEY;
    const issueTitle = process.env.ISSUE_TITLE;
    const issueBody = process.env.ISSUE_BODY || '';
    const issueNumber = process.env.ISSUE_NUMBER;
    const issueAuthor = process.env.ISSUE_AUTHOR;
    const issueLabels = process.env.ISSUE_LABELS || '';

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    console.log(`📋 Issue #${issueNumber}: ${issueTitle}`);
    console.log(`👤 Author: ${issueAuthor}\n`);

    // --- Mem0: Get project context ---
    let projectMemories = '';
    if (mem0Key) {
      try {
        console.log('🧠 Fetching project memories from Mem0...');
        const mem0 = new MemoryClient({ apiKey: mem0Key });

        // Search for relevant memories about this issue topic
        const searchResults = await mem0.search(
          `${issueTitle} ${issueBody.substring(0, 200)}`,
          { user_id: MEM0_USER_ID }
        );

        if (searchResults && searchResults.length > 0) {
          projectMemories = searchResults
            .slice(0, 5)
            .map(m => `- ${m.memory || m.text || JSON.stringify(m)}`)
            .join('\n');
          console.log(`✅ Found ${searchResults.length} relevant memories`);
        } else {
          console.log('ℹ️ No relevant memories found');
        }
      } catch (error) {
        console.log('⚠️ Mem0 lookup failed:', error.message);
      }
    }

    // --- Read project structure for context ---
    let projectContext = '';
    try {
      if (fs.existsSync('CLAUDE.md')) {
        const claudeMd = fs.readFileSync('CLAUDE.md', 'utf8');
        // Take first 3000 chars for context
        projectContext = claudeMd.substring(0, 3000);
      }
    } catch (error) {
      console.log('⚠️ Could not read CLAUDE.md');
    }

    // --- Call Claude API ---
    const client = new Anthropic({ apiKey });

    const prompt = buildPrompt({
      title: issueTitle,
      body: issueBody,
      number: issueNumber,
      author: issueAuthor,
      labels: issueLabels,
      memories: projectMemories,
      projectContext
    });

    console.log('🤖 Asking Claude to analyze issue...\n');

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const plan = response.content[0].text;

    // --- Save plan ---
    const output = formatOutput(plan, issueNumber, issueAuthor);
    fs.writeFileSync('issue-plan.md', output);

    // --- Detect labels ---
    const labels = detectLabels(issueTitle, issueBody);
    fs.writeFileSync('issue-labels.json', JSON.stringify(labels));

    // --- Store in Mem0 ---
    if (mem0Key) {
      try {
        console.log('🧠 Storing issue context in Mem0...');
        const mem0 = new MemoryClient({ apiKey: mem0Key });
        await mem0.add(
          [{ role: 'user', content: `Issue #${issueNumber}: "${issueTitle}". ${issueBody.substring(0, 500)}. Plan was created for this issue.` }],
          { user_id: MEM0_USER_ID }
        );
        console.log('✅ Issue context stored in Mem0');
      } catch (error) {
        console.log('⚠️ Failed to store in Mem0:', error.message);
      }
    }

    console.log('✅ Plan generated successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);

    const errorOutput = `# ⚠️ Claude Issue Planner Failed

**Error**: ${error.message}

The automated issue analysis could not be completed. Please check:
1. \`ANTHROPIC_API_KEY\` is configured in repo secrets
2. The issue has sufficient description
3. Check [workflow logs](../../actions) for details

---
*🤖 Automated by Claude AI*
`;
    fs.writeFileSync('issue-plan.md', errorOutput);
    process.exit(1);
  }
}

function buildPrompt({ title, body, number, author, labels, memories, projectContext }) {
  let memorySection = '';
  if (memories) {
    memorySection = `
## Project Memory (from Mem0)
These are relevant things we remember about this project:
${memories}
`;
  }

  let contextSection = '';
  if (projectContext) {
    contextSection = `
## Project Context
${projectContext}
`;
  }

  return `You are a senior software architect analyzing a GitHub issue for the CountryTV24 project (a 24/7 country music streaming platform).

# Issue #${number}

**Title**: ${title}
**Author**: @${author}
**Labels**: ${labels || 'none'}

**Description**:
${body || 'No description provided.'}

${memorySection}
${contextSection}

# Your Task

Analyze this issue and create a detailed implementation plan. Respond in the following format:

## 1. Understanding
- What is being requested? (1-2 sentences, simple language)
- Why does it matter? (user impact)

## 2. Classification
- **Type**: feature / bug / refactor / docs / chore
- **Priority**: high / medium / low
- **Complexity**: small (< 1 hour) / medium (1-4 hours) / large (4+ hours)
- **Risk**: low / medium / high

## 3. Branch Name
Suggest a branch name following convention:
\`feature/short-description\` or \`fix/short-description\` or \`refactor/short-description\`

## 4. Implementation Plan

### Files to Create/Modify
List each file with what needs to change:
- \`path/to/file.ts\` - Description of changes

### Step-by-Step Plan
1. [Step 1 with details]
2. [Step 2 with details]
3. [Step 3 with details]
...

### Technical Considerations
- Dependencies needed
- API changes
- Database/storage changes
- Frontend vs backend changes

## 5. Testing Plan
- How to verify the changes work
- Edge cases to consider

## 6. Suggested Labels
List appropriate GitHub labels: enhancement, bug, documentation, etc.

---

**Guidelines**:
- Be specific about file paths and code locations
- Keep the plan actionable - someone should be able to follow it step by step
- Consider the existing tech stack: vanilla JS frontend, Express + TypeScript backend, Vercel serverless
- Reference existing patterns in the codebase when possible
- Keep language simple and clear`;
}

function detectLabels(title, body) {
  const text = `${title} ${body}`.toLowerCase();
  const labels = [];

  if (text.includes('bug') || text.includes('fix') || text.includes('error') || text.includes('broken')) {
    labels.push('bug');
  }
  if (text.includes('feature') || text.includes('add') || text.includes('new') || text.includes('implement')) {
    labels.push('enhancement');
  }
  if (text.includes('doc') || text.includes('readme') || text.includes('documentation')) {
    labels.push('documentation');
  }
  if (text.includes('performance') || text.includes('slow') || text.includes('optimize')) {
    labels.push('performance');
  }
  if (text.includes('security') || text.includes('vulnerability') || text.includes('auth')) {
    labels.push('security');
  }
  if (text.includes('ui') || text.includes('design') || text.includes('style') || text.includes('css')) {
    labels.push('ui');
  }

  // Default if nothing detected
  if (labels.length === 0) {
    labels.push('needs-triage');
  }

  return labels;
}

function formatOutput(plan, issueNumber, author) {
  return `# 🤖 Claude Implementation Plan

**Issue**: #${issueNumber}
**Requested by**: @${author}
**Analyzed by**: Claude AI
**Date**: ${new Date().toISOString().split('T')[0]}

---

${plan}

---

## Next Steps

1. Review this plan and comment if you want changes
2. Create a branch with the suggested name
3. Implement following the step-by-step plan
4. Create a PR referencing this issue: \`Closes #${issueNumber}\`

> **Tip**: You can use Spec-Kit commands to refine this plan:
> - \`/speckit.specify\` to create a detailed specification
> - \`/speckit.plan\` to generate technical architecture
> - \`/speckit.tasks\` to break it into tasks
> - \`/speckit.implement\` to start coding

---

<details>
<summary>About this plan</summary>

This implementation plan was automatically generated by Claude AI when this issue was created.
Project memory is maintained via Mem0 for context across issues.

**Limitations**: AI analysis may miss project-specific nuances. Always review before implementing.
</details>

*🤖 Automated by [Claude AI](https://www.anthropic.com/claude) with [Mem0](https://mem0.ai) memory*
`;
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
