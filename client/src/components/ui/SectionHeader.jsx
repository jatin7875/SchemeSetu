function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="section-header">
      {eyebrow && <p>{eyebrow}</p>}
      <h2>{title}</h2>
      {subtitle && <span>{subtitle}</span>}
    </div>
  );
}

export default SectionHeader;
