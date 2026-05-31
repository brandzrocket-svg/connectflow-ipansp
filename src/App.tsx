import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import Dashboard from './pages/Dashboard';
import AreaPage from './pages/AreaPage';
import Login from './pages/Login';

export default function App() {
  useTheme(); // inicializa o tema salvo
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/area/:slug" element={<AreaPage />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
