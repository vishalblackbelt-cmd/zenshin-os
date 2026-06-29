import type { ComponentType } from 'react';
import type { AppTab } from '../types';

interface NavigationTab {
  id: AppTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
  privileged?: boolean;
}

interface NavigationTabsProps {
  tabs: NavigationTab[];
  currentTab: AppTab;
  canAccessPrivileged: boolean;
  onTabChange: (tab: AppTab) => void;
}

export function NavigationTabs({ tabs, currentTab, canAccessPrivileged, onTabChange }: NavigationTabsProps) {
  return (
    <nav className="bg-[var(--bg-tertiary)] border-b border-[var(--border-muted)] px-6">
      <div className="max-w-7xl mx-auto flex overflow-x-auto scrollbar-none gap-6">
        {tabs
          .filter((tab) => !tab.privileged || canAccessPrivileged)
          .map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-4 px-1 flex items-center gap-2 border-b-2 font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? 'border-[var(--accent-primary)] text-[var(--text-primary)] font-bold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--accent-primary)]' : ''}`} />
                {tab.label}
              </button>
            );
          })}
      </div>
    </nav>
  );
}