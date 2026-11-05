import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F6FA] dark:bg-navy-950">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="md:mr-64">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="p-4 md:p-6 max-w-[1500px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
