import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Activity, Utensils, Target, Award, Watch, HeartPulse, 
  Users, UserCheck, Bell, User, Settings, LayoutDashboard
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Activities', path: '/activities', icon: Activity },
  { name: 'Nutrition', path: '/nutrition', icon: Utensils },
  { name: 'Goals', path: '/goals', icon: Target },
  { name: 'Achievements', path: '/achievements', icon: Award },
  { name: 'Devices', path: '/devices', icon: Watch },
  { name: 'Health Metrics', path: '/health', icon: HeartPulse },
  { name: 'Social', path: '/social', icon: Users },
  { name: 'Trainers', path: '/trainers', icon: UserCheck },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Profile', path: '/profile', icon: User },
];

export const Sidebar = () => {
  return (
    <div className="w-64 h-full bg-garmin-dark text-white flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-700 bg-black">
        <span className="text-xl font-bold tracking-wider">Fitness Connect</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  isActive ? 'bg-garmin-blue text-white border-l-4 border-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white border-l-4 border-transparent'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-700">
        <NavLink to="/settings" className="flex items-center px-2 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </NavLink>
      </div>
    </div>
  );
};
