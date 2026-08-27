import { ISSUE_OMNITOK } from "./endpoint.js";

// Review submit, two steps: mint a single-use token, then post the review to
// the endpoint that token authorizes. Same flow the old homepage used; the
// URL lives in endpoint.js so the platform API can replace it in one place.

function sid() {
  let s = sessionStorage.getItem("sid");
  if (!s) {
    s = crypto.randomUUID();
    sessionStorage.setItem("sid", s);
  }
  return s;
}

async function getOmniTok(act) {
  const res = await fetch(ISSUE_OMNITOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ act, sid: sid() })
  });
  if (!res.ok) throw new Error("token request failed");
  const data = await res.json();
  return { ...data, sid: sid() };
}

export async function submitReview({ name, rating, comment }) {
  const { endpoint, authToken, OmniTok, sid: s } = await getOmniTok("createReview");
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-token": authToken,
      "X-OmniTok": OmniTok,
      "X-SID": s
    },
    body: JSON.stringify({
      id: `r-${Date.now()}`,
      name: name.trim(),
      rating: Number(rating),
      comment: comment.trim(),
      created_at: new Date().toISOString()
    })
  });
  if (!res.ok) throw new Error("review submit failed");
  return true;
}

export async function loadReviews() {
  const res = await fetch("/reviews/reviews.json", { cache: "no-store" });
  if (!res.ok) throw new Error("failed to load reviews");
  return res.json();
}
