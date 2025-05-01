import { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const MainContent = ({ 
  children, 
  className = '', 
  fullWidth = false 
}: MainContentProps) => {
  return (
    <main className={`main-content ${fullWidth ? 'full-width' : ''} ${className}`}>
      <div className="container">
        {children}
      </div>
    </main>
  );
};

export default MainContent;