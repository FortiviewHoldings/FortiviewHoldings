import { useLocation } from "react-router-dom";
import FormPage from "./FormPage.jsx";
import config from "../data/forms/break-in.json";

export default function BreakIn() {
  // Pulse can hand off the chat question to prefill the description.
  const { state } = useLocation();
  const initial = state?.issue ? { issue: state.issue } : undefined;

  return (
    <FormPage
      eyebrow="Free intake"
      title="Submit a Break-In."
      leads={[
        "In production, a break-in is the job that jumps the schedule because something is wrong right now. It is also our initials. So that is what we call this: tell us the problem you are stuck on, and a specialist answers you personally, by email, at no cost.",
        "You do not have to be a customer. You do not have to buy anything afterward. If we can point you at the answer in one reply, that is a good outcome for both of us."
      ]}
      config={config}
      initial={initial}
    />
  );
}
