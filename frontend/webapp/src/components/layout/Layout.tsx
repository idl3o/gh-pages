import { ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className={styles.layoutContainer}>
      <Navbar />
      <div className={styles.mainContent}>
        <Sidebar />
        <main className={styles.contentArea}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;