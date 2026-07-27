import React, { useState } from 'react';
import { Subject, Assignment, AssignmentSubmission, UserRole, QuizQuestion, AIFeedback } from '../types';
import { 
  FileCheck, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  BookOpen, 
  Send, 
  Bot, 
  Award, 
  AlertCircle, 
  Trash2, 
  User, 
  ChevronRight, 
  MessageSquare, 
  Brain, 
  FileText, 
  RotateCcw,
  X,
  Check,
  Edit2
} from 'lucide-react';

interface AssignmentsViewProps {
  role: UserRole;
  subjects: Subject[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  onCreateAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt'>) => void;
  onDeleteAssignment: (id: string) => void;
  onSubmitAssignment: (submission: Omit<AssignmentSubmission, 'id' | 'submittedAt'>) => void;
  onUpdateGrade: (submissionId: string, grade: AIFeedback) => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  role,
  subjects,
  assignments,
  submissions,
  onCreateAssignment,
  onDeleteAssignment,
  onSubmitAssignment,
  onUpdateGrade
}) => {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'assignments' | 'submissions'>('assignments');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAssignmentForSubmission, setSelectedAssignmentForSubmission] = useState<Assignment | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<AssignmentSubmission | null>(null);

  // AI Assistant Drawer state
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    {
      sender: 'ai',
      text: role === 'teacher' 
        ? "Hello Professor! I am your AI Grading & Quiz Assistant. I can help evaluate submissions, build rubrics, or generate new quiz questions."
        : "Hi there! I'm your AI Assignment Tutor. I can help explain quiz concepts, review your draft answers before submitting, or provide study hints!"
    }
  ]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [isAiChatLoading, setIsAiChatLoading] = useState(false);

  // New Assignment Form State
  const [assignType, setAssignType] = useState<'assignment' | 'quiz'>('assignment');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState(subjects[0]?.id || '');
  const [assignTotalPoints, setAssignTotalPoints] = useState(100);
  const [assignDueDate, setAssignDueDate] = useState(() => new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [assignDueTime, setAssignDueTime] = useState('23:59');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q-1',
      question: 'Sample Question 1?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswerIndex: 0,
      explanation: 'Explanation for correct answer',
      points: 25
    }
  ]);
  const [isGeneratingQuizAI, setIsGeneratingQuizAI] = useState(false);
  const [aiQuizTopic, setAiQuizTopic] = useState('');

  // Student Taking Assignment / Quiz State
  const [studentTextAnswer, setStudentTextAnswer] = useState('');
  const [studentQuizAnswers, setStudentQuizAnswers] = useState<Record<string, number>>({});
  const [studentNameInput, setStudentNameInput] = useState('Alex Morgan');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiGradingActive, setIsAiGradingActive] = useState<string | null>(null); // submissionId being graded

  const subjectMap = new Map<string, Subject>(subjects.map(s => [s.id, s]));

  const filteredAssignments = assignments.filter(a => {
    if (selectedSubjectFilter !== 'all' && a.subjectId !== selectedSubjectFilter) return false;
    return true;
  });

  // AI Quiz Question Generator
  const handleGenerateAIQuiz = async () => {
    if (!aiQuizTopic.trim()) return;
    setIsGeneratingQuizAI(true);
    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiQuizTopic, numQuestions: 4, difficulty: 'medium' })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        const generated: QuizQuestion[] = data.questions.map((q: any, i: number) => ({
          id: `q-ai-${Date.now()}-${i}`,
          question: q.question,
          options: q.options || ['A', 'B', 'C', 'D'],
          correctAnswerIndex: q.correctAnswerIndex ?? 0,
          explanation: q.explanation || '',
          points: q.points || 25
        }));
        setQuizQuestions(generated);
        const total = generated.reduce((acc, q) => acc + q.points, 0);
        setAssignTotalPoints(total);
      }
    } catch (err) {
      console.error('Failed to generate AI quiz:', err);
    } finally {
      setIsGeneratingQuizAI(false);
    }
  };

  const handleAddQuestion = () => {
    setQuizQuestions(prev => [
      ...prev,
      {
        id: `q-${Date.now()}`,
        question: `Question ${prev.length + 1}`,
        options: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'],
        correctAnswerIndex: 0,
        explanation: '',
        points: 25
      }
    ]);
  };

  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    setQuizQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuizQuestions(prev => {
      const copy = [...prev];
      const opts = [...copy[qIndex].options];
      opts[optIndex] = value;
      copy[qIndex] = { ...copy[qIndex], options: opts };
      return copy;
    });
  };

  const handleCreateAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim()) return;

    onCreateAssignment({
      title: assignTitle.trim(),
      description: assignDesc.trim(),
      subjectId: assignSubjectId || subjects[0]?.id || 'sub-general',
      type: assignType,
      totalPoints: Number(assignTotalPoints) || 100,
      dueDate: assignDueDate,
      dueTime: assignDueTime,
      questions: assignType === 'quiz' ? quizQuestions : undefined,
      rubricInstructions: assignType === 'assignment' ? assignDesc : undefined,
      createdBy: role === 'teacher' ? 'Course Instructor' : 'Student Study Group'
    });

    setIsCreateModalOpen(false);
    setAssignTitle('');
    setAssignDesc('');
  };

  // Student submits Assignment or Quiz
  const handleStudentSubmit = async (runAiCheckImmediately: boolean = false) => {
    if (!selectedAssignmentForSubmission) return;
    setIsSubmitting(true);

    const newSub: Omit<AssignmentSubmission, 'id' | 'submittedAt'> = {
      assignmentId: selectedAssignmentForSubmission.id,
      studentName: studentNameInput.trim() || 'Student User',
      quizAnswers: selectedAssignmentForSubmission.type === 'quiz' ? studentQuizAnswers : undefined,
      textSubmission: selectedAssignmentForSubmission.type === 'assignment' ? studentTextAnswer : undefined,
      status: 'pending'
    };

    // If immediate AI check requested
    if (runAiCheckImmediately) {
      try {
        const res = await fetch('/api/ai/grade-submission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignment: selectedAssignmentForSubmission,
            submission: newSub
          })
        });
        const data = await res.json();
        if (data.success && data.grade) {
          const aiGrade: AIFeedback = {
            ...data.grade,
            gradedBy: 'ai_assistant',
            gradedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          onSubmitAssignment({
            ...newSub,
            status: 'graded',
            grade: aiGrade
          });
          setIsSubmitting(false);
          setSelectedAssignmentForSubmission(null);
          setStudentTextAnswer('');
          setStudentQuizAnswers({});
          return;
        }
      } catch (err) {
        console.error('Immediate AI check error:', err);
      }
    }

    onSubmitAssignment(newSub);
    setIsSubmitting(false);
    setSelectedAssignmentForSubmission(null);
    setStudentTextAnswer('');
    setStudentQuizAnswers({});
  };

  // Trigger AI Assistant Grade for any submission
  const handleGradeSubmissionWithAI = async (sub: AssignmentSubmission) => {
    const assignment = assignments.find(a => a.id === sub.assignmentId);
    if (!assignment) return;

    setIsAiGradingActive(sub.id);
    try {
      const res = await fetch('/api/ai/grade-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment,
          submission: sub
        })
      });
      const data = await res.json();
      if (data.success && data.grade) {
        const aiGrade: AIFeedback = {
          ...data.grade,
          gradedBy: 'ai_assistant',
          gradedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        onUpdateGrade(sub.id, aiGrade);
      }
    } catch (err) {
      console.error('AI Grading error:', err);
    } finally {
      setIsAiGradingActive(null);
    }
  };

  // Handle AI Chat
  const handleSendAIChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatInput.trim() || isAiChatLoading) return;

    const userText = aiChatInput.trim();
    setAiChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setAiChatInput('');
    setIsAiChatLoading(true);

    try {
      const res = await fetch('/api/ai/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          role,
          context: { assignments, submissionsCount: submissions.length }
        })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setAiChatMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      }
    } catch (err) {
      setAiChatMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I had trouble processing that request. Please try again!" }]);
    } finally {
      setIsAiChatLoading(false);
    }
  };

  return (
    <div id="assignments-view-container" className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-700/50">
              <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
              Assignments & Quiz Portal
            </span>
            <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-700/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> AI Graded
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Interactive Course Work & AI Evaluation</h2>
          <p className="text-xs text-indigo-200/80 max-w-xl">
            {role === 'teacher'
              ? 'Create custom quizzes and assignments, view student submissions, and run automated AI evaluations.'
              : 'Complete your class quizzes and assignments, get instant AI checking, and review detailed score breakdowns.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAIAssistantOpen(true)}
            className="inline-flex items-center gap-1.5 bg-purple-600/80 hover:bg-purple-600 border border-purple-400/40 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs"
          >
            <Bot className="w-4 h-4 text-purple-200" />
            <span>AI Assistant Tutor</span>
          </button>

          {role === 'teacher' && (
            <button
              id="open-create-assignment-btn"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assignment / Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation & Subject Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-slate-200/90 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'assignments'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Coursework ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'submissions'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Submissions ({submissions.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Subject Filter:</span>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium outline-none"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MAIN TAB CONTENT */}
      {activeTab === 'assignments' ? (
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Course Assignments Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {role === 'teacher' 
                  ? 'Click "Create Assignment / Quiz" above to publish coursework for your students.' 
                  : 'Your instructors have not posted any assignments yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssignments.map((a) => {
                const subject = subjectMap.get(a.subjectId);
                const isQuiz = a.type === 'quiz';
                const userSub = submissions.find(s => s.assignmentId === a.id);

                return (
                  <div
                    key={a.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3 flex flex-col justify-between hover:border-indigo-200 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {isQuiz ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Brain className="w-3 h-3 text-purple-600" /> Quiz
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <FileText className="w-3 h-3 text-blue-600" /> Assignment
                            </span>
                          )}

                          {subject && (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                              style={{ backgroundColor: subject.bgHex, color: subject.textHex }}
                            >
                              {subject.code}
                            </span>
                          )}
                        </div>

                        {role === 'teacher' && (
                          <button
                            onClick={() => onDeleteAssignment(a.id)}
                            className="text-slate-300 hover:text-rose-600 p-1 rounded"
                            title="Delete Assignment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{a.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2">{a.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Due {a.dueDate} {a.dueTime}
                        </span>
                        <span className="font-bold text-indigo-600">{a.totalPoints} pts</span>
                      </div>

                      {userSub ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Submitted</span>
                          </div>
                          {userSub.grade ? (
                            <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              Score: {userSub.grade.score}/{userSub.grade.maxScore}
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-md">
                              Pending Grade
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedAssignmentForSubmission(a)}
                          className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all"
                        >
                          <span>{isQuiz ? 'Take Quiz' : 'Submit Assignment'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* SUBMISSIONS TAB */
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
              <Award className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Submissions Yet</h3>
              <p className="text-xs text-slate-500">Submissions from students will appear here for grading and review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => {
                const assignment = assignments.find(a => a.id === sub.assignmentId);
                const subject = assignment ? subjectMap.get(assignment.subjectId) : null;
                const isGradingThis = isAiGradingActive === sub.id;

                return (
                  <div
                    key={sub.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-indigo-600" />
                            {sub.studentName}
                          </span>
                          {subject && (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                              style={{ backgroundColor: subject.bgHex, color: subject.textHex }}
                            >
                              {subject.code}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-slate-400">{sub.submittedAt}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-700">
                          Assignment: <span className="font-bold text-slate-900">{assignment?.title || 'Course Task'}</span>
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {sub.status === 'graded' && sub.grade ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl">
                              Score: {sub.grade.score} / {sub.grade.maxScore} ({sub.grade.percentage}%)
                            </span>
                            <button
                              onClick={() => setViewingSubmission(sub)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline"
                            >
                              View AI Review
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleGradeSubmissionWithAI(sub)}
                            disabled={isGradingThis}
                            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all disabled:opacity-50"
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${isGradingThis ? 'animate-spin' : ''}`} />
                            <span>{isGradingThis ? 'AI Assistant Checking...' : 'Grade with AI Assistant'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Submission Content Preview */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-2">
                      <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Submission Content:</p>
                      {sub.textSubmission ? (
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{sub.textSubmission}</p>
                      ) : sub.quizAnswers ? (
                        <div className="text-slate-700 font-mono text-[11px]">
                          Quiz submission with {Object.keys(sub.quizAnswers).length} questions answered.
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">No content submitted.</p>
                      )}
                    </div>

                    {/* AI Feedback Preview if graded */}
                    {sub.grade && (
                      <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                            <Bot className="w-3.5 h-3.5 text-indigo-600" /> AI Assistant Feedback
                          </span>
                          <span className="text-[10px] text-indigo-600 font-medium">Graded by {sub.grade.gradedBy}</span>
                        </div>
                        <p className="text-xs text-slate-700">{sub.grade.feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STUDENT SUBMISSION MODAL */}
      {selectedAssignmentForSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                  {selectedAssignmentForSubmission.type === 'quiz' ? 'Interactive Quiz' : 'Assignment Submission'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedAssignmentForSubmission.title}</h3>
                <p className="text-xs text-slate-500">Due: {selectedAssignmentForSubmission.dueDate} | Total: {selectedAssignmentForSubmission.totalPoints} points</p>
              </div>
              <button
                onClick={() => setSelectedAssignmentForSubmission(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Your Name</label>
                <input
                  type="text"
                  value={studentNameInput}
                  onChange={(e) => setStudentNameInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {selectedAssignmentForSubmission.type === 'quiz' ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 font-medium">Answer all multiple-choice questions below:</p>
                  {(selectedAssignmentForSubmission.questions || []).map((q, idx) => (
                    <div key={q.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                      <h4 className="text-xs font-bold text-slate-900">
                        {idx + 1}. {q.question} ({q.points} pts)
                      </h4>
                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt, optIdx) => (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                              studentQuizAnswers[q.id] === optIdx
                                ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900'
                                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`quiz-q-${q.id}`}
                              checked={studentQuizAnswers[q.id] === optIdx}
                              onChange={() => setStudentQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                              className="accent-indigo-600"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl text-xs text-slate-700">
                    <p className="font-bold text-indigo-900 mb-1">Assignment Instructions:</p>
                    <p>{selectedAssignmentForSubmission.description}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Your Solution / Written Response *</label>
                    <textarea
                      rows={6}
                      value={studentTextAnswer}
                      onChange={(e) => setStudentTextAnswer(e.target.value)}
                      placeholder="Type your detailed answer, essay, or steps here..."
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAssignmentForSubmission(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStudentSubmit(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Submit
                </button>

                <button
                  type="button"
                  onClick={() => handleStudentSubmit(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Submit & Run Instant AI Check</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ASSIGNMENT / QUIZ MODAL FOR TEACHER */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                Create New Coursework / Quiz
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignmentSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAssignType('assignment')}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    assignType === 'assignment' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Written Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setAssignType('quiz')}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    assignType === 'quiz' ? 'bg-white text-purple-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Interactive Quiz
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Subject / Course</label>
                  <select
                    value={assignSubjectId}
                    onChange={(e) => setAssignSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Total Points</label>
                  <input
                    type="number"
                    value={assignTotalPoints}
                    onChange={(e) => setAssignTotalPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="e.g. Midterm Physics Magnetism Quiz or Data Structures Essay"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  placeholder="Provide instructions or grading rubric criteria..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Due Time</label>
                  <input
                    type="time"
                    value={assignDueTime}
                    onChange={(e) => setAssignDueTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Quiz Builder Section */}
              {assignType === 'quiz' && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-3 space-y-2">
                    <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      Generate Quiz Questions automatically using AI Assistant
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiQuizTopic}
                        onChange={(e) => setAiQuizTopic(e.target.value)}
                        placeholder="e.g. Calculus Integration Formulas or Python Recursion"
                        className="flex-1 px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateAIQuiz}
                        disabled={isGeneratingQuizAI}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 disabled:opacity-50"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isGeneratingQuizAI ? 'animate-spin' : ''}`} />
                        <span>{isGeneratingQuizAI ? 'Generating...' : 'Generate AI Questions'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">Quiz Questions ({quizQuestions.length})</h4>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Question
                    </button>
                  </div>

                  {quizQuestions.map((q, qIndex) => (
                    <div key={q.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-700">Question #{qIndex + 1}</span>
                        <button
                          type="button"
                          onClick={() => setQuizQuestions(prev => prev.filter((_, i) => i !== qIndex))}
                          className="text-slate-300 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleUpdateQuestion(qIndex, 'question', e.target.value)}
                        placeholder="Type question wording..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                      />

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-1.5">
                            <input
                              type="radio"
                              name={`correct-opt-${q.id}`}
                              checked={q.correctAnswerIndex === optIndex}
                              onChange={() => handleUpdateQuestion(qIndex, 'correctAnswerIndex', optIndex)}
                              title="Mark as correct answer"
                              className="accent-emerald-600 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                              placeholder={`Option ${optIndex + 1}`}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Publish Coursework
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILED AI SUBMISSION REVIEW MODAL */}
      {viewingSubmission && viewingSubmission.grade && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  AI Assistant Evaluation Report
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{viewingSubmission.studentName}'s Grade</h3>
                <p className="text-xs text-slate-500">Evaluated on {viewingSubmission.grade.gradedAt}</p>
              </div>
              <button onClick={() => setViewingSubmission(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Highlight Badge */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-300 uppercase">Final Score</span>
                <h2 className="text-2xl font-extrabold">{viewingSubmission.grade.score} / {viewingSubmission.grade.maxScore}</h2>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400">{viewingSubmission.grade.percentage}%</span>
                <p className="text-[11px] text-indigo-200">AI Verified</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">Summary Feedback:</h4>
                <p className="text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 leading-relaxed">
                  {viewingSubmission.grade.feedback}
                </p>
              </div>

              {viewingSubmission.grade.strengths.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Strengths:
                  </h4>
                  <ul className="list-disc list-inside text-slate-700 space-y-1 pl-1">
                    {viewingSubmission.grade.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {viewingSubmission.grade.improvements.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-800 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-amber-600" /> Areas for Improvement:
                  </h4>
                  <ul className="list-disc list-inside text-slate-700 space-y-1 pl-1">
                    {viewingSubmission.grade.improvements.map((imp, idx) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewingSubmission(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING AI ASSISTANT TUTOR DRAWER */}
      {isAIAssistantOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-bold">AI Course & Study Assistant</h3>
                <p className="text-[10px] text-indigo-300">Powered by Gemini AI Engine</p>
              </div>
            </div>
            <button onClick={() => setIsAIAssistantOpen(false)} className="text-slate-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {aiChatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                    AI
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/80'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isAiChatLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-500" />
                <span>AI Assistant thinking...</span>
              </div>
            )}
          </div>

          {/* Form Input */}
          <form onSubmit={handleSendAIChat} className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2">
            <input
              type="text"
              value={aiChatInput}
              onChange={(e) => setAiChatInput(e.target.value)}
              placeholder={role === 'teacher' ? 'Ask AI to generate quiz questions or rubrics...' : 'Ask AI for study tips or assignment help...'}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              disabled={isAiChatLoading}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
