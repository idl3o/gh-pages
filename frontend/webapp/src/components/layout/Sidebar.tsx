import { useState } from 'react';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <button className={styles.toggleButton} onClick={toggleSidebar}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isCollapsed ? (
            // Chevron right
            <polyline points="9 18 15 12 9 6"></polyline>
          ) : (
            // Chevron left
            <polyline points="15 18 9 12 15 6"></polyline>
          )}
        </svg>
      </button>
      
      <div className={styles.sidebarContent}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Browse</h3>
          <ul className={styles.menuList}>
            <li className={styles.menuItem}>
              <a href="/trending" className={styles.menuLink}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
                <span className={styles.menuText}>Trending</span>
              </a>
            </li>
            <li className={styles.menuItem}>
              <a href="/latest" className={styles.menuLink}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span className={styles.menuText}>Latest</span>
              </a>
            </li>
            <li className={styles.menuItem}>
              <a href="/categories" className={styles.menuLink}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span className={styles.menuText}>Categories</span>
              </a>
            </li>
          </ul>
        </div>
        
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Your Content</h3>
          <ul className={styles.menuList}>
            <li className={styles.menuItem}>
              <a href="/subscriptions" className={styles.menuLink}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <span className={styles.menuText}>Subscriptions</span>
              </a>
            </li>
            <li className={styles.menuItem}>
              <a href="/history" className={styles.menuLink}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20v-6M6 20V10M18 20V4"></path>
                </svg>
                <span className={styles.menuText}>History</span>
              </a>
            </li>
            <li className={styles.menuItem}>
              <a href="/library" className={styles.menuLink}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <span className={styles.menuText}>Your Library</span>
              </a>
            </li>
          </ul>
        </div>

        {!isCollapsed && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Creator Tools</h3>
            <ul className={styles.menuList}>
              <li className={styles.menuItem}>
                <a href="/studio" className={styles.menuLink}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </svg>
                  <span className={styles.menuText}>Creator Studio</span>
                </a>
              </li>
              <li className={styles.menuItem}>
                <a href="/analytics" className={styles.menuLink}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                    <line x1="6" y1="6" x2="6.01" y2="6"></line>
                    <line x1="6" y1="18" x2="6.01" y2="18"></line>
                  </svg>
                  <span className={styles.menuText}>Analytics</span>
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;