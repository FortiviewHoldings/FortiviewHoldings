import { useEffect } from "react";
import Html from "./Html.jsx";

// A static content page extracted from the old HTML. Layout provides the single
// main landmark, so this renders a div with the page's original class.
export default function ContentPage({ data }) {
  useEffect(() => {
    if (data.title) document.title = data.title;
  }, [data.title]);

  return <Html html={data.html} className={data.mainClass} />;
}
