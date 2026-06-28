function Input({ label, error, helper, required, className = "", icon: Icon, ...props }) {
  return (
    <label className={`field ${className}`.trim()}>
      <span>
        {label}
        {required && <b aria-hidden="true"> *</b>}
      </span>
      <div className={Icon ? "field-control-wrap" : ""}>
        {Icon && <Icon size={17} aria-hidden="true" />}
        <input className={error ? "field-control has-error" : "field-control"} required={required} {...props} />
      </div>
      {helper && <small>{helper}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export default Input;
