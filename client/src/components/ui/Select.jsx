function Select({ label, error, helper, required, children, className = "", ...props }) {
  return (
    <label className={`field ${className}`.trim()}>
      <span>
        {label}
        {required && <b aria-hidden="true"> *</b>}
      </span>
      <select className={error ? "field-control has-error" : "field-control"} required={required} {...props}>
        {children}
      </select>
      {helper && <small>{helper}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export default Select;
