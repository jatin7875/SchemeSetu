import { useState } from "react";
import { NavLink } from "react-router-dom";
import { BarChart3, FileCheck2, Gauge, Home, Menu, PlusCircle, SearchCheck, UserRound, X } from "lucide-react";
import Logo from "./Logo.jsx";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/recommended", label: "Recommendations", icon: SearchCheck },
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/verify-document", label: "Verify Document", icon: FileCheck2 },
  { to: "/admin/schemes", label: "Admin", icon: PlusCircle },
  { to: "/analytics", label: "Analytics", icon: BarChart3 }
];

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="app-navbar">
      <NavLink to="/" className="app-brand" onClick={() => setOpen(false)}>
        <Logo />
      </NavLink>

      <button
        className="nav-toggle"
        type="button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      <nav className={open ? "app-nav-links open" : "app-nav-links"}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)}>
            <Icon size={17} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

export default Navbar;
