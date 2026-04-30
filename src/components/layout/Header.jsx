import { Link, NavLink } from "react-router-dom";
import { site } from "../../data/site";

export default function Header() {
  const navLinkClass = ({ isActive }) =>
    `hover:opacity-50 ${isActive ? "opacity-100" : "opacity-70"}`;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-950/10 bg-[#f6f3ec]/85 px-5 py-4 backdrop-blur-xl md:px-8">
      <nav className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 text-sm font-medium uppercase tracking-[0.08em]">
        <Link to="/" className="text-lg font-black tracking-tight normal-case">
          {site.title}
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <NavLink to="/work" className={navLinkClass}>
            Work
          </NavLink>

          <NavLink to="/" className={navLinkClass}>
            3D
          </NavLink>

          <a href={`mailto:${site.email}`} className="normal-case hover:opacity-50">
            {site.email}
          </a>

          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
        </div>

        <NavLink to="/work" className="md:hidden">
          Work
        </NavLink>
      </nav>
    </header>
  );
}