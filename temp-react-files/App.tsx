import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BlockchainProvider } from './context/BlockchainContext';

// Import page components
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ContentPage from './pages/ContentPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';

// Import styles
import './styles/main.css';
import './styles/dashboard.css';
import './styles/content.css';
import './styles/home.css';

const App = () => {
  return (
    <BlockchainProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/content" element={<ContentPage />} />
          <Route path="/dashboard/content/upload" element={<ContentPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </BlockchainProvider>
  );
};

export default App;