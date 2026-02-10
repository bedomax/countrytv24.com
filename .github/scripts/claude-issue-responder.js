#!/usr/bin/env node

/**
 * Claude Issue Responder
 *
 * Responds to comments on issues with context from:
 * - The full conversation history
 * - Mem0 project memories
 * - CLAUDE.md project context
 */

import Anthropic from '@anthropic-ai/sdk';
import MemoryClient from 'mem0ai';
import fs from 'fs';

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MEM0_USER_ID = 'countrytv24-project';

async function main() {
  try {
    console.log('💬 Starting Claude Issue Responder...\n');

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const mem0Key = process.env.MEM0_API_KEY;
    const issueTitle = process.env.ISSUE_TITLE;
    const issueBody = process.env.ISSUE_BODY || '';
    const issueNumber = process.env.ISSUE_NUMBER;
    const issueAuthor = process.env.ISSUE_AUTHOR;
    const issueLabels = process.env.ISSUE_LABELS || '';
    const commentAuthor = process.env.COMMENT_AUTHOR;
    const commentBody = process.env.COMMENT_BODY || '';

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    console.log(`📋 Issue #${issueNumber}: ${issueTitle}`);
    console.log(`💬 Comment by: @${commentAuthor}`);
    console.log(`📝 Comment: ${commentBody.substring(0, 100)}...\n`);

    // --- Load conversation history ---
    let conversationHistory = [];
    try {
      if (fs.existsSync('conversation-history.json')) {
        conversationHistory = JSON.parse(fs.readFileSync('conversation-history.json', 'utf8'));
        console.log(`📜 Loaded ${conversationHistory.length} previous comments`);
      }
    } catch (error) {
      console.log('⚠️ Could not load conversation history');
    }

    // --- Mem0: Get project context ---
    let projectMemories = '';
    let mem0Client = null;
    if (mem0Key) {
      try {
        console.log('🧠 Fetching project memories from Mem0...');
        mem0Client = new MemoryClient({ apiKey: mem0Key });

        // Search for memories relevant to the comment + issue
        const searchQuery = `${commentBody.substring(0, 200)} ${issueTitle}`;
        const searchResults = await mem0Client.search(searchQuery, { user_id: MEM0_USER_ID });

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

    // --- Read project context ---
    let projectContext = '';
    try {
      if (fs.existsSync('CLAUDE.md')) {
        projectContext = fs.readFileSync('CLAUDE.md', 'utf8').substring(0, 3000);
      }
    } catch (error) {
      console.log('⚠️ Could not read CLAUDE.md');
    }

    // --- Build conversation for Claude ---
    const client = new Anthropic({ apiKey });

    const systemPrompt = buildSystemPrompt({
      issueTitle,
      issueBody,
      issueNumber,
      issueAuthor,
      issueLabels,
      projectMemories,
      projectContext
    });

    // Convert conversation history to Claude messages format
    const messages = buildMessages(conversationHistory, commentAuthor, commentBody);

    console.log('🤖 Asking Claude to respond...\n');

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      temperature: 0.4,
      system: systemPrompt,
      messages
    });

    const reply = response.content[0].text;

    // --- Save response ---
    const output = formatResponse(reply);
    fs.writeFileSync('issue-response.md', output);

    // --- Store conversation context in Mem0 ---
    if (mem0Client) {
      try {
        console.log('🧠 Storing conversation context in Mem0...');
        await mem0Client.add(
          [{ role: 'user', content: `On issue #${issueNumber} "${issueTitle}", @${commentAuthor} said: "${commentBody.substring(0, 300)}". Claude responded with guidance.` }],
          { user_id: MEM0_USER_ID }
        );
        console.log('✅ Conversation stored in Mem0');
      } catch (error) {
        console.log('⚠️ Failed to store in Mem0:', error.message);
      }
    }

    console.log('✅ Response generated successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);

    const errorOutput = `⚠️ I had trouble generating a response. Please check the [workflow logs](../../actions) for details.

*🤖 Claude AI*`;
    fs.writeFileSync('issue-response.md', errorOutput);
    process.exit(1);
  }
}

function buildSystemPrompt({ issueTitle, issueBody, issueNumber, issueAuthor, issueLabels, projectMemories, projectContext }) {
  let memorySection = '';
  if (projectMemories) {
    memorySection = `
## Project Memory (from Mem0)
Things we know about this project:
${projectMemories}
`;
  }

  return `You are Claude, a helpful AI collaborator working on the CountryTV24 project (a 24/7 country music streaming platform). You're having a conversation in a GitHub issue.

## Current Issue
- **Issue #${issueNumber}**: ${issueTitle}
- **Opened by**: @${issueAuthor}
- **Labels**: ${issueLabels || 'none'}
- **Description**: ${issueBody.substring(0, 1500)}

${memorySection}

## Project Context (from CLAUDE.md)
${projectContext.substring(0, 2000)}

## Your Role
- You're a collaborative team member, not just a code generator
- Answer questions clearly and specifically
- If the user answers your clarification questions, acknowledge their answers and update your recommendations
- If they ask technical questions, give concrete answers with file paths and code examples
- If they disagree with your plan, be open to alternatives
- If they provide new requirements, adjust the plan
- Ask follow-up questions when needed
- Be concise but thorough - GitHub comments should be scannable
- Use markdown formatting for readability
- Reference specific files in the project when relevant
- Remember: the tech stack is vanilla JS frontend, Express+TypeScript backend, Vercel serverless

## Guidelines
- Keep responses focused and actionable
- Don't repeat the full plan unless asked - reference specific parts
- If the user is ready to start, give them the first concrete step
- Be friendly and professional
- Use emoji sparingly for visual structure`;
}

function buildMessages(conversationHistory, currentAuthor, currentComment) {
  const messages = [];

  // Add conversation history (skip the latest comment since it's the trigger)
  for (const comment of conversationHistory) {
    // Skip the current triggering comment (it'll be the last one)
    if (comment.body === currentComment && comment.author === currentAuthor) {
      continue;
    }

    if (comment.isBot) {
      // Bot messages are "assistant" role
      messages.push({
        role: 'assistant',
        content: comment.body
      });
    } else {
      // Human messages are "user" role
      messages.push({
        role: 'user',
        content: `**@${comment.author}** said:\n\n${comment.body}`
      });
    }
  }

  // Add the current comment as the latest user message
  messages.push({
    role: 'user',
    content: `**@${currentAuthor}** said:\n\n${currentComment}`
  });

  // Ensure messages alternate correctly (Claude API requirement)
  // Merge consecutive same-role messages
  const merged = [];
  for (const msg of messages) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      merged[merged.length - 1].content += '\n\n---\n\n' + msg.content;
    } else {
      merged.push({ ...msg });
    }
  }

  // Ensure first message is user role
  if (merged.length > 0 && merged[0].role !== 'user') {
    merged.unshift({ role: 'user', content: '(Issue was created - see system prompt for details)' });
  }

  return merged;
}

function formatResponse(reply) {
  return `${reply}

---
*🤖 Claude AI · [Mem0 Memory](https://mem0.ai) · Reply to continue the conversation*`;
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
