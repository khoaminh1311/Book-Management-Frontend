import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <Header
        isMobileNavOpen={isMobileNavOpen}
        onToggleNav={() => setIsMobileNavOpen((prev) => !prev)}
      />
      <Sidebar
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
      <main className="ml-0 lg:ml-64 pt-16 min-h-screen flex flex-col transition-[margin] duration-200">
        <Outlet />
      </main>
    </div>
  );
}
