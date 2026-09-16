import { Routes, Route, Link, Navigate } from 'react-router-dom';
import CustomerJoin from './pages/CustomerJoin.jsx';
import CustomerStatus from './pages/CustomerStatus.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

function isAdminLoggedIn() {
  return Boolean(localStorage.getItem('admin_token'));
}

// Simple route guard: redirects to login if there's no token.
// Note this only checks *presence* of a token, not validity -- an
// expired token still gets past this and fails on the first API call,
// which AdminDashboard handles by bouncing back to /admin/login.
function RequireAdmin({ children }) {
  return isAdminLoggedIn() ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">Queue System</Link>
        <Link to="/admin/login">Admin</Link>
      </header>

      <Routes>
        <Route path="/" element={<CustomerJoin />} />
        <Route path="/status/:tokenId" element={<CustomerStatus />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
      </Routes>
    </div>
  );
}
