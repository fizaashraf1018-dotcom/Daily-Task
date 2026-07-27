import React, { useState, useEffect } from 'react';
import { Task, Subject, Priority } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Bell, 
  BellOff, 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Filter,
  Check,
  Info
} from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  subjects: Subject[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTask: (task: Task) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  subjects,
  onAddTask,
  onUpdateTask,
  onToggleTaskComplete,
  onDeleteTask,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for adding task via calendar
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectId, setNewSubjectId] = useState(subjects[0]?.id || 'sub-math');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newDueTime, setNewDueTime] = useState('17:00');
  const [newReminderEnabled, setNewReminderEnabled] = useState(true);
  const [newReminderOffset, setNewReminderOffset] = useState<'same_day' | '1_day_before' | '2_days_before' | '1_hour_before'>('1_day_before');

  // Notification permission state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
    }
  };

  const subjectMap = new Map<string, Subject>(subjects.map(s => [s.id, s]));

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon...
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Build calendar matrix
  const daysGrid: (string | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysGrid.push(dStr);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Map tasks by due date
  const tasksByDate = tasks.reduce((acc: Record<string, Task[]>, task) => {
    if (selectedSubjectFilter && task.subjectId !== selectedSubjectFilter) return acc;
    if (!acc[task.dueDate]) {
      acc[task.dueDate] = [];
    }
    acc[task.dueDate].push(task);
    return acc;
  }, {});

  // Identify overdue or urgent upcoming tasks
  const urgentTasks = tasks.filter(t => {
    if (t.status === 'completed') return false;
    if (selectedSubjectFilter && t.subjectId !== selectedSubjectFilter) return false;
    return t.dueDate <= todayStr;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle.trim(),
      subjectId: newSubjectId,
      priority: newPriority,
      status: 'todo',
      category: 'homework',
      dueDate: selectedDateStr,
      dueTime: newDueTime,
      reminderEnabled: newReminderEnabled,
      reminderOffset: newReminderOffset,
      estimatedMinutes: 30,
      subtasks: [],
      createdByRole: 'student'
    });

    setNewTitle('');
    setIsAddModalOpen(false);
  };

  const selectedDateTasks = tasksByDate[selectedDateStr] || [];

  return (
    <div id="calendar-view-container" className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            Deadline Calendar & Notifications
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track assignment deadlines and schedule automated notification reminders.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Filter by Subject */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="calendar-subject-filter"
              value={selectedSubjectFilter || ''}
              onChange={(e) => setSelectedSubjectFilter(e.target.value || null)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Browser Notification Button */}
          {typeof Notification !== 'undefined' && (
            <button
              id="request-notification-btn"
              onClick={requestNotificationPermission}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>
                {notificationPermission === 'granted' ? 'Alerts On' : 'Enable System Alerts'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Deadline Alert Banner if Urgent / Overdue tasks exist */}
      {urgentTasks.length > 0 && (
        <div id="deadline-alert-banner" className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5 md:mt-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {urgentTasks.length} Upcoming / Overdue Task Deadline{urgentTasks.length > 1 ? 's' : ''}!
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {urgentTasks.slice(0, 3).map(t => t.title).join(', ')}
                {urgentTasks.length > 3 ? ` and ${urgentTasks.length - 3} more` : ''}
              </p>
            </div>
          </div>
          <button
            id="view-urgent-deadlines-btn"
            onClick={() => setSelectedDateStr(todayStr)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors"
          >
            Show Today's Tasks
          </button>
        </div>
      )}

      {/* Calendar Grid + Selected Day Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Monthly Calendar (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          
          {/* Calendar Header controls */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">
              {monthNames[month]} {year}
            </h3>

            <div className="flex items-center gap-2">
              <button
                id="prev-month-btn"
                onClick={handlePrevMonth}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="today-month-btn"
                onClick={handleToday}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Today
              </button>
              <button
                id="next-month-btn"
                onClick={handleNextMonth}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {daysGrid.map((dateStr, idx) => {
              if (!dateStr) {
                return <div key={`empty-${idx}`} className="h-24 bg-slate-50/50 rounded-xl border border-transparent" />;
              }

              const dayNum = parseInt(dateStr.split('-')[2], 10);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDateStr;
              const dayTasks = tasksByDate[dateStr] || [];

              const hasPending = dayTasks.some(t => t.status !== 'completed');
              const hasOverdue = dayTasks.some(t => t.status !== 'completed' && dateStr < todayStr);

              return (
                <div
                  key={dateStr}
                  id={`calendar-day-${dateStr}`}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-24 p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-200 shadow-2xs'
                      : isToday
                      ? 'border-indigo-300 bg-indigo-50/20'
                      : 'border-slate-200/70 hover:border-slate-300 bg-white hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${
                      isToday
                        ? 'w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center -ml-1 -mt-1'
                        : isSelected
                        ? 'text-indigo-900'
                        : 'text-slate-700'
                    }`}>
                      {dayNum}
                    </span>

                    {hasOverdue && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Overdue task" />
                    )}
                    {!hasOverdue && hasPending && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" title="Pending task" />
                    )}
                  </div>

                  {/* Task Badges preview */}
                  <div className="space-y-1 overflow-hidden mt-1">
                    {dayTasks.slice(0, 2).map((t) => {
                      const subject = subjectMap.get(t.subjectId);
                      return (
                        <div
                          key={t.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium flex items-center justify-between ${
                            t.status === 'completed'
                              ? 'line-through bg-slate-100 text-slate-400'
                              : 'text-slate-800'
                          }`}
                          style={{
                            backgroundColor: t.status === 'completed' ? undefined : (subject?.bgHex || '#f1f5f9'),
                            color: t.status === 'completed' ? undefined : (subject?.textHex || '#334155')
                          }}
                        >
                          <span className="truncate">{t.title}</span>
                          {t.reminderEnabled && (
                            <Bell className="w-2.5 h-2.5 shrink-0 ml-1 text-indigo-600" />
                          )}
                        </div>
                      );
                    })}
                    {dayTasks.length > 2 && (
                      <div className="text-[9px] text-slate-400 font-bold px-1">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right: Selected Day Task Details & Quick Add (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-5 flex flex-col justify-between">
          <div>
            {/* Selected Date Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {selectedDateStr === todayStr ? 'Today' : 'Selected Date'}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
              </div>

              <button
                id="add-task-calendar-btn"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>

            {/* Task list for selected date */}
            <div className="space-y-3 mt-4 max-h-[420px] overflow-y-auto pr-1">
              {selectedDateTasks.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
                  <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No deadlines scheduled</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click "Add Task" above to set a new deadline for this day.
                  </p>
                </div>
              ) : (
                selectedDateTasks.map((task) => {
                  const subject = subjectMap.get(task.subjectId);
                  const isCompleted = task.status === 'completed';

                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                        isCompleted
                          ? 'bg-slate-50 border-slate-200/80 opacity-75'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <button
                            id={`toggle-task-calendar-${task.id}`}
                            onClick={() => onToggleTaskComplete(task.id)}
                            className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                              isCompleted
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 hover:border-indigo-500 bg-white'
                            }`}
                          >
                            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                          <div>
                            <h4 className={`text-xs font-bold ${
                              isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}>
                              {task.title}
                            </h4>

                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {subject && (
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                                  style={{ backgroundColor: subject.bgHex, color: subject.textHex }}
                                >
                                  {subject.name}
                                </span>
                              )}
                              {task.dueTime && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {task.dueTime}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Notification Toggle Button */}
                        <button
                          id={`toggle-reminder-${task.id}`}
                          onClick={() => {
                            onUpdateTask({
                              ...task,
                              reminderEnabled: !task.reminderEnabled
                            });
                          }}
                          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                            task.reminderEnabled
                              ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                          title={task.reminderEnabled ? 'Notification Active' : 'Enable Notification'}
                        >
                          {task.reminderEnabled ? (
                            <Bell className="w-4 h-4" />
                          ) : (
                            <BellOff className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Reminder details dropdown/selector if enabled */}
                      {task.reminderEnabled && !isCompleted && (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Info className="w-3 h-3 text-indigo-500" />
                            Reminder setting:
                          </span>
                          <select
                            id={`reminder-offset-select-${task.id}`}
                            value={task.reminderOffset || '1_day_before'}
                            onChange={(e) => {
                              onUpdateTask({
                                ...task,
                                reminderOffset: e.target.value as any
                              });
                            }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-semibold rounded px-1.5 py-0.5 outline-none"
                          >
                            <option value="1_hour_before">1 Hour Before</option>
                            <option value="same_day">On Due Date Morning</option>
                            <option value="1_day_before">1 Day Before</option>
                            <option value="2_days_before">2 Days Before</option>
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-500 space-y-1">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-indigo-600" />
              <span>Deadline Notifications Tip</span>
            </div>
            <p>
              Enable browser notifications to receive active desktop reminders before task deadlines occur.
            </p>
          </div>
        </div>

      </div>

      {/* Add Task with Deadline Modal */}
      {isAddModalOpen && (
        <div id="add-deadline-modal" className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                Add Task for {selectedDateStr}
              </h3>
              <button
                id="close-add-modal-btn"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Submit Assignment #2"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Due Time
                </label>
                <input
                  type="time"
                  value={newDueTime}
                  onChange={(e) => setNewDueTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                />
              </div>

              {/* Notification Settings */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-indigo-600" />
                    Deadline Notification Reminder
                  </label>
                  <input
                    type="checkbox"
                    checked={newReminderEnabled}
                    onChange={(e) => setNewReminderEnabled(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                {newReminderEnabled && (
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 font-medium">
                      Send notification alert:
                    </label>
                    <select
                      value={newReminderOffset}
                      onChange={(e) => setNewReminderOffset(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 text-xs text-slate-800 rounded-lg outline-none"
                    >
                      <option value="1_hour_before">1 Hour Before</option>
                      <option value="same_day">On Due Date Morning</option>
                      <option value="1_day_before">1 Day Before</option>
                      <option value="2_days_before">2 Days Before</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
