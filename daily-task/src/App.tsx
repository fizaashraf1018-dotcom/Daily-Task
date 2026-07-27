/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Task, 
  Subject, 
  ScheduleSlot, 
  StudyNote, 
  Flashcard, 
  Announcement, 
  SyllabusItem, 
  FocusSession, 
  UserRole,
  Assignment,
  AssignmentSubmission,
  AIFeedback
} from './types';
import { 
  INITIAL_SUBJECTS, 
  INITIAL_TASKS, 
  INITIAL_SCHEDULE, 
  INITIAL_NOTES, 
  INITIAL_FLASHCARDS, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_SYLLABUS 
} from './data/initialData';
import { Header } from './components/Header';
import { SidebarNav, ActiveTab } from './components/SidebarNav';
import { TaskBoard } from './components/TaskBoard';
import { AddTaskModal } from './components/AddTaskModal';
import { FocusTimer } from './components/FocusTimer';
import { ScheduleView } from './components/ScheduleView';
import { AnalyticsView } from './components/AnalyticsView';
import { NotesAndCards } from './components/NotesAndCards';
import { TeacherDesk } from './components/TeacherDesk';
import { CalendarView } from './components/CalendarView';
import { AssignmentsView } from './components/AssignmentsView';
import { QuizGenerator } from './components/QuizGenerator';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import { AuthModal } from './components/AuthModal';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const STORAGE_KEYS = {
  TASKS: 'daily_task_app_tasks_v4',
  SUBJECTS: 'daily_task_app_subjects_v4',
  SCHEDULE: 'daily_task_app_schedule_v4',
  NOTES: 'daily_task_app_notes_v4',
  FLASHCARDS: 'daily_task_app_flashcards_v4',
  ANNOUNCEMENTS: 'daily_task_app_announcements_v4',
  SYLLABUS: 'daily_task_app_syllabus_v4',
  FOCUS_SESSIONS: 'daily_task_app_focus_sessions_v4',
  ASSIGNMENTS: 'daily_task_app_assignments_v4',
  SUBMISSIONS: 'daily_task_app_submissions_v4',
  ROLE: 'daily_task_app_role_v2'
};

export default function App() {
  const [role, setRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    return (saved as UserRole) || 'student';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('tasks');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Firebase Auth and Modal States
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Core Data States
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [schedule, setSchedule] = useState<ScheduleSlot[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
  });

  const [notes, setNotes] = useState<StudyNote[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
    return saved ? JSON.parse(saved) : INITIAL_FLASHCARDS;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [syllabus, setSyllabus] = useState<SyllabusItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SYLLABUS);
    return saved ? JSON.parse(saved) : INITIAL_SYLLABUS;
  });

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    return saved ? JSON.parse(saved) : [];
  });

  // Modal and Focus Timer Active Task state
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTaskForTimer, setActiveTaskForTimer] = useState<Task | null>(null);

  // Listen to Firebase Auth state change & real-time Firestore sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Subscribe to user document in Firestore for data isolation
        const userDocRef = doc(db, 'users', user.uid);
        const unsubDoc = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.subjects) setSubjects(data.subjects);
            if (data.tasks) setTasks(data.tasks);
            if (data.schedule) setSchedule(data.schedule);
            if (data.notes) setNotes(data.notes);
            if (data.flashcards) setFlashcards(data.flashcards);
            if (data.announcements) setAnnouncements(data.announcements);
            if (data.syllabus) setSyllabus(data.syllabus);
            if (data.focusSessions) setFocusSessions(data.focusSessions);
            if (data.assignments) setAssignments(data.assignments);
            if (data.submissions) setSubmissions(data.submissions);
            if (data.role) setRole(data.role);
          } else {
            // First time user logged in: initialize Firestore user document
            setDoc(userDocRef, {
              email: user.email,
              displayName: user.displayName || 'Student User',
              role: 'student',
              subjects: INITIAL_SUBJECTS,
              tasks: INITIAL_TASKS,
              schedule: INITIAL_SCHEDULE,
              notes: INITIAL_NOTES,
              flashcards: INITIAL_FLASHCARDS,
              announcements: INITIAL_ANNOUNCEMENTS,
              syllabus: INITIAL_SYLLABUS,
              focusSessions: [],
              assignments: [],
              submissions: [],
              createdAt: new Date().toISOString()
            }, { merge: true });
          }
        }, (err) => {
          console.error('Firestore snapshot listener error:', err);
        });
        return () => unsubDoc();
      }
    });
    return () => unsubscribe();
  }, []);

  // Persistence to localStorage & Firestore sync for authenticated user
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(flashcards));
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    localStorage.setItem(STORAGE_KEYS.SYLLABUS, JSON.stringify(syllabus));
    localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(focusSessions));
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));

    if (currentUser) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      setDoc(userDocRef, {
        role,
        subjects,
        tasks,
        schedule,
        notes,
        flashcards,
        announcements,
        syllabus,
        focusSessions,
        assignments,
        submissions,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => console.error("Firestore sync error:", err));
    }
  }, [currentUser, role, subjects, tasks, schedule, notes, flashcards, announcements, syllabus, focusSessions, assignments, submissions]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Handlers for Assignments & Submissions
  const handleCreateAssignment = (newAssignment: Omit<Assignment, 'id' | 'createdAt'>) => {
    const created: Assignment = {
      ...newAssignment,
      id: 'assign-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setAssignments(prev => [created, ...prev]);
  };

  const handleDeleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    setSubmissions(prev => prev.filter(s => s.assignmentId !== id));
  };

  const handleSubmitAssignment = (newSub: Omit<AssignmentSubmission, 'id' | 'submittedAt'>) => {
    const created: AssignmentSubmission = {
      ...newSub,
      id: 'sub-' + Date.now(),
      submittedAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
    setSubmissions(prev => [created, ...prev]);
  };

  const handleUpdateGrade = (submissionId: string, grade: AIFeedback) => {
    setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status: 'graded', grade } : s));
  };

  // Handlers for Tasks
  const handleToggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'completed' ? 'todo' : 'completed';
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return t;
    }));
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map(st => 
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...t, subtasks: updatedSubtasks };
      }
      return t;
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleSaveTask = (taskData: Omit<Task, 'id'>, existingTaskId?: string) => {
    if (existingTaskId) {
      setTasks(prev => prev.map(t => t.id === existingTaskId ? { ...taskData, id: existingTaskId } : t));
    } else {
      const newTask: Task = {
        ...taskData,
        id: 'task-' + Date.now()
      };
      setTasks(prev => [newTask, ...prev]);
    }
  };

  const handleStartFocusForTask = (task: Task) => {
    setActiveTaskForTimer(task);
    setActiveTab('timer');
  };

  const handleAddNewSubject = (name: string, code: string): string => {
    const newSub: Subject = {
      id: 'sub-' + Date.now(),
      name,
      code,
      color: 'indigo',
      bgHex: '#e0e7ff',
      textHex: '#3730a3'
    };
    setSubjects(prev => [...prev, newSub]);
    return newSub.id;
  };

  // Handlers for Focus Sessions
  const handleLogFocusSession = (session: Omit<FocusSession, 'id'>) => {
    const newSession: FocusSession = {
      ...session,
      id: 'fs-' + Date.now()
    };
    setFocusSessions(prev => [newSession, ...prev]);
  };

  // Handlers for Schedule
  const handleAddScheduleSlot = (slot: Omit<ScheduleSlot, 'id'>) => {
    const newSlot: ScheduleSlot = {
      ...slot,
      id: 'sch-' + Date.now()
    };
    setSchedule(prev => [...prev, newSlot].sort((a, b) => a.hour - b.hour));
  };

  const handleDeleteScheduleSlot = (slotId: string) => {
    setSchedule(prev => prev.filter(s => s.id !== slotId));
  };

  // Handlers for Notes & Flashcards
  const handleAddNote = (note: Omit<StudyNote, 'id' | 'updatedAt'>) => {
    const newNote: StudyNote = {
      ...note,
      id: 'note-' + Date.now(),
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const handleAddFlashcard = (card: Omit<Flashcard, 'id' | 'mastered'>) => {
    const newCard: Flashcard = {
      ...card,
      id: 'fc-' + Date.now(),
      mastered: false
    };
    setFlashcards(prev => [...prev, newCard]);
  };

  const handleToggleFlashcardMastered = (cardId: string) => {
    setFlashcards(prev => prev.map(c => c.id === cardId ? { ...c, mastered: !c.mastered } : c));
  };

  const handleDeleteFlashcard = (cardId: string) => {
    setFlashcards(prev => prev.filter(c => c.id !== cardId));
  };

  // Handlers for Teacher Desk
  const handleAddAnnouncement = (ann: Omit<Announcement, 'id' | 'date'>) => {
    const newAnn: Announcement = {
      ...ann,
      id: 'ann-' + Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    setAnnouncements(prev => [newAnn, ...prev]);
  };

  const handleDeleteAnnouncement = (annId: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== annId));
  };

  const handleUpdateSyllabusStatus = (itemId: string, status: SyllabusItem['status']) => {
    setSyllabus(prev => prev.map(s => s.id === itemId ? { ...s, status } : s));
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset all tasks, notes, and study schedules back to default sample data?')) {
      setSubjects(INITIAL_SUBJECTS);
      setTasks(INITIAL_TASKS);
      setSchedule(INITIAL_SCHEDULE);
      setNotes(INITIAL_NOTES);
      setFlashcards(INITIAL_FLASHCARDS);
      setAnnouncements(INITIAL_ANNOUNCEMENTS);
      setSyllabus(INITIAL_SYLLABUS);
      setFocusSessions([]);
      localStorage.clear();
    }
  };

  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
      
      {/* Top Header */}
      <Header
        role={role}
        onRoleChange={setRole}
        tasks={tasks}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddTask={() => { setEditingTask(null); setIsAddTaskModalOpen(true); }}
        streakDays={5}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        
        {/* Sidebar Navigation */}
        <SidebarNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          subjects={subjects}
          selectedSubjectId={selectedSubjectId}
          onSelectSubject={setSelectedSubjectId}
          role={role}
          onResetDemoData={handleResetDemoData}
          pendingCount={pendingTasksCount}
        />

        {/* Main View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          
          {activeTab === 'tasks' && (
            <TaskBoard
              tasks={tasks}
              subjects={subjects}
              selectedSubjectId={selectedSubjectId}
              searchQuery={searchQuery}
              onToggleTaskStatus={handleToggleTaskStatus}
              onToggleSubtask={handleToggleSubtask}
              onDeleteTask={handleDeleteTask}
              onEditTask={(task) => { setEditingTask(task); setIsAddTaskModalOpen(true); }}
              onStartFocusForTask={handleStartFocusForTask}
              onOpenAddTask={() => { setEditingTask(null); setIsAddTaskModalOpen(true); }}
            />
          )}

          {activeTab === 'assignments' && (
            <AssignmentsView
              role={role}
              subjects={subjects}
              assignments={assignments}
              submissions={submissions}
              onCreateAssignment={handleCreateAssignment}
              onDeleteAssignment={handleDeleteAssignment}
              onSubmitAssignment={handleSubmitAssignment}
              onUpdateGrade={handleUpdateGrade}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              tasks={tasks}
              subjects={subjects}
              onAddTask={(taskData) => handleSaveTask(taskData)}
              onUpdateTask={handleUpdateTask}
              onToggleTaskComplete={handleToggleTaskStatus}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === 'quiz_generator' && (
            <QuizGenerator
              role={role}
              subjects={subjects}
              onCreateAssignment={handleCreateAssignment}
              onSubmitAssignment={handleSubmitAssignment}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleView
              schedule={schedule}
              subjects={subjects}
              onAddScheduleSlot={handleAddScheduleSlot}
              onDeleteScheduleSlot={handleDeleteScheduleSlot}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              tasks={tasks}
              focusSessions={focusSessions}
              subjects={subjects}
              streakDays={5}
            />
          )}

          {activeTab === 'notes' && (
            <NotesAndCards
              notes={notes}
              flashcards={flashcards}
              subjects={subjects}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              onAddFlashcard={handleAddFlashcard}
              onToggleFlashcardMastered={handleToggleFlashcardMastered}
              onDeleteFlashcard={handleDeleteFlashcard}
            />
          )}

          {activeTab === 'teacher_desk' && (
            <TeacherDesk
              subjects={subjects}
              announcements={announcements}
              syllabus={syllabus}
              tasks={tasks}
              onAddAnnouncement={handleAddAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              onUpdateSyllabusStatus={handleUpdateSyllabusStatus}
              onOpenAddTask={() => { setEditingTask(null); setIsAddTaskModalOpen(true); }}
            />
          )}

        </main>

      </div>

      {/* Add / Edit Task Dialog Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => { setIsAddTaskModalOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
        editingTask={editingTask}
        subjects={subjects}
        role={role}
        onAddNewSubject={handleAddNewSubject}
      />

      {/* Global AI Assistant Floating Widget */}
      <AIAssistantWidget
        role={role}
        tasks={tasks}
        assignments={assignments}
        subjects={subjects}
      />

      {/* Firebase Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

    </div>
  );
}
