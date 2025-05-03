import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import HomePage from './pages/HomePage';
import CreatorsPage from './pages/CreatorsPage';
import ViewerPage from './pages/ViewerPage';
import RegisterPage from './pages/RegisterPage';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <div className="app-container">
            <Header />
            <main className="page-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/creators" element={<CreatorsPage />} />
                <Route path="/viewer" element={<ViewerPage />} />
                <Route path="/register" element={<RegisterPage />} />
                {/* Add other routes as needed */}
              </Routes>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
