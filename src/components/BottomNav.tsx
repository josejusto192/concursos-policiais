import { NavLink } from 'react-router-dom';
import { STUDENT_LINKS } from './studentLinks';

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {STUDENT_LINKS.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon size={23} weight="duotone" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
