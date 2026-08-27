import { Routes, Route } from "react-router-dom";
import Layout from "./chrome/Layout.jsx";
import Home from "./pages/Home.jsx";
import Education from "./pages/Education.jsx";
import Guide from "./pages/Guide.jsx";
import Contact from "./pages/Contact.jsx";
import BreakIn from "./pages/BreakIn.jsx";
import PartnerApply from "./pages/PartnerApply.jsx";
import ContentPage from "./pages/ContentPage.jsx";
import industrial from "./data/pages/industrial.json";
import instrumentSupport from "./data/pages/instrument-support.json";
import partnerships from "./data/pages/partnerships.json";
import integration from "./data/pages/integration.json";
import terms from "./data/pages/terms.json";
import NotFound from "./pages/NotFound.jsx";
import PulseSidebar from "./pulse/PulseSidebar.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/education" element={<Education />} />
        <Route path="/education/:slug" element={<Guide />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/break-in" element={<BreakIn />} />
        <Route path="/partnerships/apply" element={<PartnerApply />} />
        <Route path="/industrial" element={<><ContentPage data={industrial} /><PulseSidebar /></>} />
        <Route path="/instrument-support" element={<ContentPage data={instrumentSupport} />} />
        <Route path="/partnerships" element={<ContentPage data={partnerships} />} />
        <Route path="/integration" element={<ContentPage data={integration} />} />
        <Route path="/integration/terms" element={<ContentPage data={terms} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
