function Button({
  as: Component = "button",
  children,
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
  icon: Icon,
  ...props
}) {
  return (
    <Component
      className={`ui-button ui-button-${variant} ui-button-${size} ${className}`.trim()}
      type={Component === "button" ? type : undefined}
      {...props}
    >
      {Icon && <Icon size={18} aria-hidden="true" />}
      <span>{children}</span>
    </Component>
  );
}

export default Button;
