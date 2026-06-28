function Card({ title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`ui-card ${className}`.trim()}>
      {(title || subtitle || actions) && (
        <div className="ui-card-header">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="ui-card-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export default Card;
