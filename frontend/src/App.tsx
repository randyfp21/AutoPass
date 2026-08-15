import React, { useState, useEffect, ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import BottomNav from './components/common/BottomNav';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import VehiclesPage from './pages/VehiclesPage';
import ActivityPage from './pages/ActivityPage';
import SpentPage from './pages/SpentPage';
import WorkshopDashboardPage from './pages/WorkshopDashboardPage';
import ThreadsFeedPage from './pages/ThreadsFeedPage';
import ThreadsBookmarkPage from './pages/ThreadsBookmarkPage';
import ThreadsActivityPage from './pages/ThreadsActivityPage';
import UserProfilePage from './pages/UserProfilePage';
import { AddPlannerModal } from './components/planner/AddPlannerModal';
import { AddServiceModal } from './components/service/AddServiceModal';
import { ServiceOptionSelectorModal } from './components/common/ServiceOptionSelectorModal';
import { vehicleService } from './services/vehicleService';
import { plannerService } from './services/plannerService';
import { maintenanceService } from './services/maintenanceService';
import type { Vehicle, CreatePlannerData, CreateServiceRecordData } from './types';

// ─── Protected Route (requires authenticated user) ────────────────────────────

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'workshop_owner' | 'admin';
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Memuat sesi...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ─── Guest Route (redirect if already authed) ─────────────────────────────────

function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ─── App Layout (with Navbar & BottomNav) ─────────────────────────────────────

interface AppLayoutProps {
  children: ReactNode;
  onOpenAddPlanner: () => void;
}

function AppLayout({ children, onOpenAddPlanner }: AppLayoutProps) {
  const location = useLocation();
  const isThreadsMode = location.pathname.startsWith('/threads');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased selection:bg-purple-500 selection:text-white">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      {!isThreadsMode && <BottomNav onOpenAddPlanner={onOpenAddPlanner} />}
    </div>
  );
}

// ─── Main App Component ───────────────────────────────────────────────────────

export function App() {
  const { isAuthenticated, user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showOptionSelectorModal, setShowOptionSelectorModal] = useState(false);
  const [showAddPlannerModal, setShowAddPlannerModal] = useState(false);
  const [showAddInstantServiceModal, setShowAddInstantServiceModal] = useState(false);
  const [selectedInstantVehicle, setSelectedInstantVehicle] = useState<Vehicle | null>(null);

  // Pre-fetch vehicles when logged in so FAB modals can populate vehicle options
  useEffect(() => {
    if (isAuthenticated && user) {
      vehicleService.getVehicles().then((data) => {
        setVehicles(data);
        if (data.length > 0) {
          setSelectedInstantVehicle(data[0]);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated, user]);

  const handleGlobalCreatePlanner = async (data: CreatePlannerData) => {
    await plannerService.createPlanner(data);
    window.location.reload(); // Refresh current page state
  };

  const handleGlobalCreateInstantService = async (data: CreateServiceRecordData) => {
    if (!selectedInstantVehicle) return;
    await maintenanceService.createServiceRecord(selectedInstantVehicle.id, data);
    window.location.reload(); // Refresh current page state
  };

  return (
    <>
      <Routes>
        {/* Root redirect */}
        <Route
          path="/"
          element={
            isAuthenticated && user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Guest routes */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />

        {/* Core Tracker Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout onOpenAddPlanner={() => setShowOptionSelectorModal(true)}>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/spent"
          element={
            <ProtectedRoute>
              <AppLayout onOpenAddPlanner={() => setShowOptionSelectorModal(true)}>
                <SpentPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <AppLayout onOpenAddPlanner={() => setShowOptionSelectorModal(true)}>
                <ActivityPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/plan"
          element={
            <ProtectedRoute>
              <AppLayout onOpenAddPlanner={() => setShowOptionSelectorModal(true)}>
                <ActivityPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute>
              <AppLayout onOpenAddPlanner={() => setShowOptionSelectorModal(true)}>
                <VehiclesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles/:id"
          element={
            <ProtectedRoute>
              <AppLayout onOpenAddPlanner={() => setShowOptionSelectorModal(true)}>
                <VehicleDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workshop"
          element={
            <ProtectedRoute requiredRole="workshop_owner">
              <AppLayout onOpenAddPlanner={() => setShowOptionSelectorModal(true)}>
                <WorkshopDashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Odo Threads Module Routes */}
        <Route
          path="/threads"
          element={
            <ProtectedRoute>
              <AppLayout onOpenAddPlanner={() => {}}>
                <ThreadsFeedPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/threads/bookmarks"
          element={
            <ProtectedRoute>
              <AppLayout onOpenAddPlanner={() => {}}>
                <ThreadsBookmarkPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/threads/activity"
          element={
            <ProtectedRoute>
              <AppLayout onOpenAddPlanner={() => {}}>
                <ThreadsActivityPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/threads/user/:id"
          element={
            <ProtectedRoute>
              <AppLayout onOpenAddPlanner={() => {}}>
                <UserProfilePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/threads/user/*"
          element={
            <ProtectedRoute>
              <AppLayout onOpenAddPlanner={() => {}}>
                <UserProfilePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route
          path="*"
          element={
            isAuthenticated && user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>

      {/* Service Option Selector Modal */}
      <ServiceOptionSelectorModal
        isOpen={showOptionSelectorModal}
        onClose={() => setShowOptionSelectorModal(false)}
        onSelectSchedulePlan={() => setShowAddPlannerModal(true)}
        onSelectInstantLog={() => setShowAddInstantServiceModal(true)}
      />

      {/* 1. Schedule Plan Modal */}
      <AddPlannerModal
        isOpen={showAddPlannerModal}
        onClose={() => setShowAddPlannerModal(false)}
        vehicles={vehicles}
        onSubmit={handleGlobalCreatePlanner}
      />

      {/* 2. Instant Log Servis Modal */}
      {selectedInstantVehicle && (
        <AddServiceModal
          isOpen={showAddInstantServiceModal}
          onClose={() => setShowAddInstantServiceModal(false)}
          vehicleCategory={selectedInstantVehicle.category}
          currentMileage={selectedInstantVehicle.current_mileage}
          vehicles={vehicles}
          onSubmit={handleGlobalCreateInstantService}
        />
      )}
    </>
  );
}

export default App;
