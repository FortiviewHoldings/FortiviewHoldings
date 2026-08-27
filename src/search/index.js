// Full-text search over the education guides. Pure functions, no UI, no deps —
// import buildIndex/search anywhere. The corpus is a few hundred sections, so a
// scored scan beats the ceremony of an inverted index and stays readable.

const STOP = new Set("a an and are as at be by for from in is it of on or the to with".split(" "));

function tokenize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9\s.-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

// One searchable record per guide section.
export function buildIndex(guides) {
  const records = [];
  for (const g of guides) {
    for (const s of g.sections) {
      records.push({
        slug: g.slug,
        guide: g.title,
        sectionId: s.id,
        question: s.question,
        text: s.text || "",
        qTokens: tokenize(s.question),
        tTokens: tokenize(s.text)
      });
    }
  }
  return records;
}

function scoreRecord(rec, terms, phrase) {
  let score = 0;
  let hit = 0;

  for (const term of terms) {
    let t = 0;
    for (const w of rec.qTokens) {
      if (w === term) t += 6;
      else if (w.startsWith(term)) t += 3;
    }
    for (const w of rec.tTokens) {
      if (w === term) t += 2;
      else if (w.startsWith(term)) t += 0.5;
    }
    if (t > 0) hit++;
    score += t;
  }

  // Reward covering the whole query, and an exact phrase in the question.
  if (hit === terms.length) score *= 1 + hit * 0.4;
  if (phrase.length > 2) {
    if (rec.question.toLowerCase().includes(phrase)) score += 20;
    else if (rec.text.toLowerCase().includes(phrase)) score += 8;
  }
  return score;
}

export function search(index, query, limit = 20) {
  const terms = tokenize(query);
  if (!terms.length) return [];
  const phrase = String(query).toLowerCase().trim();

  return index
    .map((rec) => ({ rec, score: scoreRecord(rec, terms, phrase) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ rec, score }) => ({
      slug: rec.slug,
      guide: rec.guide,
      sectionId: rec.sectionId,
      question: rec.question,
      snippet: snippet(rec.text, terms),
      score
    }));
}

// A ~28-word window around the first matching term, for the result list.
function snippet(text, terms) {
  const lower = text.toLowerCase();
  let at = -1;
  for (const term of terms) {
    const i = lower.indexOf(term);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1) return text.slice(0, 160).trim();
  const words = text.slice(Math.max(0, at - 90)).split(/\s+/).slice(0, 28).join(" ");
  return (at > 90 ? "… " : "") + words.trim() + " …";
}
