// Every guide JSON under ./guides is picked up automatically. Add a file,
// it shows up in the list, the routes, and the search index.
const modules = import.meta.glob("./guides/*.json", { eager: true });

export const GUIDES = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.title.localeCompare(b.title));

const bySlug = new Map(GUIDES.map((g) => [g.slug, g]));

export function guide(slug) {
  return bySlug.get(slug) ?? null;
}

// Every guide closes on "When this page runs out", which points onward and is not a question.
const CLOSING = "when-this-page-runs-out";

export function questions(g) {
  return g.sections.filter((s) => s.id !== CLOSING);
}

export function questionCount(g) {
  return questions(g).length;
}
