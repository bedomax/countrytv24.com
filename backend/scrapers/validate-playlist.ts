#!/usr/bin/env tsx
/**
 * validate-playlist.ts
 * Playlist health check tool for CountryTV24.
 *
 * Checks each YouTube video ID in playlist.json for availability via the
 * YouTube oEmbed endpoint (no API key required, no quota consumed).
 * Sets `unavailable: true` on entries that fail; clears the flag on recovered ones.
 *
 * Usage:
 *   npx tsx backend/scrapers/validate-playlist.ts [options]
 *   npm run validate-playlist
 *
 * Options:
 *   --dry-run        Print results without modifying playlist.json
 *   --verbose        Print status for every song (not just failures)
 *   --concurrency N  Concurrent HTTP checks (default: 5)
 *   --timeout N      Milliseconds before a check times out (default: 5000)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Song {
  position: number;
  title: string;
  artist: string;
  youtubeId: string;
  addedDate: string;
  isNew?: boolean;
  unavailable?: boolean;
}

interface Playlist {
  lastUpdated: string;
  source: string;
  songs: Song[];
}

type CheckResult = 'available' | 'unavailable' | 'skipped';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function hasFlag(flag: string): boolean {
  return args.includes(flag);
}

function getFlagValue(flag: string, defaultValue: number): number {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) {
    const val = parseInt(args[idx + 1], 10);
    return isNaN(val) ? defaultValue : val;
  }
  return defaultValue;
}

const DRY_RUN = hasFlag('--dry-run');
const VERBOSE = hasFlag('--verbose');
const CONCURRENCY = getFlagValue('--concurrency', 5);
const TIMEOUT_MS = getFlagValue('--timeout', 5000);

// ---------------------------------------------------------------------------
// File paths
// ---------------------------------------------------------------------------

const PLAYLIST_PATH = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../../apps/web/public/playlist.json'
);

// ---------------------------------------------------------------------------
// YouTube oEmbed availability check
// ---------------------------------------------------------------------------

function checkVideoAvailability(youtubeId: string): Promise<CheckResult> {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;

    const timer = setTimeout(() => {
      req.destroy();
      console.warn(`  [TIMEOUT] ${youtubeId} — treating as skipped`);
      resolve('skipped');
    }, TIMEOUT_MS);

    const req = https.get(url, { headers: { 'User-Agent': 'CountryTV24-Validator/1.0' } }, (res) => {
      clearTimeout(timer);
      // Drain the response body so the socket is released
      res.resume();

      if (res.statusCode === 200) {
        resolve('available');
      } else if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 404) {
        resolve('unavailable');
      } else {
        // Unexpected status — treat as skipped to avoid false positives
        console.warn(`  [WARN] ${youtubeId} returned HTTP ${res.statusCode} — skipping`);
        resolve('skipped');
      }
    });

    req.on('error', (err) => {
      clearTimeout(timer);
      console.warn(`  [NET ERROR] ${youtubeId} — ${err.message} — skipping`);
      resolve('skipped');
    });
  });
}

// ---------------------------------------------------------------------------
// Concurrency helper: process items in batches of N
// ---------------------------------------------------------------------------

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('CountryTV24 Playlist Validator');
  if (DRY_RUN) console.log('(dry-run mode — playlist.json will NOT be modified)');
  console.log('');

  // Read playlist
  let playlist: Playlist;
  try {
    const raw = fs.readFileSync(PLAYLIST_PATH, 'utf-8');
    playlist = JSON.parse(raw) as Playlist;
  } catch (err) {
    console.error(`Fatal: could not read playlist.json at ${PLAYLIST_PATH}`);
    console.error((err as Error).message);
    process.exit(1);
  }

  const songs = playlist.songs;
  const songsWithId = songs.filter((s) => s.youtubeId);
  console.log(`Checking ${songsWithId.length} songs...\n`);

  let countAvailable = 0;
  let countNewlyUnavailable = 0;
  let countAlreadyFlagged = 0;
  let countSkipped = 0;
  let countRecovered = 0;

  const results = await runWithConcurrency(songsWithId, CONCURRENCY, async (song) => {
    const result = await checkVideoAvailability(song.youtubeId);
    return { song, result };
  });

  for (const { song, result } of results) {
    if (result === 'available') {
      countAvailable++;
      if (song.unavailable) {
        // Video recovered — clear the flag
        song.unavailable = false;
        countRecovered++;
        console.log(`[RECOVERED] ${song.artist} - ${song.title} (${song.youtubeId})`);
      } else if (VERBOSE) {
        console.log(`[PASS] ${song.artist} - ${song.title} (${song.youtubeId})`);
      }
    } else if (result === 'unavailable') {
      if (song.unavailable) {
        countAlreadyFlagged++;
        if (VERBOSE) {
          console.log(`[ALREADY FLAGGED] ${song.artist} - ${song.title} (${song.youtubeId})`);
        }
      } else {
        song.unavailable = true;
        countNewlyUnavailable++;
        console.log(`[FAIL] ${song.artist} - ${song.title} (${song.youtubeId}) → marked unavailable`);
      }
    } else {
      // skipped
      countSkipped++;
      if (VERBOSE) {
        console.log(`[SKIP] ${song.artist} - ${song.title} (${song.youtubeId})`);
      }
    }
  }

  // Summary
  console.log('');
  console.log('Summary:');
  console.log(`  Total songs checked:  ${songsWithId.length}`);
  console.log(`  Available:            ${countAvailable}`);
  console.log(`  Unavailable (new):    ${countNewlyUnavailable}`);
  console.log(`  Already flagged:      ${countAlreadyFlagged}`);
  console.log(`  Recovered:            ${countRecovered}`);
  console.log(`  Skipped (net errors): ${countSkipped}`);

  if (DRY_RUN) {
    console.log('\nDry-run complete. No changes written.');
    process.exit(0);
  }

  // Write updated playlist
  playlist.lastUpdated = new Date().toISOString();
  try {
    fs.writeFileSync(PLAYLIST_PATH, JSON.stringify(playlist, null, 2), 'utf-8');
    console.log('\nplaylist.json updated.');
  } catch (err) {
    console.error('Fatal: could not write playlist.json');
    console.error((err as Error).message);
    process.exit(1);
  }

  process.exit(0);
}

main();
