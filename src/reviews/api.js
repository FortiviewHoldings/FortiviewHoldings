import { submitForm, readItems } from "../platform/doors.js";

// Reviews live in the PragOptics environment's own reviews table (platform/config.js names the install).
// A new review is submitted there and shows once it has been approved; the rail reads the approved rows.
// The static reviews.json shipped with the site is only the fallback when the platform cannot be read.

export async function submitReview({ name, rating, comment }) {
  await submitForm("reviews", { name: String(name).trim(), rating: String(Number(rating)), comment: String(comment).trim() });
  return true;
}

export async function loadReviews() {
  try {
    const items = await readItems("reviews", { limit: 50 });
    return items.map((i) => ({
      id: i.id,
      name: (i.fields && i.fields.name) || "",
      rating: (i.fields && i.fields.rating) || "5",
      comment: (i.fields && i.fields.comment) || "",
      created_at: i.at || ""
    }));
  } catch {
    const res = await fetch("/reviews/reviews.json", { cache: "no-store" });
    if (!res.ok) throw new Error("failed to load reviews");
    return res.json();
  }
}
