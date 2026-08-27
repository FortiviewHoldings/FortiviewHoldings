import { useSearchParams } from "react-router-dom";
import FormPage from "./FormPage.jsx";
import config from "../data/forms/contact.json";

// ?topic= preselects the topic. The old site keyed off data-key on each option.
function initialFromTopic(key) {
  if (!key) return undefined;
  const sel = config.layout.flatMap((r) => r.fields).find((f) => f.name === "topic");
  const opt = sel?.options.find((o) => o.key === key);
  return opt ? { topic: opt.value } : undefined;
}

export default function Contact() {
  const [params] = useSearchParams();
  const initial = initialFromTopic(params.get("topic"));

  return (
    <FormPage
      eyebrow="Work with us"
      title="Tell us what you need."
      leads={[
        "Instrumentation and field work, technical training, control logic, custom hardware, short-run production, or the software side. Say what you are trying to do and a specialist answers you by email.",
        "We are a small operation, so replies go out in the order requests arrive. No account, no obligation, and we will tell you plainly if it is not work we should be doing."
      ]}
      config={config}
      initial={initial}
    />
  );
}
