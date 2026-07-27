import React, { useState } from 'react';
import { Subject, Task, Announcement, SyllabusItem } from '../types';
import { 
  GraduationCap, 
  Plus, 
  Megaphone, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Send, 
  AlertTriangle, 
  Users, 
  Trash2,
  Calendar
} from 'lucide-react';

interface TeacherDeskProps {
  subjects: Subject[];
  announcements: Announcement[];
  syllabus: SyllabusItem[];
  tasks: Task[];
  onAddAnnouncement: (ann: Omit<Announcement, 'id' | 'date'>) => void;
  onDeleteAnnouncement: (annId: string) => void;
  onUpdateSyllabusStatus: (itemId: string, status: SyllabusItem['status']) => void;
  onOpenAddTask: () => void;
}

export const TeacherDesk: React.FC<TeacherDeskProps> = ({
  subjects,
  announcements,
  syllabus,
  tasks,
  onAddAnnouncement,
  onDeleteAnnouncement,
  onUpdateSyllabusStatus,
  onOpenAddTask
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || 'sub-math');
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annAuthor, setAnnAuthor] = useState('Prof. Evelyn Vance');
  const [annIsUrgent, setAnnIsUrgent] = useState(false);
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);

  const subjectMap = new Map<string, Subject>(subjects.map(s => [s.id, s]));

  const classTasks = tasks.filter(t => t.isClassTask);

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    onAddAnnouncement({
      title: annTitle.trim(),
      content: annContent.trim(),
      author: annAuthor.trim() || 'Course Instructor',
      subjectId: selectedSubjectId,
      urgent: annIsUrgent
    });

    setIsAnnModalOpen(false);
    setAnnTitle('');
    setAnnContent('');
    setAnnIsUrgent(false);
  };

  return (
    <div id="teacher-desk-container" className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
            <GraduationCap className="w-4 h-4" /> Instructor Control Center
          </span>
          <h2 className="text-xl font-bold tracking-tight">Teacher & Course Planner Desk</h2>
          <p className="text-xs text-indigo-200/80 max-w-xl">
            Broadcast class assignments, publish urgent course announcements, and monitor syllabus coverage for your classes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="teacher-broadcast-task-btn"
            onClick={onOpenAddTask}
            className="inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Broadcast Class Task</span>
          </button>
        </div>
      </div>

      {/* Grid: Class Announcements & Syllabus Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Course Announcements Panel */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-500" />
                Class Announcements ({announcements.length})
              </h3>
              <p className="text-[11px] text-slate-500">Notices published to students</p>
            </div>

            <button
              id="open-announcement-modal-btn"
              onClick={() => setIsAnnModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1.5 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Update</span>
            </button>
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No announcements posted yet.</p>
            ) : (
              announcements.map((ann) => {
                const subject = subjectMap.get(ann.subjectId);
                return (
                  <div
                    key={ann.id}
                    className={`p-4 rounded-xl border space-y-2 ${
                      ann.urgent ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {ann.urgent && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded">
                            Urgent Notice
                          </span>
                        )}
                        {subject && (
                          <span 
                            className="text-[10px] font-bold px-2 py-0.5 rounded"
                            style={{ backgroundColor: subject.bgHex, color: subject.textHex }}
                          >
                            {subject.code}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium">{ann.date}</span>
                      </div>

                      <button
                        onClick={() => onDeleteAnnouncement(ann.id)}
                        className="text-slate-300 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">{ann.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                    <p className="text-[10px] font-medium text-slate-400">— {ann.author}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Syllabus Coverage & Course Milestones */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Syllabus Progress & Units
              </h3>
              <p className="text-[11px] text-slate-500">Track curriculum completion per subject</p>
            </div>
          </div>

          <div className="space-y-3">
            {syllabus.map((item) => {
              const subject = subjectMap.get(item.subjectId);
              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {subject && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          {subject.code}
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-slate-900">{item.topic}</h4>
                    </div>

                    <select
                      value={item.status}
                      onChange={(e) => onUpdateSyllabusStatus(item.id, e.target.value as SyllabusItem['status'])}
                      className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-800"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="teaching">Currently Teaching</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Target Date: {item.targetDate}</span>
                    <span className={`font-bold ${
                      item.status === 'completed' ? 'text-emerald-600' : item.status === 'teaching' ? 'text-indigo-600' : 'text-slate-400'
                    }`}>
                      {item.status === 'completed' ? '✓ Covered' : item.status === 'teaching' ? 'In Progress' : 'Upcoming'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Broadcasted Class Tasks List */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-600" />
          Active Class Assignments Broadcasted ({classTasks.length})
        </h3>

        {classTasks.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No active class assignments broadcasted.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {classTasks.map((t) => {
              const subject = subjectMap.get(t.subjectId);
              return (
                <div key={t.id} className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-800">{t.assignedClass || 'Class Task'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Due {t.dueDate}</span>
                  </div>
                  <h4 className="font-bold text-slate-900">{t.title}</h4>
                  <p className="text-slate-600 line-clamp-1">{t.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Announcement Modal */}
      {isAnnModalOpen && (
        <div id="add-announcement-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Post Class Announcement</h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs font-medium text-slate-700">
              <div>
                <label className="block text-slate-800 font-bold mb-1">Subject / Course</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Lab Room Shift or Midterm Practice Solutions"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Notice Content *</label>
                <textarea
                  rows={3}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Write message details for your students..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Instructor Name</label>
                <input
                  type="text"
                  value={annAuthor}
                  onChange={(e) => setAnnAuthor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900">
                  <input
                    type="checkbox"
                    checked={annIsUrgent}
                    onChange={(e) => setAnnIsUrgent(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Mark as High Importance / Urgent Notice</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAnnModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
