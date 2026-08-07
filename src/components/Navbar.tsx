import React from 'react';
import { UserProfile, AdHocOverride } from '../types';
import { Utensils, BookOpen, Settings, Calendar, Package, Sparkles, ChevronDown, Check, LogIn, LogOut, UserCheck } from 'lucide-react';
import { User } from 'firebase/auth';

export type ActiveTab = 'chat' | 'recipe_book' | 'profile' | 'planner' | 'pantry';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  profiles: UserProfile[];
  currentProfile: UserProfile;
  setCurrentProfile: (profile: UserProfile) => void;
  adHocOverride: AdHocOverride;
  onOpenAdHocModal: () => void;
  savedRecipesCount: number;
  authUser: User | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  profiles,
  currentProfile,
  setCurrentProfile,
  adHocOverride,
  onOpenAdHocModal,
  savedRecipesCount,
  authUser,
  onOpenAuthModal,
  onSignOut,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);

  const handleNavTabClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E5E3D8] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavTabClick('chat')}>
            <div className="w-9 h-9 rounded-full bg-[#5A5A40] flex items-center justify-center text-white shadow-sm">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="serif-heading text-2xl font-bold tracking-tight text-[#1C1C1C]">
                  Pantry<span className="text-[#5A5A40]">Pal</span>
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-[#5A5A40]/10 text-[#5A5A40] px-2 py-0.5 rounded-full border border-[#5A5A40]/20">
                  AI Chef
                </span>
              </div>
              <p className="text-[11px] text-[#575752] font-medium hidden sm:block">Conversational Recipe & Macro Engineer</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#F5F5F0] p-1.5 rounded-2xl border border-[#E5E3D8]">
            <button
              onClick={() => handleNavTabClick('chat')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'chat'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#575752] hover:text-[#1C1C1C] hover:bg-white/60'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${activeTab === 'chat' ? 'text-amber-200' : 'text-[#5A5A40]'}`} />
              AI Chef Chat
            </button>

            <button
              onClick={() => handleNavTabClick('recipe_book')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'recipe_book'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#575752] hover:text-[#1C1C1C] hover:bg-white/60'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${activeTab === 'recipe_book' ? 'text-amber-200' : 'text-[#D47A5F]'}`} />
              Recipe Book
              <span className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                activeTab === 'recipe_book' ? 'bg-white/20 text-white' : 'bg-[#D47A5F]/15 text-[#B55F46]'
              }`}>
                {savedRecipesCount}
              </span>
            </button>

            <button
              onClick={() => handleNavTabClick('profile')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'profile'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#575752] hover:text-[#1C1C1C] hover:bg-white/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              System Prompt & Profile
            </button>

            <button
              onClick={() => handleNavTabClick('planner')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'planner'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#575752] hover:text-[#1C1C1C] hover:bg-white/60'
              }`}
            >
              <Calendar className="w-4 h-4 text-[#D47A5F]" />
              Meal Planner
            </button>

            <button
              onClick={() => handleNavTabClick('pantry')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'pantry'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#575752] hover:text-[#1C1C1C] hover:bg-white/60'
              }`}
            >
              <Package className="w-4 h-4 text-[#5A5A40]" />
              Smart Pantry
            </button>
          </nav>

          {/* Right Controls: Ad-Hoc Scenario & Profile Selector */}
          <div className="flex items-center gap-3">
            {/* Ad-Hoc Override Badge Button */}
            <button
              onClick={onOpenAdHocModal}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                adHocOverride.active
                  ? 'bg-[#D47A5F]/10 text-[#B55F46] border-[#D47A5F]/40 ring-2 ring-[#D47A5F]/20'
                  : 'bg-[#F5F5F0] text-[#575752] border-[#E5E3D8] hover:bg-[#EAEAE2]'
              }`}
              title="Click to configure temporary scenario constraints"
            >
              <span className="w-2 h-2 rounded-full bg-[#D47A5F]"></span>
              <span className="hidden sm:inline">Scenario:</span>
              <span className="font-bold truncate max-w-[120px]">
                {adHocOverride.active ? adHocOverride.scenario : 'Standard Profile'}
              </span>
            </button>

            {/* Profile Dropdown (For both Logged in and Guest Users) */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition text-xs font-bold ${
                  authUser
                    ? 'bg-[#5A5A40]/10 hover:bg-[#5A5A40]/20 border-[#5A5A40]/30 text-[#5A5A40]'
                    : 'bg-[#F5F5F0] hover:bg-[#EAEAE2] border-[#E5E3D8] text-[#1C1C1C]'
                }`}
              >
                {authUser ? (
                  <UserCheck className="w-4 h-4 text-[#5A5A40]" />
                ) : (
                  <img
                    src={currentProfile.avatarUrl}
                    alt={currentProfile.name}
                    className="w-4 h-4 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="hidden md:inline truncate max-w-[110px]">
                  {authUser
                    ? authUser.displayName || authUser.email?.split('@')[0] || 'Account'
                    : currentProfile.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#575752]" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E5E3D8] py-2 z-50 animate-fadeIn">
                  {authUser && (
                    <div className="px-3 py-2 border-b border-[#F5F5F0]">
                      <p className="text-xs font-bold text-[#1C1C1C]">
                        {authUser.displayName || 'Signed In User'}
                      </p>
                      <p className="text-[11px] text-[#88886C] truncate">
                        {authUser.email || 'Private Account Active'}
                      </p>
                    </div>
                  )}

                  <div className="px-3 py-1.5 text-[11px] font-bold text-[#575752] uppercase tracking-wider mt-1">
                    Select System Diet Profile
                  </div>
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setCurrentProfile(p);
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-[#F5F5F0] transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.avatarUrl}
                          alt={p.name}
                          className="w-7 h-7 rounded-lg object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#1C1C1C]">{p.name}</p>
                          <p className="text-[10px] text-[#575752] truncate max-w-[140px]">
                            {p.dietaryRestrictions.join(', ') || 'No restrictions'}
                          </p>
                        </div>
                      </div>
                      {p.id === currentProfile.id && <Check className="w-4 h-4 text-[#5A5A40]" />}
                    </button>
                  ))}

                  <div className="border-t border-[#F5F5F0] mt-1 pt-1 space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold text-[#5A5A40] hover:bg-[#FAF9F5]"
                    >
                      + System Prompt Settings
                    </button>
                    {authUser ? (
                      <button
                        onClick={() => {
                          onSignOut();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs font-bold text-[#D47A5F] hover:bg-[#D47A5F]/10 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Log Out
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onOpenAuthModal();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs font-bold text-[#D47A5F] hover:bg-[#D47A5F]/10 flex items-center gap-2"
                      >
                        <LogIn className="w-3.5 h-3.5 text-[#D47A5F]" /> Log In / Sign Up
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!authUser && (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#D47A5F] hover:bg-[#B55F46] text-white text-xs font-bold shadow-xs transition"
              >
                <LogIn className="w-4 h-4 text-amber-200" />
                <span className="hidden sm:inline">Log In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav sub-bar */}
        <div className="flex lg:hidden overflow-x-auto gap-2 py-2 border-t border-[#E5E3D8] no-scrollbar">
          <button
            onClick={() => handleNavTabClick('chat')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'chat' ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F5F0] text-[#575752]'
            }`}
          >
            AI Chat
          </button>
          <button
            onClick={() => handleNavTabClick('recipe_book')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'recipe_book' ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F5F0] text-[#575752]'
            }`}
          >
            Recipe Book ({savedRecipesCount})
          </button>
          <button
            onClick={() => handleNavTabClick('profile')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'profile' ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F5F0] text-[#575752]'
            }`}
          >
            System Prompt
          </button>
          <button
            onClick={() => handleNavTabClick('planner')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'planner' ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F5F0] text-[#575752]'
            }`}
          >
            Meal Planner
          </button>
          <button
            onClick={() => handleNavTabClick('pantry')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'pantry' ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F5F0] text-[#575752]'
            }`}
          >
            Smart Pantry
          </button>
        </div>
      </div>
    </header>
  );
};
