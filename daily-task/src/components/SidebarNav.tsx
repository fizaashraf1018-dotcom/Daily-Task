import React from 'react';
import { Subject, UserRole } from '../types';
import { 
  CheckSquare, 
  Brain, 
  Calendar, 
  CalendarDays,
  BarChart3, 
  FileText, 
  GraduationCap, 
  RotateCcw,
  Sparkles,
  FileCheck
} from 'lucide-react';

export type ActiveTab = 'tasks' | 'assignments' | 'quiz_generator' | 'calendar' | 'schedule' | 'analytics' | 'notes' | 'teacher_desk';

interface SidebarNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  subjects: Subject[];
  selectedSubjectId: string | null;
  onSelectSubject: (subjectId: string | null) => void;
  role: UserRole;
  onResetDemoData: () => void;
  pendingCount: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onSelectTab,
  subjects,
  selectedSubjectId,
  onSelectSubject,
  role,
  onResetDemoData,
  pendingCount
}) => {
  const navItems = [
    {
      id: 'tasks' as ActiveTab,
      label: 'Daily Tasks',
      icon: CheckSquare,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'assignments' as ActiveTab,
      label: 'Assignments & Quiz',
      icon: FileCheck,
    },
    {
      id: 'quiz_generator' as ActiveTab,
      label: 'AI Quiz Generator',
      icon: Brain,
    },
    {
      id: 'calendar' as ActiveTab,
      label: 'Deadline Calendar',
      icon: CalendarDays,
    },
    {
      id: 'schedule' as ActiveTab,
      label: 'Class Schedule',
      icon: Calendar,
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Study Analytics',
      icon: BarChart3,
    },
    {
      id: 'notes' as ActiveTab,
      label: 'Notes & Cards',
      icon: FileText,
    },
    {
      id: 'teacher_desk' as ActiveTab,
      label: role === 'teacher' ? 'Teacher Desk' : 'Course Syllabus',
      icon: GraduationCap,
      special: role === 'teacher'
    }
  ];

  return (
    <aside id="sidebar-navigation" className="w-full md:w-64 bg-white border-r border-slate-200/90 flex flex-col shrink-0 p-4 gap-6 min-h-[calc(100vh-4rem)]">
      
      {/* Navigation Links */}
      <div className="space-y-1">
        <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {item.badge}
                </span>
              )}
              {item.special && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wider">
                  Pro
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role Tip Banner & Reset */}
      <div className="pt-4 border-t border-slate-200/80 space-y-3">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Mode: {role === 'student' ? 'Student Workspace' : 'Teacher Desk'}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            {role === 'student' 
              ? 'Organize homework, track focus sessions, and review notes.' 
              : 'Create class tasks, set syllabus targets, and publish updates.'}
          </p>
        </div>

        <button
          id="reset-demo-data-btn"
          onClick={onResetDemoData}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 py-1.5 transition-colors"
          title="Reset to sample study tasks"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sample Tasks</span>
        </button>
      </div>

    </aside>
  );
};
