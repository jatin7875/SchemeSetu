function ProgressBar({ value = 0, label, tone = "primary" }) {
  const safeValue = Math.max(0, Math.min(Number(value) || 0, 100));

  return (
    <div className={`progress-bar progress-${tone}`} aria-label={label || `Progress ${safeValue}%`}>
      <span style={{ width: `${safeValue}%` }} />
    </div>
  );
}

export default ProgressBar;
