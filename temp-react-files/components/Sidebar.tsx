import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarItem {
  title: string;
  path: string;
  icon?: ReactNode;
  children?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  title?: string;
}

const Sidebar = ({ items, title = "Navigation" }: SidebarProps) => {
  const renderItems = (items: SidebarItem[]) => {
    return (
      <ul className="sidebar-nav">
        {items.map((item, index) => (
          <li key={index} className="sidebar-item">
            <NavLink 
              to={item.path}
              className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
              end={item.path === '/'}
            >
              {item.icon && <span className="sidebar-icon">{item.icon}</span>}
              <span>{item.title}</span>
            </NavLink>
            {item.children && renderItems(item.children)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">{title}</h2>
      </div>
      <div className="sidebar-content">
        {renderItems(items)}
      </div>
    </aside>
  );
};

export default Sidebar;