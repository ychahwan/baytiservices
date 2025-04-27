import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Home,
  LogOut,
  FolderTree,
  Briefcase,
  UserCog,
  Menu,
  Store as StoreIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={`flex flex-col h-screen bg-white shadow-sm ${
        isCollapsed ? 'w-16' : 'w-64'
      } transition-all duration-300 ease-in-out`}
    >
      <button
        onClick={toggleSidebar}
        className="p-4 text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <Menu className="h-6 w-6" />
      </button>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => navigate('/welcome')}
              className={`flex items-center w-full py-2 px-3 rounded-md text-sm font-medium ${
                isActive('/welcome')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } focus:outline-none transition-colors duration-150`}
            >
              <Home className="h-4 w-4 mr-2" />
              {!isCollapsed && <span>Home</span>}
            </button>
          </li>

          <li>
            <button
              onClick={() => navigate('/stores')}
              className={`flex items-center w-full py-2 px-3 rounded-md text-sm font-medium ${
                isActive('/stores')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } focus:outline-none transition-colors duration-150`}
            >
              <StoreIcon className="h-4 w-4 mr-2" />
              {!isCollapsed && <span>Stores</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/service-providers')}
              className={`flex items-center w-full py-2 px-3 rounded-md text-sm font-medium ${
                isActive('/service-providers')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } focus:outline-none transition-colors duration-150`}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              {!isCollapsed && <span>Service Providers</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/operators')}
              className={`flex items-center w-full py-2 px-3 rounded-md text-sm font-medium ${
                isActive('/operators')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } focus:outline-none transition-colors duration-150`}
            >
              <Users className="h-4 w-4 mr-2" />
              {!isCollapsed && <span>Operators</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/field-operators')}
              className={`flex items-center w-full py-2 px-3 rounded-md text-sm font-medium ${
                isActive('/field-operators')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } focus:outline-none transition-colors duration-150`}
            >
              <Users className="h-4 w-4 mr-2" />
              {!isCollapsed && <span>Field Operators</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/service-categories')}
              className={`flex items-center w-full py-2 px-3 rounded-md text-sm font-medium ${
                isActive('/service-categories')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } focus:outline-none transition-colors duration-150`}
            >
              <FolderTree className="h-4 w-4 mr-2" />
              {!isCollapsed && <span>Services</span>}
            </button>
          </li>

          <li>
            <button
              onClick={() => navigate('/settings')}
              className={`flex items-center w-full py-2 px-3 rounded-md text-sm font-medium ${
                isActive('/settings')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } focus:outline-none transition-colors duration-150`}
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              {!isCollapsed && <span>Settings</span>}
            </button>
          </li>
          {/* <li>
            <button
              onClick={() => navigate('/user-roles')}
              className={`flex items-center w-full py-2 px-3 rounded-md text-sm font-medium ${
                isActive('/user-roles')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } focus:outline-none transition-colors duration-150`}
            >
              <UserCog className="h-4 w-4 mr-2" />
              {!isCollapsed && <span>User Roles (Draft)</span>}
            </button>
          </li> */}
          {/* <li>
            <button
              onClick={() => navigate('/search')}
              className={`flex items-center w-full py-2 px-3 rounded-md text-sm font-medium ${
                isActive('/search')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } focus:outline-none transition-colors duration-150`}
            >
              <SearchIcon className="h-4 w-4 mr-2" />
              {!isCollapsed && <span>Search (Draft)</span>}
            </button>
          </li> */}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={handleSignOut}
          className="flex items-center w-full py-2 px-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none transition-colors duration-150"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}
