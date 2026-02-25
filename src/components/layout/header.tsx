'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { getCookie } from 'cookies-next';
import { useEffect, useState } from 'react';

export function Header() {
  const [userName, setUserName] = useState('Admin');

  useEffect(() => {
    // Ambil nama user dari cookie jika ada
    const userCookie = getCookie('user');
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie as string);
        setUserName(user.name || 'Admin');
      } catch (e) {
        console.error('Failed to parse user cookie');
      }
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white/80 px-6 backdrop-blur-md transition-all">
      {/* Left: Breadcrumbs / Title */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-slate-800">Dashboard Overview</h2>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Search Bar Kecil */}
        <div className="hidden md:flex items-center rounded-full bg-slate-100 px-3 py-1.5 border border-slate-200">
          <Search className="h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="ml-2 bg-transparent text-sm outline-none placeholder:text-slate-400 w-40"
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-full p-2 hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-slate-200"></div>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-2">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-sm font-semibold text-slate-800">{userName}</span>
            <span className="text-[10px] text-slate-500">Super Administrator</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
            {userName.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}