import { useIntake } from "./useIntake.js";
import { flatten } from "./compose.js";
import { TO } from "./compose.js";

function Label({ f }) {
  return (
    <label htmlFor={"fld-" + f.name}>
      {f.label} {f.required && <span className="req">*</span>}
    </label>
  );
}

function Control({ f, value, placeholder, onChange }) {
  const common = {
    id: "fld-" + f.name,
    name: f.name,
    value: value ?? "",
    required: f.required,
    placeholder: placeholder ?? f.placeholder ?? undefined,
    "aria-label": f.label,
    onChange: (e) => onChange(f.name, e.target.value)
  };

  if (f.tag === "select") {
    return (
      <select {...common}>
        {f.options.map((o, i) => (
          <option key={i} value={o.value}>{o.text}</option>
        ))}
      </select>
    );
  }
  if (f.tag === "textarea") {
    return (
      <>
        <textarea {...common} maxLength={f.maxlength || undefined} minLength={f.minlength || undefined} rows={6} />
        {f.maxlength && (
          <div className="fv-form__count">{(value ?? "").length} / {f.maxlength}</div>
        )}
      </>
    );
  }
  return (
    <input
      {...common}
      type={f.type || "text"}
      maxLength={f.maxlength || undefined}
      autoComplete={f.autocomplete || undefined}
      inputMode={f.inputmode || undefined}
    />
  );
}

export default function Intake({ config, initial }) {
  const intake = useIntake(config, initial);
  const all = flatten(config);

  // A field driven by another select's data-hint-for takes that option's hint
  // as its placeholder.
  const hints = {};
  for (const f of all) {
    if (!f.dataHintFor) continue;
    const opt = f.options?.find((o) => o.value === intake.values[f.name]);
    if (opt?.hint) hints[f.dataHintFor] = opt.hint;
  }

  const field = (f) =>
    intake.shown(f) ? (
      <div className="fv-form__field" key={f.name}>
        <Label f={f} />
        <Control
          f={f}
          value={intake.values[f.name]}
          placeholder={hints[f.name]}
          onChange={intake.set}
        />
      </div>
    ) : null;

  return (
    <form className="fv-form" noValidate onSubmit={intake.submit}>
      {config.layout.map((group, i) =>
        group.row ? (
          <div className="fv-form__row" key={i}>{group.fields.map(field)}</div>
        ) : (
          field(group.fields[0])
        )
      )}

      <div className="fv-form__pot" aria-hidden="true">
        <label htmlFor="fld-pot">Leave this field empty</label>
        <input id="fld-pot" type="text" tabIndex={-1} autoComplete="off"
               value={intake.pot} onChange={(e) => intake.setPot(e.target.value)} />
      </div>

      {intake.error && <div className="fv-form__err" role="alert">{intake.error.text}</div>}

      <div className="fv-form__actions">
        <button className="btn btn--primary" type="submit">{config.submitLabel}</button>
        {intake.copy && (
          <button className="btn btn--ghost" type="button" onClick={intake.copyDetails}>Copy the details instead</button>
        )}
      </div>

      {intake.status && (
        <div className={"fv-form__status is-" + intake.status.tone} role="status" aria-live="polite">
          {intake.status.text}
        </div>
      )}

      {intake.dump && (
        <textarea className="fv-form__dump" readOnly rows={12} value={intake.dump} />
      )}

      <p className="fv-form__hint" style={{ marginTop: "12px" }}>
        Prefer to just write it? Email <a href={"mailto:" + TO} style={{ color: "var(--accent)" }}>{TO}</a>.
      </p>
    </form>
  );
}
