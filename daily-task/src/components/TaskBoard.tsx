import React, { useState } from 'react';
import { Task, Subject, Priority, TaskStatus, Category } from '../types';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Edit3, 
  Timer, 
  AlertCircle, 
  Calendar, 
  BookOpen, 
  CheckSquare, 
  Filter, 
  Plus, 
  Check, 
  ListOrdered
} from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  subjects: Subject[];
  selectedSubjectId: string | null;
  searchQuery: string;
  onToggleTaskStatus: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onStartFocusForTask: (task: Task) => void;
  onOpenAddTask: () => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  subjects,
  selectedSubjectId,
  searchQuery,
  onToggleTaskStatus,
  onToggleSubtask,
  onDeleteTask,
  onEditTask,
  onStartFocusForTask,
  onOpenAddTask
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'completed' | 'due_today'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'estimatedMinutes'>('dueDate');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const subjectMap = new Map<string, Subject>(subjects.map(s => [s.id, s]));

  const todayStr = new Date().toISOString().split('T')[0];

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // ignore
    }
  };

  const handleTaskCompleteToggle = (task: Task) => {
    if (task.status !== 'completed') {
      triggerConfetti();
    }
    onToggleTaskStatus(task.id);
  };

  const toggleExpand = (id: string) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter tasks
  let filtered = tasks.filter(task => {
    // Subject filter
    if (selectedSubjectId && task.subjectId !== selectedSubjectId) return false;

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const subjectName = subjectMap.get(task.subjectId)?.name.toLowerCase() || '';
      const matchesTitle = task.title.toLowerCase().includes(q);
      const matchesDesc = (task.description || '').toLowerCase().includes(q);
      const matchesSubject = subjectName.includes(q);
      if (!matchesTitle && !matchesDesc && !matchesSubject) return false;
    }

    // Status filter
    if (statusFilter === 'todo' && task.status !== 'todo') return false;
    if (statusFilter === 'in_progress' && task.status !== 'in_progress') return false;
    if (statusFilter === 'completed' && task.status !== 'completed') return false;
    if (statusFilter === 'due_today' && task.dueDate !== todayStr) return false;

    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

    return true;
  });

  // Sort tasks
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'dueDate') {
      return a.dueDate.localeCompare(b.dueDate);
    } else if (sortBy === 'priority') {
      const pMap = { high: 1, medium: 2, low: 3 };
      return pMap[a.priority] - pMap[b.priority];
    } else if (sortBy === 'estimatedMinutes') {
      return b.estimatedMinutes - a.estimatedMinutes;
    }
    return 0;
  });

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">High Priority</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Medium</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Low</span>;
    }
  };

  const getCategoryLabel = (cat: Category) => {
    const labels: Record<Category, string> = {
      homework: 'Homework',
      exam_prep: 'Exam Prep',
      reading: 'Reading',
      project: 'Project',
      quiz: 'Quiz',
      lecture_review: 'Lecture Review',
      teaching_prep: 'Lesson Plan'
    };
    return labels[cat] || cat;
  };

  return (
    <div id="task-board-container" className="space-y-5">
      
      {/* Top Filter and Controls Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium border border-slate-200/80">
            <button
              id="task-filter-all"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-white text-indigo-700 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Tasks ({tasks.length})
            </button>
            <button
              id="task-filter-todo"
              onClick={() => setStatusFilter('todo')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'todo' ? 'bg-white text-indigo-700 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              To Do ({tasks.filter(t => t.status === 'todo').length})
            </button>
            <button
              id="task-filter-in-progress"
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'in_progress' ? 'bg-white text-indigo-700 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Progress ({tasks.filter(t => t.status === 'in_progress').length})
            </button>
            <button
              id="task-filter-completed"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'completed' ? 'bg-white text-indigo-700 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({tasks.filter(t => t.status === 'completed').length})
            </button>
            <button
              id="task-filter-due-today"
              onClick={() => setStatusFilter('due_today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'due_today' ? 'bg-amber-50 text-amber-800 font-semibold shadow-2xs border border-amber-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Due Today ({tasks.filter(t => t.dueDate === todayStr).length})
            </button>
          </div>

          {/* Priority & Sort Dropdowns */}
          <div className="flex items-center gap-2">
            
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="task-priority-filter-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <ListOrdered className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="task-sort-by-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'estimatedMinutes')}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="dueDate">Sort: Due Date</option>
                <option value="priority">Sort: Priority</option>
                <option value="estimatedMinutes">Sort: Duration</option>
              </select>
            </div>

          </div>

        </div>
      </div>

      {/* Task Cards List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No tasks found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery 
                ? `No results matching "${searchQuery}". Try adjusting your search or filters.` 
                : 'All caught up! Create a new study task or lesson plan to stay ahead.'}
            </p>
          </div>
          <button
            id="empty-state-add-task-btn"
            onClick={onOpenAddTask}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Task</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const subject = subjectMap.get(task.subjectId);
            const isExpanded = !!expandedTasks[task.id];
            const completedSubtasks = task.subtasks.filter(st => st.completed).length;
            const isOverdue = task.status !== 'completed' && task.dueDate < todayStr;
            const isDueToday = task.dueDate === todayStr;

            return (
              <div
                key={task.id}
                id={`task-item-${task.id}`}
                className={`bg-white border rounded-2xl p-4 transition-all shadow-2xs hover:shadow-xs ${
                  task.status === 'completed'
                    ? 'border-slate-200 bg-slate-50/60 opacity-80'
                    : isOverdue
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-slate-200/90 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  
                  {/* Completion Toggle */}
                  <button
                    id={`toggle-task-btn-${task.id}`}
                    onClick={() => handleTaskCompleteToggle(task)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                    title={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                    ) : task.status === 'in_progress' ? (
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                    )}
                  </button>

                  {/* Main Task Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    
                    {/* Header Row: Subject & Priority & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {subject && (
                          <span 
                            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                            style={{ 
                              backgroundColor: subject.bgHex, 
                              color: subject.textHex, 
                              borderColor: `${subject.textHex}30` 
                            }}
                          >
                            {subject.code}: {subject.name}
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {getCategoryLabel(task.category)}
                        </span>
                        {getPriorityBadge(task.priority)}
                        {task.isClassTask && (
                          <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                            Class Task
                          </span>
                        )}
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-1">
                        {task.status !== 'completed' && (
                          <button
                            id={`start-focus-btn-${task.id}`}
                            onClick={() => onStartFocusForTask(task)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                            title="Start Pomodoro Focus Timer for this task"
                          >
                            <Timer className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Focus</span>
                          </button>
                        )}
                        <button
                          id={`edit-task-btn-${task.id}`}
                          onClick={() => onEditTask(task)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Edit Task"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-task-btn-${task.id}`}
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Task Title & Description */}
                    <div>
                      <h4 className={`text-sm font-bold text-slate-900 leading-snug ${
                        task.status === 'completed' ? 'line-through text-slate-400' : ''
                      }`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Info: Estimated time, Due Date, Subtask progress toggle */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{task.estimatedMinutes} min study</span>
                        </span>

                        <span className={`flex items-center gap-1 font-medium ${
                          isOverdue ? 'text-rose-600 font-semibold' : isDueToday ? 'text-amber-700 font-semibold' : 'text-slate-600'
                        }`}>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {isDueToday ? 'Due Today' : isOverdue ? `Overdue (${task.dueDate})` : `Due ${task.dueDate}`}
                          </span>
                        </span>
                      </div>

                      {/* Subtasks Expander */}
                      {task.subtasks.length > 0 && (
                        <button
                          id={`expand-subtasks-btn-${task.id}`}
                          onClick={() => toggleExpand(task.id)}
                          className="flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800 text-xs"
                        >
                          <span>Subtasks ({completedSubtasks}/{task.subtasks.length})</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    {/* Subtasks Accordion */}
                    {isExpanded && task.subtasks.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 mt-2 space-y-1.5 bg-slate-50/80 p-3 rounded-xl">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                          <span>Checklist Items</span>
                          <span>{Math.round((completedSubtasks / task.subtasks.length) * 100)}% Done</span>
                        </div>
                        {task.subtasks.map((st) => (
                          <div
                            key={st.id}
                            id={`subtask-item-${st.id}`}
                            onClick={() => onToggleSubtask(task.id, st.id)}
                            className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer py-1"
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              st.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={st.completed ? 'line-through text-slate-400' : ''}>
                              {st.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
