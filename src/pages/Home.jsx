import { useEffect } from "react";
import Html from "./Html.jsx";
import Reviews from "../reviews/Reviews.jsx";
import PulseSidebar from "../pulse/PulseSidebar.jsx";
import home from "../data/home.json";

// Static hero/about and FAQ are content-as-data; the reviews section is a real
// component in between.
export default function Home() {
  useEffect(() => { document.title = "Bridges Industrial"; }, []);

  return (
    <>
      <Html html={home.introHtml} />
      <Reviews />
      <Html html={home.faqHtml} />
      <PulseSidebar />
    </>
  );
}
