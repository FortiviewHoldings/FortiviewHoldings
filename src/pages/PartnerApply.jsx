import FormPage from "./FormPage.jsx";
import config from "../data/forms/partner.json";

export default function PartnerApply() {
  return (
    <FormPage
      eyebrow="Become a partner"
      title="Become a partner."
      leads={[
        "Tell us what you do well and who you serve. We would rather grow a bench of people we trust than fight over a single job, and the fastest way into that is to say plainly what you offer.",
        "This is an introduction, not an application with a scoring rubric. If there is a fit, we will say so. If there is not, we will say that too rather than leave you waiting."
      ]}
      config={config}
    />
  );
}
