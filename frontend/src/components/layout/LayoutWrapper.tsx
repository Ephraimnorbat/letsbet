'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation'; // 🚀 Added to detect path
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('./Header'), { ssr: false });
const Sidebar = dynamic(() => import('./Sidebar'), { ssr: false });

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname(); // 🚀 Keep track of where the user is
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (mounted && !isMobile) {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        setIsSidebarCollapsed(JSON.parse(savedState));
      }
    }
  }, [mounted, isMobile]);

  const getSidebarWidth = () => {
    if (isMobile) return 'w-0';
    return isSidebarCollapsed ? 'w-20' : 'w-64';
  };

  const getMainMargin = () => {
    if (isMobile) return 'ml-0';
    return isSidebarCollapsed ? 'ml-20' : 'ml-64';
  };

  if (!mounted) {
    return null;
  }

  // 🚀 IF ON THE AUTH PAGE: Render cleanly without loading Header, Sidebar, or triggering layout guards
  if (pathname === '/auth') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Header onMenuToggle={() => setIsSidebarOpen(true)} />
      
      {/* Desktop Sidebar */}
      <div className={`hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] z-30 transition-all duration-300 ${getSidebarWidth()}`}>
        <Sidebar isOpen={true} onClose={() => {}} isMobile={false} />
      </div>
      
      {/* Mobile Sidebar Overlay */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isMobile={true} 
      />
      
      {/* Main Content Container */}
      <div className={`pt-16 transition-all duration-300 ${getMainMargin()}`}>
        {children}
      </div>
    </div>
  );
}