import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useTheme } from "@/hooks/use-theme";
import { LogOut, User, Settings, Home, Bell, BarChart2, Calendar, FileText, Users, Mail } from 'lucide-react';
import { useState } from 'react';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  active: boolean;
};

export function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && 
    window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [navItems, setNavItems] = useState<NavItem[]>([
    { name: 'Dashboard', icon: <Home className="h-5 w-5" />, active: true },
    { name: 'Analytics', icon: <BarChart2 className="h-5 w-5" />, active: false },
    { name: 'Projects', icon: <FileText className="h-5 w-5" />, active: false },
    { name: 'Team', icon: <Users className="h-5 w-5" />, active: false },
    { name: 'Calendar', icon: <Calendar className="h-5 w-5" />, active: false },
    { name: 'Messages', icon: <Mail className="h-5 w-5" />, active: false },
  ]);

  const handleNavClick = (clickedItem: string) => {
    setNavItems(navItems.map(item => ({
      ...item,
      active: item.name === clickedItem
    })));
  };

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <div className={`w-64 p-4 border-r ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center space-x-2 p-4">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
            U
          </div>
          <span className="font-semibold">User Dashboard</span>
        </div>
        
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.name)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                item.active 
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                  : `hover:bg-gray-100 dark:hover:bg-slate-700 ${isDark ? 'text-gray-300' : 'text-gray-600'}`
              }`}
            >
              <span className={`${item.active ? 'text-blue-500' : ''}`}>
                {item.icon}
              </span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
        
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-slate-700">
          <button
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${
              isDark ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
          <button
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${
              isDark ? 'text-red-400 hover:bg-slate-700' : 'text-red-600 hover:bg-gray-100'
            }`}
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className={`border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-semibold">
              {navItems.find(item => item.active)?.name || 'Dashboard'}
            </h1>
            <div className="flex items-center space-x-4">
              <button aria-label="Notification" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                  U
                </div>
                <span className="text-sm font-medium">User</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <Card className={`${isDark ? 'bg-slate-800 border-slate-700' : ''}`}>
              <CardHeader className="pb-2">
                <CardDescription>Total Revenue</CardDescription>
                <CardTitle className="text-3xl">$45,231.89</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-green-500">+20.1% from last month</div>
              </CardContent>
            </Card>
            
            <Card className={`${isDark ? 'bg-slate-800 border-slate-700' : ''}`}>
              <CardHeader className="pb-2">
                <CardDescription>Active Projects</CardDescription>
                <CardTitle className="text-3xl">12</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-blue-500">+3 this week</div>
              </CardContent>
            </Card>
            
            <Card className={`${isDark ? 'bg-slate-800 border-slate-700' : ''}`}>
              <CardHeader className="pb-2">
                <CardDescription>Team Members</CardDescription>
                <CardTitle className="text-3xl">8</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-yellow-500">+1 new hire</div>
              </CardContent>
            </Card>
            
            {/* Recent Activity */}
            <div className="md:col-span-2 lg:col-span-3">
              <Card className={`${isDark ? 'bg-slate-800 border-slate-700' : ''}`}>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your recent activities and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex items-start space-x-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Project Update {item}</h4>
                            <span className="text-xs text-gray-500">{item}h ago</span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            The new design system has been implemented successfully.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
