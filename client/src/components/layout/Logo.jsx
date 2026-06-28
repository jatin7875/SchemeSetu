import { Check, ShieldCheck } from "lucide-react";

function Logo() {
  return (
    <div className="scheme-logo" aria-label="SchemeSetu">
      <span className="scheme-logo-mark" aria-hidden="true">
        <span className="scheme-logo-band saffron" />
        <span className="scheme-logo-band white" />
        <span className="scheme-logo-band green" />
        <span className="scheme-logo-symbol">
          <ShieldCheck size={18} />
          <Check size={11} />
        </span>
      </span>
      <span className="scheme-logo-text">
        <strong>SchemeSetu</strong>
        <small>Citizen Scheme Assistant</small>
      </span>
    </div>
  );
}

export default Logo;
