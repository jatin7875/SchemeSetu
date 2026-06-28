function Textarea({ label, error, helper, required, className = "", rows = 5, ...props }) {
  return (
    <label className={`field ${className}`.trim()}>
      <span>
        {label}
        {required && <b aria-hidden="true"> *</b>}
      </span>
      <textarea
        className={error ? "field-control has-error" : "field-control"}
        required={required}
        rows={rows}
        {...props}
      />
      {helper && <small>{helper}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export default Textarea;
