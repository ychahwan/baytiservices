import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthForm } from './components/AuthForm';
import { Welcome } from './pages/Welcome';
import { OperatorManagement } from './pages/OperatorManagement';
import { OperatorForm } from './pages/OperatorForm';
import { FieldOperatorManagement } from './pages/FieldOperatorManagement';
import { FieldOperatorForm } from './pages/FieldOperatorForm';
import { ServiceCategories } from './pages/ServiceCategories';
import { ServiceProviderManagement } from './pages/ServiceProviderManagement';
import { ServiceProviderForm } from './pages/ServiceProviderForm';
import { StoreManagement } from './pages/StoreManagement';
import { StoreForm } from './pages/StoreForm';
import { UserRoleManagement } from './pages/UserRoleManagement';
import { Settings } from './pages/Settings';
import { Search } from './pages/Search';
import { Sidebar } from './components/Sidebar';

function AppContent() {
  const location = useLocation();
  const isAuthPage = (pathname: string) => {
    return pathname === '/login' || pathname === '/register';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {!isAuthPage(location.pathname) && <Sidebar />}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/login" element={<AuthForm type="login" />} />
          <Route path="/register" element={<AuthForm type="register" />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/operators" element={<OperatorManagement />} />
          <Route path="/operators/new" element={<OperatorForm />} />
          <Route path="/operators/:id" element={<OperatorForm />} />
          <Route path="/field-operators" element={<FieldOperatorManagement />} />
          <Route path="/field-operators/new" element={<FieldOperatorForm />} />
          <Route path="/field-operators/:id" element={<FieldOperatorForm />} />
          <Route path="/service-categories" element={<ServiceCategories />} />
          <Route path="/service-providers" element={<ServiceProviderManagement />} />
          <Route path="/service-providers/new" element={<ServiceProviderForm />} />
          <Route path="/service-providers/:id" element={<ServiceProviderForm />} />
          <Route path="/stores" element={<StoreManagement />} />
          <Route path="/stores/new" element={<StoreForm />} />
          <Route path="/stores/:id" element={<StoreForm />} />
          <Route path="/user-roles" element={<UserRoleManagement />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/search" element={<Search />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;