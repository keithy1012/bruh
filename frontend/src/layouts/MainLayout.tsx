import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Target,
  CreditCard,
  GraduationCap,
  Wallet,
  Menu,
  X,
  Home,
} from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: "/dashboard", icon: Home, label: "Dashboard" },
  { path: "/goals", icon: Target, label: "Goals" },
  { path: "/credit", icon: CreditCard, label: "Credit" },
  { path: "/learning", icon: GraduationCap, label: "Learning" },
  { path: "/budget", icon: Wallet, label: "Budget" },
];

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-[#1e3a5f] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8" />
              <h1 className="text-lg sm:text-xl font-semibold">MoneyMap</h1>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? "bg-white text-[#1e3a5f]"
                      : "hover:bg-[#2d4f7f]"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-[#2d4f7f] rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/20">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? "bg-white text-[#1e3a5f]"
                        : "hover:bg-[#2d4f7f]"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;
