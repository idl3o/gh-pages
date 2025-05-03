import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import WalletDemo from './pages/WalletDemo'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/wallet-demo" element={<WalletDemo />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
