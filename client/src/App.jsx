import React from 'react';
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import SuperadminDashboard from "./pages/SuperadminDashboard";
import StaffManagement from "./pages/admin/StaffManagement";
import StaffProfile from "./pages/admin/StaffProfile";
import EditStaffForm from "./components/EditStaffForm";
import WalletManagement from "./pages/admin/wallet/WalletManagement";
import WalletActivity from "./pages/admin/wallet/WalletActivity";
import ServiceManagement from "./pages/admin/service/ServiceManagement";
import CentreManagement from "./pages/superadmin/CentreManagement";
import SuperadminStaffManagement from './pages/superadmin/SuperadminStaffManagement';
import WalletManagementSuperAdmin from './pages/superadmin/WalletManagementSuperAdmin';
import ServiceManagementSuperAdmin from './pages/superadmin/ServiceManagementSuperAdmin';
import ReportsPage from './components/ReportsPage';
import Messenger from './pages/superadmin/MessengerPage';
import TeamManagement from "./pages/team/TeamManagement";
import TokenGenerator from "./pages/staff/TokenGenerator";
import ServiceEntry from "./pages/staff/ServiceEntry";
import TrackService from "./pages/staff/TrackServicePage";
import CustomerProfileSystem from './pages/CustomerProfileSystem';
import CampaignManagement from "./pages/campaign/CampaignManagement";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Login from "./pages/Login"; 

const ProtectedRoute = ({ allowedRoles, children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        console.log("ProtectedRoute: No token found in localStorage");
        setIsAuthenticated(false);
        return;
      }

      try {
        const response = await axios.get("https://your-app.onrender.com/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Token verification successful:", response.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Token verification failed:", err.response?.data || err.message);
        toast.error(err.response?.data?.error || "Session expired, please log in again", {
          position: "top-right",
          autoClose: 3000,
          theme: "light",
          toastId: "session-error",
        });
        localStorage.clear();
        setIsAuthenticated(false);
      }
    };
    verifyToken();
  }, [token]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-navy-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-gray-600">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !token || !role) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    console.log(`ProtectedRoute: Role ${role} not allowed. Allowed roles: ${allowedRoles}`);
    toast.error("Unauthorized access. Redirecting to login.", {
      position: "top-right",
      autoClose: 3000,
      theme: "light",
      toastId: "role-error",
    });
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

const App = () => {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to={`/dashboard/${localStorage.getItem("role") || "staff"}`} replace />} />
            <Route path="superadmin" element={<ProtectedRoute allowedRoles={["superadmin"]}><SuperadminDashboard /></ProtectedRoute>} />
            <Route path="admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="staff" element={<ProtectedRoute allowedRoles={["staff"]}><StaffDashboard /></ProtectedRoute>} />
            <Route path="supervisor" element={<ProtectedRoute allowedRoles={["supervisor"]}><SupervisorDashboard /></ProtectedRoute>} />

            <Route
              path="admin/staff"
              element={<ProtectedRoute allowedRoles={["admin", "superadmin"]}><StaffManagement /></ProtectedRoute>}
            />
            <Route
              path="admin/staff/:id"
              element={<ProtectedRoute allowedRoles={["admin", "superadmin"]}><StaffProfile /></ProtectedRoute>}
            />
            <Route
              path="admin/staff/edit/:id"
              element={<ProtectedRoute allowedRoles={["admin", "superadmin"]}><EditStaffForm /></ProtectedRoute>}
            />
            <Route
              path="admin/wallets"
              element={<ProtectedRoute allowedRoles={["admin", "superadmin"]}><WalletManagement /></ProtectedRoute>}
            />
            <Route
              path="admin/wallets/:walletId"
              element={<ProtectedRoute allowedRoles={["admin", "superadmin"]}><WalletActivity /></ProtectedRoute>}
            />
            <Route
              path="admin/services"
              element={<ProtectedRoute allowedRoles={["admin", "superadmin"]}><ServiceManagement /></ProtectedRoute>}
            />
            <Route
              path="admin/teams"
              element={<ProtectedRoute allowedRoles={["admin", "superadmin"]}><TeamManagement /></ProtectedRoute>}
            />
            <Route
              path="admin/campaigns"
              element={<ProtectedRoute allowedRoles={["admin", "superadmin"]}><CampaignManagement /></ProtectedRoute>}
            />
            <Route
              path="superadmin/centremanagement"
              element={<ProtectedRoute allowedRoles={["superadmin"]}><CentreManagement /></ProtectedRoute>}
            />
            <Route
              path="superadmin/staffmanagement"
              element={<ProtectedRoute allowedRoles={["superadmin"]}><SuperadminStaffManagement /></ProtectedRoute>}
            />
            <Route
              path="superadmin/walletmanagement"
              element={<ProtectedRoute allowedRoles={["superadmin"]}><WalletManagementSuperAdmin /></ProtectedRoute>}
            />
            <Route
              path="superadmin/servicemanagement"
              element={<ProtectedRoute allowedRoles={["superadmin"]}><ServiceManagementSuperAdmin /></ProtectedRoute>}
            />
            <Route
              path="superadmin/reports"
              element={<ProtectedRoute allowedRoles={["superadmin"]}><ReportsPage /></ProtectedRoute>}
            />
            <Route
              path="superadmin/messenger"
              element={<ProtectedRoute allowedRoles={["superadmin"]}><Messenger /></ProtectedRoute>}
            />  
            <Route
              path="staff/token"
              element={<ProtectedRoute allowedRoles={["staff", "supervisor"]}><TokenGenerator /></ProtectedRoute>}
            />
            <Route
              path="staff/service_entry"
              element={<ProtectedRoute allowedRoles={["staff", "supervisor"]}><ServiceEntry /></ProtectedRoute>}
            />
            <Route
              path="staff/track_service"
              element={<ProtectedRoute allowedRoles={["staff", "supervisor"]}><TrackService /></ProtectedRoute>}
            />
            <Route
              path="staff/customers"
              element={<ProtectedRoute allowedRoles={["staff", "supervisor"]}><CustomerProfileSystem /></ProtectedRoute>}
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

export default App;
