import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <NavLink to="/" className="brand">
        SchemeSetu
      </NavLink>
      <nav className="nav-links">
        <NavLink to="/profile">Profile</NavLink>
        <NavLink to="/recommended">Recommendations</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/analytics">Analytics</NavLink>
        <NavLink to="/verify-document">Verify Document</NavLink>
        <NavLink to="/admin/add-scheme">Admin</NavLink>
      </nav>
    </header>
  );
}

export default Navbar;
