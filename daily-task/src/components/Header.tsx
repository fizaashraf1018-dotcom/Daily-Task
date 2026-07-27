import React from 'react';
import { UserRole, Task } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  CheckCircle2, 
  Flame, 
  Search, 
  Plus, 
  GraduationCap, 
  BookOpenCheck, 
  CalendarDays,
  Sparkles,
  User as UserIcon,
  LogOut,
  LogIn
} from 'lucide-react';

interface HeaderProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  tasks: Task[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddTask: () => void;
  streakDays: number;
  currentUser: FirebaseUser | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  role,
  onRoleChange,
  tasks,
  searchQuery,
  onSearchChange,
  onOpenAddTask,
  streakDays,
  currentUser,
  onOpenAuthModal,
  onSignOut
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.dueDate === todayStr);
  const completedToday = todayTasks.filter(t => t.status === 'completed').length;
  const totalToday = todayTasks.length;
  const completionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const dateDisplay = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header id="main-header" className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm ring-4 ring-indigo-50">
              <BookOpenCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                  Daily Task
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Sparkles className="w-3 h-3" /> Study Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {dateDisplay}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md items-center">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="header-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search tasks, subjects, or notes..."
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Stats Badges & Role Switcher */}
          <div className="flex items-center gap-3">
            
            {/* Daily Completion Pill */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                Today: <strong className="text-slate-900">{completedToday}/{totalToday}</strong> ({completionPercentage}%)
              </span>
            </div>

            {/* Streak Pill */}
            <div className="hidden lg:flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-800">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{streakDays} Day Streak</span>
            </div>

            {/* Role Switcher Pill */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                id="role-student-btn"
                onClick={() => onRoleChange('student')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  role === 'student'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Student Study View"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>
              <button
                id="role-teacher-btn"
                onClick={() => onRoleChange('teacher')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  role === 'teacher'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Teacher & Class Planner View"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Teacher</span>
              </button>
            </div>

            {/* Quick Add Task Button */}
            <button
              id="header-add-task-btn"
              onClick={onOpenAddTask}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Task</span>
            </button>

            {/* Auth Profile / Sign In */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-[11px] font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                      {currentUser.displayName || 'Student User'}
                    </p>
                    <p className="text-[9px] text-slate-500 truncate max-w-[110px]">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  title="Sign Out"
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
