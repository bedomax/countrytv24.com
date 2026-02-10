#!/usr/bin/env node

/**
 * Claude Issue Planner with Mem0 Memory
 *
 * When an issue is created, Claude analyzes it, checks Mem0 for project context,
 * generates an implementation plan, and asks clarification questions.
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
    let mem0Client = null;
    if (mem0Key) {
      try {
        console.log('🧠 Fetching project memories from Mem0...');
        mem0Client = new MemoryClient({ apiKey: mem0Key });

        const searchResults = await mem0Client.search(
          `${issueTitle} ${issueBody.substring(0, 200)}`,
          { user_id: MEM0_USER_ID }
        );

        if (searchResults && searchResults.length > 0) {
          projectMemories = searchResults
            .slice(0, 10)
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
        projectContext = fs.readFileSync('CLAUDE.md', 'utf8').substring(0, 4000);
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
    if (mem0Client) {
      try {
        console.log('🧠 Storing issue context in Mem0...');
        await mem0Client.add(
          [{ role: 'user', content: `Issue #${issueNumber}: "${issueTitle}" by @${issueAuthor}. ${issueBody.substring(0, 500)}. Implementation plan was created.` }],
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
These are relevant things we know about this project from previous issues, PRs, and decisions:
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

  return `You are a senior software architect and helpful collaborator analyzing a GitHub issue for the CountryTV24 project (a 24/7 country music streaming platform).

# Issue #${number}

**Title**: ${title}
**Author**: @${author}
**Labels**: ${labels || 'none'}

**Description**:
${body || 'No description provided.'}

${memorySection}
${contextSection}

# Your Task

Analyze this issue and create a detailed implementation plan. Then, ask 2-3 clarification questions to make sure you understand the requirements correctly.

Respond in the following format:

## 🎯 Understanding
- What is being requested? (1-2 sentences, simple language)
- Why does it matter? (user impact)

## 📊 Classification
- **Type**: feature / bug / refactor / docs / chore
- **Priority**: high / medium / low
- **Complexity**: small (< 1 hour) / medium (2-4 hours) / large (4+ hours)
- **Risk**: low / medium / high

## 🌿 Branch Name
\`feature/short-description\` or \`fix/short-description\`

## 📋 Implementation Plan

### Files to Create/Modify
List each file with what needs to change.

### Step-by-Step
Numbered steps with clear actions.

### Technical Considerations
Dependencies, API changes, storage, frontend vs backend.

## 🧪 Testing Plan
How to verify, edge cases to consider.

## ❓ Questions Before Starting

**I'd like to clarify a few things before we start:**

1. [Question about scope, approach, or preference]
2. [Question about technical choice or trade-off]
3. [Question about priority or dependencies]

> Reply to this comment and I'll refine the plan based on your answers!

## 🏷️ Suggested Labels
List appropriate labels.

---

**Guidelines**:
- Be specific about file paths and code locations
- Keep the plan actionable
- Consider the existing tech stack: vanilla JS frontend, Express + TypeScript backend, Vercel serverless
- Reference existing patterns in the codebase
- Make the questions specific and helpful, not generic
- The questions should help you make better implementation decisions
- Be friendly and conversational`;
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
  if (text.includes('ui') || text.includes('design') || text.includes('style') || text.includes('css') || text.includes('mode')) {
    labels.push('ui');
  }

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

> 💬 **This is an interactive plan!** Reply to this comment with answers to the questions above, ask your own questions, or request changes to the plan. I'll respond and update the plan accordingly.

<details>
<summary>About this plan</summary>

This implementation plan was automatically generated by Claude AI. I have access to:
- **Project memory** (Mem0): I remember previous issues, PRs, and project decisions
- **Codebase context**: I can reference actual files and patterns in the project
- **Conversation**: I'll respond to your comments on this issue

**Limitations**: AI analysis may miss project-specific nuances. Always review before implementing.
</details>

*🤖 Automated by [Claude AI](https://www.anthropic.com/claude) with [Mem0](https://mem0.ai) memory*
`;
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
