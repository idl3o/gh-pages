import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import MainContent from './MainContent';

interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

const Layout = ({ 
  children, 
  sidebar, 
  fullWidth = false, 
  className = '' 
}: LayoutProps) => {
  // Determine if we should show the sidebar layout
  const hasSidebar = Boolean(sidebar);
  
  return (
    <>
      <Header />
      
      <MainContent 
        fullWidth={fullWidth} 
        className={`${hasSidebar ? 'with-sidebar' : ''} ${className}`}
      >
        {hasSidebar ? (
          <>
            {sidebar}
            <div className="content">
              {children}
            </div>
          </>
        ) : (
          children
        )}
      </MainContent>
      
      <Footer />
    </>
  );
};

export default Layout;