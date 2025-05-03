import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import WalletDemo from './pages/WalletDemo'
import DiscoverPage from './pages/DiscoverPage'
import ProfilePage from './pages/ProfilePage'
import CreatorStudio from './pages/CreatorStudio'
import { ThemeProvider } from './components/theme/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/wallet-demo" element={<WalletDemo />} />
            <Route path="/creator/:address" element={<ProfilePage />} />
            <Route path="/studio" element={<CreatorStudio />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
