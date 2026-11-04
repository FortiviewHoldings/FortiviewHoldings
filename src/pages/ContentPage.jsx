import Html from "./Html.jsx";
import { useHead } from "../useHead.js";

// A static content page extracted from the old HTML. Layout provides the single
// main landmark, so this renders a div with the page's original class.
export default function ContentPage({ data }) {
  useHead(data.route);

  return (
    <>
      {data.css && <style dangerouslySetInnerHTML={{ __html: data.css }} />}
      <Html html={data.html} className={data.mainClass} />
    </>
  );
}
