const PATH = "M12 3l2.4 5.2L20 9.3l-4 4 1 5.7L12 16.8 7 19l1-5.7-4-4 5.6-1.1L12 3z";

export function Star() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22"
         fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATH} />
    </svg>
  );
}

export function StaticRating({ value }) {
  return (
    <div className="review-rating">
      {Array.from({ length: value }, (_, i) => <Star key={i} />)}
    </div>
  );
}

export function RatingPicker({ value, onChange }) {
  return (
    <div className="fire-rating" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={n <= value ? "filled" : undefined}
          role="radio"
          aria-checked={n === value}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          tabIndex={0}
          onClick={() => onChange(n)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(n); } }}
        >
          <Star />
        </span>
      ))}
    </div>
  );
}
