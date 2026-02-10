#!/usr/bin/env node

/**
 * Seed Mem0 with CountryTV24 Project Documentation
 *
 * This script loads the full project context into Mem0 so that
 * Claude has comprehensive knowledge about the project in GitHub Actions.
 *
 * Usage: node tools/seed-mem0.js
 * Requires: MEM0_API_KEY in .env or environment
 */

import MemoryClient from 'mem0ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// Load .env
config({ path: path.join(ROOT, '.env') });

const MEM0_USER_ID = 'countrytv24-project';

async function main() {
  const apiKey = process.env.MEM0_API_KEY;
  if (!apiKey) {
    console.error('❌ MEM0_API_KEY not found. Set it in .env or environment.');
    process.exit(1);
  }

  const client = new MemoryClient({ apiKey });
  console.log('🧠 Seeding Mem0 with CountryTV24 project documentation...\n');

  // Define all the knowledge chunks to store
  const memories = [
    // --- Project Overview ---
    {
      category: 'Project Overview',
      content: `CountryTV24 is a 24/7 live streaming country music platform at countrytv24.com. It plays Billboard chart hits with real-time viewer counter and authentic TV broadcast effects. Built with vanilla JavaScript, Node.js, and deployed on Vercel. Repository: github.com/bedomax/countrytv24.com`
    },

    // --- Tech Stack ---
    {
      category: 'Tech Stack',
      content: `CountryTV24 tech stack: Frontend uses vanilla JavaScript (no frameworks), YouTube IFrame API for video, CSS3 animations for TV effects, and PWA support. Backend uses Node.js + Express with TypeScript, Vercel Serverless Functions for production, and Socket.IO for real-time features (local dev only). Data comes from Playwright scraping Billboard charts, YouTube search for videos, Wikipedia scraping, and Spotify API.`
    },

    // --- Project Structure ---
    {
      category: 'Project Structure',
      content: `CountryTV24 file structure: apps/web/public/ has the static web app (index.html, app.js, style.css, playlist.json). api/ has Vercel serverless functions (viewer-count.js, mem0.js). backend/ has the Express server (server/server.ts) and scrapers (billboard.ts, wikipedia-scraper.ts, spotify-search.ts). backend/services/ has mem0-service.ts and auto-update-service.ts. tools/ has add-song.ts for manual additions.`
    },

    // --- Core Features ---
    {
      category: 'Core Features',
      content: `CountryTV24 features: 96+ country songs from Billboard charts, continuous 24/7 autoplay with randomized playlist, YouTube video integration, smart audio handling with "Yeehaw!" unmute button, fullscreen player with live TV effects (scan lines, noise, signal interference, vignette), LIVE indicator with pulsing animation, real viewer counter using IP-based tracking, playlist sidebar, keyboard shortcuts (arrows, space, P for playlist, L for like, M for memory panel).`
    },

    // --- Mem0 Integration ---
    {
      category: 'Mem0 Integration',
      content: `CountryTV24 uses Mem0 for AI memory. Frontend tracks user plays/likes/skips via /api/mem0 endpoint, stores as semantic memories per user (IP+UA fingerprint). "Your Taste" panel shows personalized insights. Backend mem0-service.ts wraps MemoryClient. Vercel serverless api/mem0.js handles production. MEM0_USER_ID 'countrytv24-project' is used for project-level memory in GitHub Actions.`
    },

    // --- Viewer Counter ---
    {
      category: 'Viewer Counter',
      content: `CountryTV24 viewer counter: In production (Vercel), uses serverless /api/viewer-count.js with IP+UserAgent session tracking, in-memory storage (resets on cold start), 15-second inactivity timeout. Real numbers only, no fake counts. In local dev, uses Socket.IO WebSocket for real-time updates. Counter shown in top bar of the UI.`
    },

    // --- Scraping Strategy ---
    {
      category: 'Scraping Strategy',
      content: `CountryTV24 scraping: Billboard charts (Hot Country Songs, Country Airplay) via Playwright in backend/scrapers/billboard.ts. Wikipedia for historical chart data in wikipedia-scraper.ts. YouTube search for video IDs integrated in scrapers. Spotify API in spotify-search.ts for metadata. Manual additions via tools/add-song.ts (npm run add-song). Playlist saved to apps/web/public/playlist.json.`
    },

    // --- Live TV Effects ---
    {
      category: 'Live TV Effects',
      content: `CountryTV24 live TV effects in style.css: Scan lines (horizontal overlay), TV noise (static texture), signal interference (random glitch animations), vignette (dark edge framing), CRT curvature (optional vintage look). These are core to the user experience and must always be preserved. All effects use CSS only, no JavaScript overhead.`
    },

    // --- Deployment ---
    {
      category: 'Deployment',
      content: `CountryTV24 deployment: Vercel with auto-deploy on main branch push. Build command: npm run vercel-build. Output: apps/web/public. API routes auto-detected from /api/ directory. Environment variables: ANTHROPIC_API_KEY, MEM0_API_KEY, OPENAI_API_KEY (optional), YOUTUBE_API_KEY (optional), SPOTIFY_CLIENT_ID/SECRET (optional). vercel.json configures routing.`
    },

    // --- GitHub Actions ---
    {
      category: 'GitHub Actions',
      content: `CountryTV24 GitHub Actions: claude-code-review.yml triggers on PRs to main/develop, runs Claude AI code review with Mem0 context. claude-issue-planner.yml triggers on new issues AND issue comments - Claude generates implementation plans and responds conversationally. Both use @anthropic-ai/sdk and mem0ai. Secrets needed: ANTHROPIC_API_KEY, MEM0_API_KEY.`
    },

    // --- SEO ---
    {
      category: 'SEO',
      content: `CountryTV24 SEO: Title "CountryTV24 - Live 24/7 Country Music Stream", optimized meta tags for country music keywords, Open Graph for social sharing, Twitter Cards, PWA manifest. SEO files: sitemap.xml and robots.txt in apps/web/public/. Mobile-first responsive design. Domain: countrytv24.com.`
    },

    // --- Architecture Decisions ---
    {
      category: 'Architecture Decisions',
      content: `CountryTV24 architecture decisions: Vanilla JS preferred over frameworks for performance. YouTube IFrame API for video to avoid hosting costs. Vercel for serverless simplicity. Socket.IO only for local dev (Vercel doesn't support persistent WebSockets). IP+UA fingerprint for user identification (no auth system). CSS-only TV effects. Billboard charts for song authenticity.`
    },

    // --- Known Issues ---
    {
      category: 'Known Issues',
      content: `CountryTV24 known issues: Browser autoplay restrictions (solved with "Yeehaw!" unmute button). Vercel cold starts reset viewer counter (future: Redis/KV). YouTube API quota 10,000 units/day, search costs 100 units. Billboard HTML structure may change breaking scraper. No service worker yet for offline PWA.`
    },

    // --- Coding Patterns ---
    {
      category: 'Coding Patterns',
      content: `CountryTV24 coding patterns: Singleton services (e.g. autoUpdateService, mem0Service). Vercel serverless handlers export default async function. Express routes in backend/server/server.ts. Songs in playlist.json format: {title, artist, videoId, chart}. CSS effects use absolute positioning with pointer-events:none. Frontend uses global functions in app.js, no module system.`
    },

    // --- Roadmap ---
    {
      category: 'Roadmap',
      content: `CountryTV24 planned features: Multiple genre channels (Rock, Pop, Hip-Hop), user favorites and playlists, real-time chat, AppleTV native app, iOS/Android apps, service worker for offline, persistent viewer counter (Redis/Vercel KV), automated testing (Jest/Playwright), performance monitoring, error logging (Sentry).`
    },

    // --- Commands ---
    {
      category: 'Development Commands',
      content: `CountryTV24 npm commands: 'npm run dev' scrapes songs + starts server. 'npm run scrape' runs all scrapers. 'npm run serve' starts Express server only. 'npm run add-song' manual song addition CLI. 'npm run vercel-build' builds for Vercel. Local server runs on port 3000.`
    }
  ];

  let success = 0;
  let failed = 0;

  for (const mem of memories) {
    try {
      process.stdout.write(`  📝 ${mem.category}...`);
      await client.add(
        [{ role: 'user', content: mem.content }],
        { user_id: MEM0_USER_ID }
      );
      console.log(' ✅');
      success++;
    } catch (error) {
      console.log(` ❌ ${error.message}`);
      failed++;
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n🧠 Mem0 seeding complete!`);
  console.log(`   ✅ ${success} memories stored`);
  if (failed > 0) console.log(`   ❌ ${failed} failed`);
  console.log(`   👤 User ID: ${MEM0_USER_ID}`);
  console.log(`\n💡 These memories will be available to Claude in GitHub Actions.`);
  console.log(`   Test with: node -e "import('mem0ai').then(m => new m.default.MemoryClient({apiKey: process.env.MEM0_API_KEY}).search('CountryTV24 tech stack', {user_id: '${MEM0_USER_ID}'}).then(console.log))"`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
