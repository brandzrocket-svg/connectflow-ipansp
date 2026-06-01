import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import Dashboard from './pages/Dashboard';
import AreaPage from './pages/AreaPage';
import Login from './pages/Login';

export default function App() {
  useTheme();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/area/:slug" element={<AreaPage />} />
        <Route path="/login" element={<Login />} />
        {/* Old routes — redirect to main dashboard */}
        <Route path="/visao-geral" element={<Navigate to="/" replace />} />
        <Route path="/sobre" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
