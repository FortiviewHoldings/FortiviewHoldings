#!/usr/bin/env node
/* ============================================================
   IndexNow submitter for bridgesindust.com

   Tells Bing (and every other participating IndexNow engine) that
   pages have changed, instead of waiting to be crawled. Bing's index
   is what feeds ChatGPT and Copilot, so this is the fast path into
   AI answers. Google does not participate — Search Console covers it.

   Usage, from the repo root:

     node scripts/indexnow.mjs            recently changed pages (7 days)
     node scripts/indexnow.mjs --all      every URL in the sitemap
     node scripts/indexnow.mjs --days 30  changed in the last 30 days
     node scripts/indexnow.mjs --dry      show what would be sent, send nothing

   The key lives in a <key>.txt file at the repo root and is discovered
   automatically, so rotating it means dropping in a new file and
   deleting the old one. Nothing here is secret: the key file is public
   by design, that is how the engines verify you own the domain.
   ============================================================ */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const HOST = 'bridgesindust.com'
const ENDPOINT = 'https://api.indexnow.org/indexnow'
const MAX_PER_POST = 10000

const args = process.argv.slice(2)
const has = (f) => args.includes(f)
const dry = has('--dry')
const all = has('--all')
const days = (() => {
  const i = args.indexOf('--days')
  return i !== -1 && args[i + 1] ? Number(args[i + 1]) : 7
})()

/* ---------- find the key ---------- */
const keyFile = fs.readdirSync(ROOT).find((f) => /^[A-Za-z0-9-]{8,128}\.txt$/.test(f) && f !== 'robots.txt' && f !== 'llms.txt')
if (!keyFile) {
  console.error('No IndexNow key file found at the repo root.')
  console.error('Expected a file named <key>.txt whose contents are the key itself.')
  process.exit(1)
}
const key = fs.readFileSync(path.join(ROOT, keyFile), 'utf8').trim()
if (key !== path.basename(keyFile, '.txt')) {
  console.error(`Key file ${keyFile} does not contain its own filename as the key.`)
  console.error(`  filename says: ${path.basename(keyFile, '.txt')}`)
  console.error(`  contents say : ${key}`)
  process.exit(1)
}

/* ---------- read the sitemap ----------
   The sitemap is generated at build time and only exists on the live site,
   so fetch it from there — it is the single source of what is published.
   Every URL carries the deploy date as lastmod, so --days effectively means
   "everything from deploys in the window", which is what we want to announce. */
async function liveSitemap() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`https://${HOST}/sitemap.xml?cb=${Date.now()}`, {
        redirect: 'follow',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (err) {
      console.error(`sitemap fetch attempt ${attempt}/3: ${err.message}`)
      if (attempt < 3) await new Promise((r) => setTimeout(r, 5000))
    }
  }
  console.error(`Could not fetch https://${HOST}/sitemap.xml`)
  process.exit(1)
}
const xml = await liveSitemap()
const entries = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]*)<\/lastmod>)?/g)]
  .map((m) => ({ loc: m[1].trim(), lastmod: (m[2] || '').trim() }))

if (!entries.length) {
  console.error('No <url><loc> entries parsed from the live sitemap.')
  process.exit(1)
}

const cutoff = new Date(Date.now() - days * 86400000)
const selected = all
  ? entries
  : entries.filter((e) => e.lastmod && new Date(e.lastmod) >= cutoff)

const urls = selected.map((e) => e.loc).filter((u) => u.startsWith(`https://${HOST}/`))

console.log(`sitemap    : ${entries.length} URLs`)
console.log(`selecting  : ${all ? 'all' : `changed within ${days} days`} -> ${urls.length} URLs`)
console.log(`key        : ${key}`)
console.log(`key file   : https://${HOST}/${keyFile}`)

if (!urls.length) {
  console.log('\nNothing to submit. Use --all to force, or --days N to widen the window.')
  process.exit(0)
}
if (urls.length > MAX_PER_POST) {
  console.error(`\n${urls.length} URLs exceeds the ${MAX_PER_POST}-per-request limit.`)
  process.exit(1)
}

const payload = { host: HOST, key, keyLocation: `https://${HOST}/${keyFile}`, urlList: urls }

if (dry) {
  console.log('\n--dry: nothing sent. Payload would be:\n')
  console.log(JSON.stringify(payload, null, 2))
  process.exit(0)
}

/* ---------- verify the key file is actually reachable first ----------
   Retried, because when this runs straight after a push the Pages build
   has usually not finished yet. Without the wait the engines answer 403
   and the submission is wasted. */
const ATTEMPTS = Number(process.env.INDEXNOW_ATTEMPTS || 10)
const GAP_MS = Number(process.env.INDEXNOW_GAP_MS || 15000)

console.log('\nchecking the key file is live...')
let live = false
for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  try {
    const probe = await fetch(`https://${HOST}/${keyFile}?cb=${Date.now()}`, {
      redirect: 'follow',
      headers: { 'Cache-Control': 'no-cache' },
    })
    const body = (await probe.text()).trim()
    if (!probe.ok) throw new Error(`HTTP ${probe.status}`)
    if (body !== key) throw new Error(`served content does not match the key (got "${body.slice(0, 40)}")`)
    console.log(`  key file OK (attempt ${attempt})`)
    live = true
    break
  } catch (err) {
    const last = attempt === ATTEMPTS
    console.log(`  attempt ${attempt}/${ATTEMPTS}: ${err.message}${last ? '' : ` — retrying in ${GAP_MS / 1000}s`}`)
    if (!last) await new Promise((r) => setTimeout(r, GAP_MS))
  }
}
if (!live) {
  console.error(`\nKey file never became reachable at https://${HOST}/${keyFile}`)
  console.error(`Push ${keyFile} to the live site before submitting, or the engines return 403.`)
  process.exit(1)
}

/* ---------- submit ---------- */
console.log(`submitting ${urls.length} URLs to ${ENDPOINT} ...`)
const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
})

const MEANING = {
  200: 'OK — URLs submitted.',
  202: 'Accepted — URLs received, key validation still pending. This is normal on a first run.',
  400: 'Bad request — malformed payload.',
  403: 'Forbidden — key not found at the key file, or does not match.',
  422: 'Unprocessable — a URL does not belong to this host, or the key schema is wrong.',
  429: 'Too many requests — slow down.',
}
const text = await res.text().catch(() => '')
console.log(`\nHTTP ${res.status}  ${MEANING[res.status] || ''}`)
if (text.trim()) console.log(text.trim().slice(0, 500))
process.exit(res.status === 200 || res.status === 202 ? 0 : 1)
