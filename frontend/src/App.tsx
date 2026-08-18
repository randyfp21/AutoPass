import React, { useState, useEffect, ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import BottomNav from './components/common/BottomNav';
import ThreadsBottomNav from './components/threads/ThreadsBottomNav';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import VehiclesPage from './pages/VehiclesPage';
import ActivityPage from './pages/ActivityPage';
import SpentPage from './pages/SpentPage';
import WorkshopDashboardPage from './pages/WorkshopDashboardPage';
import LandingPage from './pages/LandingPage';
import ThreadsFeedPage from './pages/ThreadsFeedPage';
import ThreadsBookmarkPage from './pages/ThreadsBookmarkPage';
import ThreadsActivityPage from './pages/ThreadsActivityPage';
import UserProfilePage from './pages/UserProfilePage';
import ThreadDetailPage from './pages/ThreadDetailPage';
import ThreadPhotoViewerPage from './pages/ThreadPhotoViewerPage';
import TelemetryStudioPage from './pages/TelemetryStudioPage';
import ReceiptPhotoViewerPage from './pages/ReceiptPhotoViewerPage';
import { AddPlannerModal } from './components/planner/AddPlannerModal';
import { AddServiceModal } from './components/service/AddServiceModal';
import { ThreadComposerModal } from './components/threads/ThreadComposerModal';
import { ServiceOptionSelectorModal } from './components/common/ServiceOptionSelectorModal';
import { vehicleService } from './services/vehicleService';
import { plannerService } from './services/plannerService';
import { maintenanceService } from './services/maintenanceService';
import type { Vehicle, CreatePlannerData, CreateServiceRecordData } from './types';

// ─── Root Route Handler (Directs mobile app straight to Login/Dashboard, skipping Landing Page) ───

function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const isMobileApp = Capacitor.isNativePlatform();

  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isMobileApp) {
    return <Navigate to="/login" replace />;
  }

  return <LandingPage />;
}

// ─── Protected Route (requires authenticated user) ────────────────────────────

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 font-sans text-sm font-semibold">Memuat Odomtr...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ─── Public Only Route (redirects to dashboard if already logged in) ─────────

interface PublicOnlyRouteProps {
  children: ReactNode;
}

function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ─── Workshop Only Route ──────────────────────────────────────────────────────

interface WorkshopOnlyRouteProps {
  children: ReactNode;
}

function WorkshopOnlyRoute({ children }: WorkshopOnlyRouteProps) {
  const { user } = useAuth();

  if (user?.role !== 'workshop_owner') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ─── App Layout Wrapper (with Navbar + Floating BottomNav) ───────────────────

interface AppLayoutProps {
  children: ReactNode;
  onOpenAddPlanner?: () => void;
  onOpenNewThreadModal?: () => void;
}

function AppLayout({ children, onOpenAddPlanner, onOpenNewThreadModal }: AppLayoutProps) {
  const location = useLocation();
  const isThreadsMode = location.pathname.startsWith('/threads');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased selection:bg-purple-500 selection:text-white">
      <Navbar />
      <main
        key={location.pathname}
        className="flex-1 flex flex-col animate-page-smooth"
      >
        {children}
      </main>
      {isThreadsMode ? (
        <ThreadsBottomNav onOpenNewThreadModal={onOpenNewThreadModal} />
      ) : (
        <BottomNav onOpenAddPlanner={onOpenAddPlanner} />
      )}
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
  const [showNewThreadComposerModal, setShowNewThreadComposerModal] = useState(false);
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
    setShowAddPlannerModal(false);
    window.location.reload();
  };

  const handleGlobalCreateInstantService = async (data: CreateServiceRecordData) => {
    const targetVehicleId = data.vehicle_id || (selectedInstantVehicle ? selectedInstantVehicle.id : (vehicles[0] ? vehicles[0].id : ''));
    if (!targetVehicleId) return;
    await maintenanceService.createServiceRecord(targetVehicleId, data);
    setShowAddInstantServiceModal(false);
    window.location.reload();
  };

  return (
    <>
      <Routes>
        {/* Root Route: Mobile bypasses LandingPage straight to Login/Dashboard */}
        <Route path="/" element={<RootRoute />} />

        {/* Public Only routes */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />

        {/* Core Tracker Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout
                onOpenAddPlanner={() => setShowOptionSelectorModal(true)}
                onOpenNewThreadModal={() => setShowNewThreadComposerModal(true)}
              >
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/spent"
          element={
            <ProtectedRoute>
              <AppLayout
                onOpenAddPlanner={() => setShowOptionSelectorModal(true)}
                onOpenNewThreadModal={() => setShowNewThreadComposerModal(true)}
              >
                <SpentPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <AppLayout
                onOpenAddPlanner={() => setShowOptionSelectorModal(true)}
                onOpenNewThreadModal={() => setShowNewThreadComposerModal(true)}
              >
                <ActivityPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute>
              <AppLayout
                onOpenAddPlanner={() => setShowOptionSelectorModal(true)}
                onOpenNewThreadModal={() => setShowNewThreadComposerModal(true)}
              >
                <VehiclesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles/:id"
          element={
            <ProtectedRoute>
              <AppLayout
                onOpenAddPlanner={() => setShowOptionSelectorModal(true)}
                onOpenNewThreadModal={() => setShowNewThreadComposerModal(true)}
              >
                <VehicleDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/services/:serviceId/story"
          element={
            <ProtectedRoute>
              <TelemetryStudioPage />
            </ProtectedRoute>
          }
        />

        {/* Workshop Owner protected route */}
        <Route
          path="/workshop"
          element={
            <ProtectedRoute>
              <WorkshopOnlyRoute>
                <AppLayout
                  onOpenAddPlanner={() => setShowOptionSelectorModal(true)}
                  onOpenNewThreadModal={() => setShowNewThreadComposerModal(true)}
                >
                  <WorkshopDashboardPage />
                </AppLayout>
              </WorkshopOnlyRoute>
            </ProtectedRoute>
          }
        />

        {/* Odo Threads Social Module Protected routes */}
        <Route
          path="/threads"
          element={
            <ProtectedRoute>
              <AppLayout
                onOpenAddPlanner={() => {}}
                onOpenNewThreadModal={() => setShowNewThreadComposerModal(true)}
              >
                <ThreadsFeedPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/threads/bookmarks"
          element={
            <ProtectedRoute>
              <AppLayout
                onOpenAddPlanner={() => {}}
                onOpenNewThreadModal={() => setShowNewThreadComposerModal(true)}
              >
                <ThreadsBookmarkPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/threads/activity"
          element={
            <ProtectedRoute>
              <AppLayout
                onOpenAddPlanner={() => {}}
                onOpenNewThreadModal={() => setShowNewThreadComposerModal(true)}
              >
                <ThreadsActivityPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/threads/user/:id"
          element={
            <ProtectedRoute>
              <AppLayout
                onOpenAddPlanner={() => {}}
                onOpenNewThreadModal={() => setShowNewThreadComposerModal(true)}
              >
                <UserProfilePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/threads/user/*"
          element={
            <ProtectedRoute>
              <AppLayout
                onOpenAddPlanner={() => {}}
                onOpenNewThreadModal={() => setShowNewThreadComposerModal(true)}
              >
                <UserProfilePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Dedicated Thread Detail & Discussion Page Route */}
        <Route
          path="/threads/:id"
          element={
            <ProtectedRoute>
              <AppLayout
                onOpenAddPlanner={() => {}}
                onOpenNewThreadModal={() => setShowNewThreadComposerModal(true)}
              >
                <ThreadDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Dedicated Thread Photo Theater Mode Page Route */}
        <Route
          path="/threads/:threadId/photo"
          element={
            <ProtectedRoute>
              <ThreadPhotoViewerPage />
            </ProtectedRoute>
          }
        />

        {/* Dedicated Service Receipt Photo Viewer Page Route */}
        <Route
          path="/services/:serviceId/receipt-photo"
          element={
            <ProtectedRoute>
              <ReceiptPhotoViewerPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Global Option Selector Modal (Planner vs Instant Log) */}
      <ServiceOptionSelectorModal
        isOpen={showOptionSelectorModal}
        onClose={() => setShowOptionSelectorModal(false)}
        onSelectSchedulePlan={() => setShowAddPlannerModal(true)}
        onSelectInstantLog={() => setShowAddInstantServiceModal(true)}
      />

      {/* Global Add Planner Modal */}
      {showAddPlannerModal && (
        <AddPlannerModal
          isOpen={showAddPlannerModal}
          onClose={() => setShowAddPlannerModal(false)}
          vehicles={vehicles}
          onSubmit={handleGlobalCreatePlanner}
        />
      )}

      {/* Global Add Instant Service Modal */}
      {showAddInstantServiceModal && (
        <AddServiceModal
          isOpen={showAddInstantServiceModal}
          onClose={() => setShowAddInstantServiceModal(false)}
          vehicles={vehicles}
          onSubmit={handleGlobalCreateInstantService}
        />
      )}

      {/* Global New Thread Composer Modal */}
      {showNewThreadComposerModal && (
        <ThreadComposerModal
          isOpen={showNewThreadComposerModal}
          onClose={() => setShowNewThreadComposerModal(false)}
          vehicles={vehicles}
          onThreadCreated={() => {
            if (window.location.pathname === '/threads') {
              window.location.reload();
            }
          }}
        />
      )}
    </>
  );
}

export default App;
