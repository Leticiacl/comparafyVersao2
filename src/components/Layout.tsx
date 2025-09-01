import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { HomeIcon, ListIcon, BarChartIcon, ScanLineIcon, UserIcon } from 'lucide-react';
const Layout: React.FC = () => {
  const navItems = [{
    to: '/dashboard',
    icon: <HomeIcon className="w-5 h-5" />,
    label: 'Início'
  }, {
    to: '/lists',
    icon: <ListIcon className="w-5 h-5" />,
    label: 'Listas'
  }, {
    to: '/compare',
    icon: <BarChartIcon className="w-5 h-5" />,
    label: 'Comparar'
  }, {
    to: '/scanner',
    icon: <ScanLineIcon className="w-5 h-5" />,
    label: 'Scanner'
  }, {
    to: '/profile',
    icon: <UserIcon className="w-5 h-5" />,
    label: 'Perfil'
  }];
  return <div className="flex flex-col min-h-screen pb-16">
      <main className="flex-1 container mx-auto px-4 py-4 max-w-md">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 shadow-lg z-10">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {navItems.map(item => <NavLink key={item.to} to={item.to} className={({
          isActive
        }) => `flex flex-col items-center justify-center w-full h-full text-xs ${isActive ? 'text-yellow-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              {item.icon}
              <span className="mt-1">{item.label}</span>
            </NavLink>)}
        </div>
      </nav>
    </div>;
};
export default Layout;