import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSettings } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  ClipboardList,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";

const Layout = () => {
  const { user, logout, isAdmin, isManagerOrAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState({ company_name: "Gestione Assenze", logo_base64: null });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/", icon: Calendar, label: "Calendario", show: true },
    { to: "/my-requests", icon: ClipboardList, label: "Le mie richieste", show: true },
    { to: "/approvals", icon: CheckSquare, label: "Approvazioni", show: isManagerOrAdmin() },
    { to: "/users", icon: Users, label: "Utenti", show: isAdmin() },
    { to: "/settings", icon: Settings, label: "Impostazioni", show: isAdmin() },
  ];

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      onClick={() => setSidebarOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`
      }
    >
      <Icon className="h-5 w-5" />
      {label}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.logo_base64 ? (
              <img src={settings.logo_base64} alt="Logo" className="h-8 w-auto" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="font-heading font-bold text-slate-900">{settings.company_name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            data-testid="mobile-menu-btn"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {settings.logo_base64 ? (
                <img src={settings.logo_base64} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
              )}
              <span className="font-heading font-bold text-lg text-slate-900 truncate">
                {settings.company_name}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-2">
              {navItems.filter(item => item.show).map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </nav>
          </ScrollArea>

          {/* User Menu */}
          <div className="p-4 border-t border-slate-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition-colors"
                  data-testid="user-menu-btn"
                >
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-900">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600"
                  data-testid="logout-btn"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Esci
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen pt-16 md:pt-0">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
