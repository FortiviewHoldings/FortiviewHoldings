import { useEffect, useState } from "react";

// False on the render that hydrates a prerendered page, true once the page is live. A form value the prerender
// cannot know (a query string, history state) waits for it, so hydration meets the markup the prerender wrote.
export function useLive() {
  const [live, setLive] = useState(false);
  useEffect(() => { setLive(true); }, []);
  return live;
}
