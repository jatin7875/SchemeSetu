function normalizeBadge(value) {
  return String(value || "default").toLowerCase().replaceAll("_", "-").replace(/\s+/g, "-");
}

function Badge({ children, variant = "default", className = "" }) {
  return (
    <span className={`ui-badge ui-badge-${normalizeBadge(variant)} ${className}`.trim()}>
      {children}
    </span>
  );
}

export default Badge;
