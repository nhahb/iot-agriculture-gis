// App.js
import {Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import Layout from './components/layout/AppSidebar';
import RequireAuth from './pages/RequireAuth';
import Admin from './pages/Admin';
import PersistLogin from './pages/PersistLogin';
import Users from './pages/Users';
import Device from './pages/Device';
import Notifications from './pages/Notifications';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from './components/ui/sonner';

function App() {


  return (
    <>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="register" element={<Register />} />

      <Route path="/" element={
        <NotificationProvider>
        <Layout />
        </NotificationProvider>
        }>

        <Route element={<PersistLogin />}>

          <Route element={<RequireAuth allowedRole="user" />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="user">
              <Route path="account" element={<Users />} />
              <Route path="devices" element={<Device/>} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
          </Route>

          <Route element={<RequireAuth allowedRole="admin" />}>
            <Route path="admin" element={<Admin />} />
          </Route>
          
        </Route>
      </Route>
    </Routes>
    <Toaster />
    </>
  );
}
export default App
