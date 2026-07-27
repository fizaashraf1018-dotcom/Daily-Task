import React, { useState, useEffect } from 'react';
import { Task, Subject, Priority, Category, UserRole } from '../types';
import { X, Plus, Trash2, BookOpen, Clock, Calendar, CheckSquare, Sparkles, Bell } from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id'>, existingTaskId?: string) => void;
  editingTask: Task | null;
  subjects: Subject[];
  role: UserRole;
  onAddNewSubject?: (subjectName: string, subjectCode: string) => string;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
  subjects,
  role,
  onAddNewSubject
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('homework');
  const [dueDate, setDueDate] = useState(todayStr);
  const [dueTime, setDueTime] = useState('17:00');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderOffset, setReminderOffset] = useState<'same_day' | '1_day_before' | '2_days_before' | '1_hour_before'>('1_day_before');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isClassTask, setIsClassTask] = useState(role === 'teacher');
  const [assignedClass, setAssignedClass] = useState('Physics 102 - Section A');

  // Custom new subject inline form state
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setSubjectId(editingTask.subjectId);
      setPriority(editingTask.priority);
      setCategory(editingTask.category);
      setDueDate(editingTask.dueDate);
      setDueTime(editingTask.dueTime || '17:00');
      setReminderEnabled(editingTask.reminderEnabled !== false);
      setReminderOffset(editingTask.reminderOffset || '1_day_before');
      setEstimatedMinutes(editingTask.estimatedMinutes);
      setSubtasks(editingTask.subtasks || []);
      setIsClassTask(!!editingTask.isClassTask);
      setAssignedClass(editingTask.assignedClass || 'Class Section A');
    } else {
      setTitle('');
      setDescription('');
      setSubjectId(subjects[0]?.id || '');
      setPriority('medium');
      setCategory(role === 'teacher' ? 'teaching_prep' : 'homework');
      setDueDate(todayStr);
      setDueTime('17:00');
      setReminderEnabled(true);
      setReminderOffset('1_day_before');
      setEstimatedMinutes(45);
      setSubtasks([]);
      setIsClassTask(role === 'teacher');
      setAssignedClass('Class Section A');
    }
  }, [editingTask, isOpen, subjects, role]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: 'st-' + Date.now(), title: newSubtaskText.trim(), completed: false }
    ]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleCreateCustomSubject = () => {
    if (!newSubName.trim() || !onAddNewSubject) return;
    const createdId = onAddNewSubject(newSubName.trim(), newSubCode.trim() || 'SUB 101');
    setSubjectId(createdId);
    setIsCreatingSubject(false);
    setNewSubName('');
    setNewSubCode('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      subjectId: subjectId || subjects[0]?.id || 'sub-math',
      priority,
      status: editingTask ? editingTask.status : 'todo',
      category,
      dueDate: dueDate || todayStr,
      dueTime,
      reminderEnabled,
      reminderOffset,
      estimatedMinutes: Number(estimatedMinutes) || 30,
      subtasks,
      createdByRole: role,
      isClassTask,
      assignedClass: isClassTask ? assignedClass : undefined
    }, editingTask?.id);

    onClose();
  };

  return (
    <div id="add-task-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        id="add-task-modal-card"
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingTask ? 'Edit Study Task' : 'Create New Study Task'}
              </h3>
              <p className="text-xs text-slate-500">Set goals, subtasks, and deadlines</p>
            </div>
          </div>
          <button
            id="close-task-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-medium text-slate-700">
          
          {/* Title */}
          <div className="space-y-1">
            <label className="block text-slate-800 font-bold">Task Title *</label>
            <input
              id="task-form-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Read Physics Ch. 4 or Solve Calculus Problem Set #2"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-slate-800 font-bold">Description / Instructions</label>
            <textarea
              id="task-form-description-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key notes, page numbers, or submission details..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Subject Selector & Custom Subject Option */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-slate-800 font-bold">Subject / Course *</label>
              <button
                type="button"
                id="toggle-new-subject-btn"
                onClick={() => setIsCreatingSubject(!isCreatingSubject)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              >
                {isCreatingSubject ? 'Select Existing' : '+ Add Custom Subject'}
              </button>
            </div>

            {isCreatingSubject ? (
              <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Subject Name (e.g. Organic Chem)"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Code (e.g. CHEM 201)"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <button
                  type="button"
                  id="confirm-create-subject-btn"
                  onClick={handleCreateCustomSubject}
                  className="w-full py-1.5 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-700"
                >
                  Save & Select Subject
                </button>
              </div>
            ) : (
              <select
                id="task-form-subject-select"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code}: {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Grid: Category & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-slate-800 font-bold">Category</label>
              <select
                id="task-form-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="homework">Homework</option>
                <option value="reading">Reading</option>
                <option value="exam_prep">Exam Prep</option>
                <option value="project">Project</option>
                <option value="quiz">Quiz</option>
                <option value="lecture_review">Lecture Review</option>
                <option value="teaching_prep">Lesson Plan</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-800 font-bold">Priority</label>
              <select
                id="task-form-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          {/* Grid: Due Date, Due Time & Duration */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="block text-slate-800 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Due Date
              </label>
              <input
                id="task-form-due-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-800 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Due Time
              </label>
              <input
                id="task-form-due-time-input"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-800 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Est. (Mins)
              </label>
              <input
                id="task-form-duration-input"
                type="number"
                min="5"
                max="300"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Deadline Notification Settings */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-indigo-600" />
                Enable Deadline Notification
              </label>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {reminderEnabled && (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-indigo-100/80">
                <span className="text-[11px] text-slate-600 font-medium">Notification alert time:</span>
                <select
                  value={reminderOffset}
                  onChange={(e) => setReminderOffset(e.target.value as any)}
                  className="px-2 py-1 bg-white border border-indigo-200 text-xs text-slate-800 rounded-lg outline-none"
                >
                  <option value="1_hour_before">1 Hour Before</option>
                  <option value="same_day">On Due Date Morning</option>
                  <option value="1_day_before">1 Day Before</option>
                  <option value="2_days_before">2 Days Before</option>
                </select>
              </div>
            )}
          </div>

          {/* Teacher Broadcast Toggle */}
          {role === 'teacher' && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900">
                <input
                  type="checkbox"
                  checked={isClassTask}
                  onChange={(e) => setIsClassTask(e.target.checked)}
                  className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <span>Broadcast as Class Assignment for Students</span>
              </label>
              {isClassTask && (
                <input
                  type="text"
                  placeholder="Target Class (e.g. Physics 102 - Section A)"
                  value={assignedClass}
                  onChange={(e) => setAssignedClass(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs"
                />
              )}
            </div>
          )}

          {/* Subtask Builder */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-slate-800 font-bold">Subtasks & Steps</label>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                placeholder="Add sub-step (e.g. Read section 2.1)"
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
              <button
                type="button"
                id="add-subtask-item-btn"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg text-xs text-slate-700"
              >
                + Add
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {subtasks.map((st) => (
                  <div key={st.id} className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded-lg text-xs text-slate-700">
                    <span>• {st.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              id="cancel-task-btn"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-task-btn"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
            >
              {editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
