import React, { useState } from 'react';
import { ScheduleSlot, Subject } from '../types';
import { Plus, Trash2, Calendar, MapPin, Clock, BookOpen, Layers } from 'lucide-react';

interface ScheduleViewProps {
  schedule: ScheduleSlot[];
  subjects: Subject[];
  onAddScheduleSlot: (slot: Omit<ScheduleSlot, 'id'>) => void;
  onDeleteScheduleSlot: (slotId: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedule,
  subjects,
  onAddScheduleSlot,
  onDeleteScheduleSlot
}) => {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00 AM');
  const [hour, setHour] = useState(9);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || 'sub-math');
  const [type, setType] = useState<ScheduleSlot['type']>('lecture');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const subjectMap = new Map<string, Subject>(subjects.map(s => [s.id, s]));

  const filteredSchedule = schedule.filter(slot => {
    if (selectedSubjectFilter && slot.subjectId !== selectedSubjectFilter) return false;
    return true;
  }).sort((a, b) => a.hour - b.hour);

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddScheduleSlot({
      title: title.trim(),
      time,
      hour: Number(hour) || 9,
      subjectId: subjectId || subjects[0]?.id || 'sub-math',
      type,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined
    });

    setIsModalOpen(false);
    setTitle('');
    setLocation('');
    setNotes('');
  };

  const getTypeBadge = (t: ScheduleSlot['type']) => {
    switch (t) {
      case 'lecture':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Lecture</span>;
      case 'lab':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Lab</span>;
      case 'study_block':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Study Session</span>;
      case 'office_hours':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Office Hours</span>;
      case 'break':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Break</span>;
    }
  };

  const currentHour = new Date().getHours() + new Date().getMinutes() / 60;

  return (
    <div id="schedule-view-container" className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Class Schedule & Daily Timetable
          </h3>
          <p className="text-xs text-slate-500">Plan lectures, study sessions, and campus office hours</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subject Filter */}
          <select
            id="schedule-subject-filter-select"
            value={selectedSubjectFilter || ''}
            onChange={(e) => setSelectedSubjectFilter(e.target.value ? e.target.value : null)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Course Schedules</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.code}: {s.name}
              </option>
            ))}
          </select>

          <button
            id="open-add-slot-modal-btn"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class Slot</span>
          </button>
        </div>
      </div>

      {/* Schedule Timeline */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        {filteredSchedule.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">No class slots scheduled for this filter.</p>
          </div>
        ) : (
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-24 before:w-0.5 before:bg-slate-100 hidden sm:block">
            {filteredSchedule.map((slot) => {
              const subject = subjectMap.get(slot.subjectId);
              const isCurrent = Math.abs(currentHour - slot.hour) < 1;

              return (
                <div
                  key={slot.id}
                  id={`schedule-slot-item-${slot.id}`}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-indigo-50/50 border-indigo-200 shadow-2xs ring-1 ring-indigo-300/50'
                      : 'bg-white border-slate-200/80 hover:border-indigo-100'
                  }`}
                >
                  {/* Time Badge */}
                  <div className="w-24 shrink-0 text-right pr-2">
                    <span className="text-xs font-bold font-mono text-slate-800">
                      {slot.time}
                    </span>
                    {isCurrent && (
                      <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                        Happening Now
                      </span>
                    )}
                  </div>

                  {/* Dot on Timeline */}
                  <div className="w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white shrink-0 mt-1" />

                  {/* Content Card */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {slot.title}
                        </h4>
                        {getTypeBadge(slot.type)}
                      </div>

                      <button
                        id={`delete-schedule-slot-btn-${slot.id}`}
                        onClick={() => onDeleteScheduleSlot(slot.id)}
                        className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Delete slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {subject && (
                      <div className="flex items-center gap-2 text-xs">
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{ backgroundColor: subject.bgHex, color: subject.textHex }}
                        >
                          {subject.code}: {subject.name}
                        </span>
                        {slot.location && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {slot.location}
                          </span>
                        )}
                      </div>
                    )}

                    {slot.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                        {slot.notes}
                      </p>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Slot Modal */}
      {isModalOpen && (
        <div id="add-schedule-slot-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Schedule Slot</h3>
            
            <form onSubmit={handleCreateSlot} className="space-y-3 text-xs font-medium text-slate-700">
              <div>
                <label className="block text-slate-800 font-bold mb-1">Slot Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Organic Chem Lecture or Study Group"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Time Label</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Hour (24h format)</label>
                  <input
                    type="number"
                    min="6"
                    max="22"
                    value={hour}
                    onChange={(e) => setHour(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Slot Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ScheduleSlot['type'])}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="lecture">Lecture</option>
                    <option value="lab">Lab</option>
                    <option value="study_block">Study Block</option>
                    <option value="office_hours">Office Hours</option>
                    <option value="break">Break</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Location (Optional)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Room 204 or Library"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional instructions or materials needed..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Save Slot
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
