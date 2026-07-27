import React, { useState } from 'react';
import { StudyNote, Flashcard, Subject } from '../types';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Search, 
  RotateCw, 
  CheckCircle, 
  XCircle, 
  Sparkles, 
  Tag, 
  BookOpen, 
  HelpCircle
} from 'lucide-react';

interface NotesAndCardsProps {
  notes: StudyNote[];
  flashcards: Flashcard[];
  subjects: Subject[];
  onAddNote: (note: Omit<StudyNote, 'id' | 'updatedAt'>) => void;
  onDeleteNote: (noteId: string) => void;
  onAddFlashcard: (card: Omit<Flashcard, 'id' | 'mastered'>) => void;
  onToggleFlashcardMastered: (cardId: string) => void;
  onDeleteFlashcard: (cardId: string) => void;
}

export const NotesAndCards: React.FC<NotesAndCardsProps> = ({
  notes,
  flashcards,
  subjects,
  onAddNote,
  onDeleteNote,
  onAddFlashcard,
  onToggleFlashcardMastered,
  onDeleteFlashcard
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'notes' | 'flashcards'>('notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string | null>(null);

  // Notes Form Modal State
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSubjectId, setNoteSubjectId] = useState(subjects[0]?.id || 'sub-math');
  const [noteTagText, setNoteTagText] = useState('');

  // Flashcards State
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [cardQuestion, setCardQuestion] = useState('');
  const [cardAnswer, setCardAnswer] = useState('');
  const [cardSubjectId, setCardSubjectId] = useState(subjects[0]?.id || 'sub-math');

  // Flashcard Review Mode State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const subjectMap = new Map<string, Subject>(subjects.map(s => [s.id, s]));

  const filteredNotes = notes.filter(n => {
    if (selectedSubjectFilter && n.subjectId !== selectedSubjectFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = n.title.toLowerCase().includes(q);
      const matchesContent = n.content.toLowerCase().includes(q);
      const matchesTag = n.tags.some(t => t.toLowerCase().includes(q));
      if (!matchesTitle && !matchesContent && !matchesTag) return false;
    }
    return true;
  });

  const filteredCards = flashcards.filter(c => {
    if (selectedSubjectFilter && c.subjectId !== selectedSubjectFilter) return false;
    return true;
  });

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    onAddNote({
      title: noteTitle.trim(),
      content: noteContent.trim(),
      subjectId: noteSubjectId,
      tags: noteTagText ? noteTagText.split(',').map(t => t.trim()) : []
    });

    setIsAddNoteOpen(false);
    setNoteTitle('');
    setNoteContent('');
    setNoteTagText('');
  };

  const handleSaveFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardQuestion.trim() || !cardAnswer.trim()) return;

    onAddFlashcard({
      question: cardQuestion.trim(),
      answer: cardAnswer.trim(),
      subjectId: cardSubjectId
    });

    setIsAddCardOpen(false);
    setCardQuestion('');
    setCardAnswer('');
  };

  const activeCard = filteredCards[currentCardIndex] || null;

  return (
    <div id="notes-cards-container" className="space-y-6">
      
      {/* Sub-tab Navigation Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200">
          <button
            id="subtab-notes-btn"
            onClick={() => setActiveSubTab('notes')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'notes' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📝 Study Notes & Scratchpad ({notes.length})
          </button>
          <button
            id="subtab-cards-btn"
            onClick={() => setActiveSubTab('flashcards')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'flashcards' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎴 Flashcard Decks ({flashcards.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Subject Selector */}
          <select
            id="notes-subject-filter-select"
            value={selectedSubjectFilter || ''}
            onChange={(e) => setSelectedSubjectFilter(e.target.value ? e.target.value : null)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
            ))}
          </select>

          {activeSubTab === 'notes' ? (
            <button
              id="open-add-note-modal-btn"
              onClick={() => setIsAddNoteOpen(true)}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Note</span>
            </button>
          ) : (
            <button
              id="open-add-card-modal-btn"
              onClick={() => setIsAddCardOpen(true)}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Flashcard</span>
            </button>
          )}
        </div>
      </div>

      {/* NOTES VIEW */}
      {activeSubTab === 'notes' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes by formula, title, or tags..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.map((note) => {
              const subject = subjectMap.get(note.subjectId);
              return (
                <div
                  key={note.id}
                  id={`note-card-${note.id}`}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:border-indigo-200 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      {subject && (
                        <span 
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: subject.bgHex, color: subject.textHex }}
                        >
                          {subject.code}: {subject.name}
                        </span>
                      )}
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="text-slate-300 hover:text-rose-600 p-1"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {note.title}
                    </h4>

                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {note.content}
                    </pre>
                  </div>

                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100">
                      {note.tags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FLASHCARDS REVISION VIEW */}
      {activeSubTab === 'flashcards' && (
        <div className="space-y-6">
          {filteredCards.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No flashcards found. Create your first flashcard to start practicing!</p>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-4">
              
              {/* Progress counter */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Card {currentCardIndex + 1} of {filteredCards.length}</span>
                <span>
                  Mastered: {filteredCards.filter(c => c.mastered).length} / {filteredCards.length}
                </span>
              </div>

              {/* Flip Card Container */}
              {activeCard && (
                <div
                  id="flashcard-flipper"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`min-h-56 bg-white border border-slate-200 rounded-3xl p-8 shadow-md flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 transform ${
                    isFlipped ? 'bg-indigo-50/40 border-indigo-200 ring-2 ring-indigo-200' : 'hover:border-indigo-300'
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span className="uppercase tracking-wider">
                      {isFlipped ? 'Answer' : 'Question'}
                    </span>
                    <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                      <RotateCw className="w-3 h-3" /> Click to Flip
                    </span>
                  </div>

                  <div className="my-auto py-4">
                    <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                      {isFlipped ? activeCard.answer : activeCard.question}
                    </p>
                  </div>

                  <div className="text-xs text-slate-400 font-medium">
                    {activeCard.mastered ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Mastered
                      </span>
                    ) : (
                      <span>Needs Practice</span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3">
                <button
                  id="prev-flashcard-btn"
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : filteredCards.length - 1));
                  }}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  ← Previous
                </button>

                {activeCard && (
                  <button
                    id="toggle-mastered-flashcard-btn"
                    onClick={() => onToggleFlashcardMastered(activeCard.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeCard.mastered
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {activeCard.mastered ? '✓ Mark as Review Needed' : '★ Mark as Mastered'}
                  </button>
                )}

                <button
                  id="next-flashcard-btn"
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIndex((prev) => (prev < filteredCards.length - 1 ? prev + 1 : 0));
                  }}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Next →
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Add Note Modal */}
      {isAddNoteOpen && (
        <div id="add-note-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create Study Note</h3>
            <form onSubmit={handleSaveNote} className="space-y-3 text-xs font-medium text-slate-700">
              <div>
                <label className="block text-slate-800 font-bold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Organic Chemistry Reactions Cheat Sheet"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Subject</label>
                <select
                  value={noteSubjectId}
                  onChange={(e) => setNoteSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Content / Formulas</label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Type study formulas, chapter summaries, or lecture takeaways..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={noteTagText}
                  onChange={(e) => setNoteTagText(e.target.value)}
                  placeholder="exam, formulas, key-concept"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddNoteOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Flashcard Modal */}
      {isAddCardOpen && (
        <div id="add-flashcard-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create Revision Flashcard</h3>
            <form onSubmit={handleSaveFlashcard} className="space-y-3 text-xs font-medium text-slate-700">
              <div>
                <label className="block text-slate-800 font-bold mb-1">Subject</label>
                <select
                  value={cardSubjectId}
                  onChange={(e) => setCardSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Front Question *</label>
                <textarea
                  rows={2}
                  required
                  value={cardQuestion}
                  onChange={(e) => setCardQuestion(e.target.value)}
                  placeholder="e.g. What is the time complexity of QuickSort?"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Back Answer *</label>
                <textarea
                  rows={2}
                  required
                  value={cardAnswer}
                  onChange={(e) => setCardAnswer(e.target.value)}
                  placeholder="e.g. Average: O(n log n), Worst: O(n²)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCardOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Create Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
