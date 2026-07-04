import { NavLink } from "react-router-dom";
import { ReactNode } from "react";

interface SidebarLink {
  to: string;
  label: string;
  icon?: ReactNode;
}

export default function Sidebar({ links }: { links: SidebarLink[] }) {
  return (
    <aside className="w-full shrink-0 md:w-56">
      <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              `focus-ring whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-teal text-sand"
                  : "text-ink/70 hover:bg-ink/5 dark:text-sand/70 dark:hover:bg-sand/10"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
