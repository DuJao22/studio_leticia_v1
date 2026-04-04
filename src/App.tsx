/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './pages/Client/Home';
import BookingFlow from './pages/Client/BookingFlow';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminLogin from './pages/Admin/Login';
import ClientLogin from './pages/Client/Login';
import ClientProfile from './pages/Client/Profile';

// Simple auth wrapper
function RequireAuth({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/agendar" element={<BookingFlow />} />
            <Route path="/login" element={<ClientLogin />} />
            <Route path="/perfil" element={<ClientProfile />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin" 
              element={
                <RequireAuth>
                  <AdminDashboard />
                </RequireAuth>
              } 
            />
          </Routes>
        </main>
        <footer className="relative z-50 pt-8 pb-12 text-center text-sm text-text-light bg-surface border-t border-secondary flex flex-col items-center justify-center gap-3">
          <p>Desenvolvido por João Layon, CEO da DS Company</p>
          <Link 
            to="/admin" 
            className="inline-flex items-center justify-center px-6 py-3 bg-secondary/50 text-accent font-medium rounded-xl hover:bg-secondary active:scale-95 transition-all border border-secondary shadow-sm"
          >
            Acesso Administrativo
          </Link>
        </footer>
      </div>
    </Router>
  );
}
