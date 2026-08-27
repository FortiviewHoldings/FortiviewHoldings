import { Routes, Route } from "react-router-dom";
import Layout from "./chrome/Layout.jsx";
import Home from "./pages/Home.jsx";
import Education from "./pages/Education.jsx";
import Guide from "./pages/Guide.jsx";
import Contact from "./pages/Contact.jsx";
import BreakIn from "./pages/BreakIn.jsx";
import PartnerApply from "./pages/PartnerApply.jsx";

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
      </Routes>
    </Layout>
  );
}
