import React, { useState, useEffect } from 'react';
import { InfraProvider, useInfra } from './context/InfraContext';
import { Header } from './components/navigation/Header';
import { Sidebar } from './components/navigation/Sidebar';
import { MobileNav } from './components/navigation/MobileNav';
import { InteractiveDemoTour } from './components/demo/InteractiveDemoTour';
import { LandingView } from './components/views/LandingView';
import { CommandCenterView } from './components/views/CommandCenterView';
import { AnalyzeView } from './components/views/AnalyzeView';
import { FullMapView } from './components/views/FullMapView';
import { PriorityQueueView } from './components/views/PriorityQueueView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { AuthoritiesView } from './components/views/AuthoritiesView';
import { ActivityLogView } from './components/views/ActivityLogView';
import { IssueDetailDrawer } from './components/dashboard/IssueDetailDrawer';
import { CommandPalette } from './components/common/CommandPalette';
import { ToastContainer } from './components/common/ToastContainer';

const AppContent: React.FC = () => {
  const { currentView, setCurrentView } = useInfra();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === '1') setCurrentView('landing');
      if (e.key === '2') setCurrentView('dashboard');
      if (e.key === '3') setCurrentView('analyze');
      if (e.key === '4') setCurrentView('map');
      if (e.key === '5') setCurrentView('queue');
      if (e.key === '6') setCurrentView('analytics');
      if (e.key === '7') setCurrentView('authorities');
      if (e.key === '8') setCurrentView('activity');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentView]);

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans pb-16 lg:pb-0 overflow-x-hidden">
      {/* Top Header */}
      <Header
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
        onStartDemo={() => setIsDemoTourOpen(true)}
      />

      {/* Main Container */}
      {currentView === 'landing' ? (
        <main className="flex-1">
          <LandingView />
        </main>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Navigation */}
          <Sidebar
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />

          {/* Main Operational View */}
          <main className="flex-1 lg:pl-64 overflow-y-auto">
            {currentView === 'dashboard' && <CommandCenterView />}
            {currentView === 'analyze' && <AnalyzeView />}
            {currentView === 'map' && <FullMapView />}
            {currentView === 'queue' && <PriorityQueueView />}
            {currentView === 'analytics' && <AnalyticsView />}
            {currentView === 'authorities' && <AuthoritiesView />}
            {currentView === 'activity' && <ActivityLogView />}
          </main>
        </div>
      )}

      {/* Slide-out Issue Detail Drawer */}
      <IssueDetailDrawer />

      {/* CMD/CTRL+K Command Palette */}
      <CommandPalette />

      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Mobile Bottom Navigation (Rule 14) */}
      {currentView !== 'landing' && (
        <MobileNav onStartDemo={() => setIsDemoTourOpen(true)} />
      )}

      {/* Interactive 2-Minute Demo Tour HUD (Rule 19) */}
      <InteractiveDemoTour
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <InfraProvider>
      <AppContent />
    </InfraProvider>
  );
}
