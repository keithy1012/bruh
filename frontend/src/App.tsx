import { useState } from 'react';
import { GoalsPage } from './components/GoalsPage';
import { CreditPage } from './components/CreditPage';
import { LearningPage } from './components/LearningPage';
import { BudgetPage } from './components/BudgetPage';
import { Target, CreditCard, GraduationCap, Wallet, Menu, X } from 'lucide-react';

type Page = 'goals' | 'credit' | 'learning' | 'budget';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('goals');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'goals' as Page, icon: Target, label: 'Goals' },
    { id: 'credit' as Page, icon: CreditCard, label: 'Credit' },
    { id: 'learning' as Page, icon: GraduationCap, label: 'Learning' },
    { id: 'budget' as Page, icon: Wallet, label: 'Budget' },
  ];

  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-[#1e3a5f] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2">
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8" />
              <h1 className="text-lg sm:text-xl">FinanceFlow</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentPage === item.id 
                      ? 'bg-white text-[#1e3a5f]' 
                      : 'hover:bg-[#2d4f7f]'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
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
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      currentPage === item.id 
                        ? 'bg-white text-[#1e3a5f]' 
                        : 'hover:bg-[#2d4f7f]'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {currentPage === 'goals' && <GoalsPage />}
        {currentPage === 'credit' && <CreditPage />}
        {currentPage === 'learning' && <LearningPage />}
        {currentPage === 'budget' && <BudgetPage />}
      </main>
    </div>
  );
}