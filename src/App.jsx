import { Routes, Route } from "react-router-dom";
import Layout from "./chrome/Layout.jsx";
import Home from "./pages/Home.jsx";
import Education from "./pages/Education.jsx";
import Guide from "./pages/Guide.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/education" element={<Education />} />
        <Route path="/education/:slug" element={<Guide />} />
      </Routes>
    </Layout>
  );
}
