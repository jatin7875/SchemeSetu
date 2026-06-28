function PageHeader({ breadcrumb, eyebrow, title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        {breadcrumb && <p className="page-breadcrumb">{breadcrumb}</p>}
        {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}

export default PageHeader;
