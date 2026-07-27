import React, { useState } from 'react';
import { Subject, QuizQuestion, Assignment, UserRole, AssignmentSubmission, AIFeedback } from '../types';
import { 
  Brain, 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  ArrowRight, 
  BookOpen, 
  Layers, 
  X, 
  HelpCircle, 
  Award, 
  Send,
  Trash2,
  FileUp,
  Globe,
  AlertCircle
} from 'lucide-react';

interface QuizGeneratorProps {
  role: UserRole;
  subjects: Subject[];
  onCreateAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt'>) => void;
  onSubmitAssignment?: (submission: Omit<AssignmentSubmission, 'id' | 'submittedAt'>) => void;
}

export const QuizGenerator: React.FC<QuizGeneratorProps> = ({
  role,
  subjects,
  onCreateAssignment,
  onSubmitAssignment
}) => {
  const [sourceMode, setSourceMode] = useState<'document' | 'link' | 'topic'>('document');
  const [documentText, setDocumentText] = useState('');
  const [fileName, setFileName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || 'sub-general');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuizTitle, setGeneratedQuizTitle] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Instant Quiz Taking State
  const [isTakingQuizNow, setIsTakingQuizNow] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<AIFeedback | null>(null);
  const [studentName, setStudentName] = useState('Alex Student');
  const [publishedSuccessMessage, setPublishedSuccessMessage] = useState(false);

  // File Upload Handler (.txt, .md, .csv, .json, etc.)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setDocumentText(content);
        if (!topic) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setTopic(cleanName);
        }
      }
    };
    reader.readAsText(file);
  };

  // Generate Quiz Trigger
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPublishedSuccessMessage(false);

    if (sourceMode === 'document' && !documentText.trim()) {
      setErrorMessage('Please upload a document file or paste document text.');
      return;
    }
    if (sourceMode === 'link' && !linkUrl.trim()) {
      setErrorMessage('Please enter a valid study link or article URL.');
      return;
    }
    if (sourceMode === 'topic' && !topic.trim()) {
      setErrorMessage('Please enter a topic name.');
      return;
    }

    setIsGenerating(true);
    setQuizResult(null);
    setUserAnswers({});

    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic || (sourceMode === 'link' ? linkUrl : 'Study Document'),
          documentText: sourceMode === 'document' ? documentText : undefined,
          linkUrl: sourceMode === 'link' ? linkUrl : undefined,
          numQuestions,
          difficulty
        })
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        const questions: QuizQuestion[] = data.questions.map((q: any, i: number) => ({
          id: `gen-q-${Date.now()}-${i}`,
          question: q.question,
          options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
          explanation: q.explanation || 'Refer to study source material.',
          points: q.points || 20
        }));

        setGeneratedQuestions(questions);
        const inferredTitle = topic
          ? `${topic} Quiz`
          : sourceMode === 'link'
          ? `Quiz from ${new URL(linkUrl).hostname}`
          : fileName
          ? `${fileName.replace(/\.[^/.]+$/, '')} Quiz`
          : 'Document Knowledge Check';
        setGeneratedQuizTitle(inferredTitle);
      } else {
        setErrorMessage(data.error || 'Failed to generate questions. Please try again.');
      }
    } catch (err: any) {
      console.error('Quiz Generation Error:', err);
      setErrorMessage('Network or server error while generating quiz.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit and grade instant quiz
  const handleGradeInstantQuiz = () => {
    let score = 0;
    let totalPoints = 0;
    const questionResults: any[] = [];
    const strengths: string[] = [];
    const improvements: string[] = [];

    generatedQuestions.forEach((q) => {
      totalPoints += q.points;
      const userSelected = userAnswers[q.id];
      const isCorrect = userSelected === q.correctAnswerIndex;

      if (isCorrect) {
        score += q.points;
        strengths.push(`Answered correctly: "${q.question}"`);
      } else {
        improvements.push(`Review question: "${q.question}" — Correct answer was: ${q.options[q.correctAnswerIndex]}`);
      }

      questionResults.push({
        questionId: q.id,
        questionText: q.question,
        selectedAnswer: typeof userSelected === 'number' ? q.options[userSelected] : 'Not answered',
        correctAnswer: q.options[q.correctAnswerIndex],
        isCorrect,
        explanation: q.explanation
      });
    });

    const percentage = Math.round((score / totalPoints) * 100);
    const feedback = percentage >= 80
      ? 'Excellent work! You demonstrated strong mastery of the document material.'
      : percentage >= 50
      ? 'Good effort! You passed, but review the explanations below to solidify your understanding.'
      : 'Consider re-reading the source material and taking the quiz again to improve your score.';

    const result: AIFeedback = {
      score,
      maxScore: totalPoints,
      percentage,
      feedback,
      strengths: strengths.length > 0 ? strengths : ['Completed all questions.'],
      improvements: improvements.length > 0 ? improvements : ['Great job! No major areas for improvement.'],
      questionResults,
      gradedBy: 'ai_assistant',
      gradedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setQuizResult(result);
  };

  // Publish Quiz as Course Assignment
  const handlePublishAsAssignment = () => {
    if (generatedQuestions.length === 0) return;

    const totalPts = generatedQuestions.reduce((sum, q) => sum + q.points, 0);
    onCreateAssignment({
      title: generatedQuizTitle || 'AI Document Quiz',
      description: `Generated quiz based on study document/link. Contains ${generatedQuestions.length} questions.`,
      subjectId: selectedSubjectId,
      type: 'quiz',
      totalPoints: totalPts,
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      dueTime: '23:59',
      questions: generatedQuestions,
      createdBy: role === 'teacher' ? 'Course Instructor' : 'Student AI Quiz Generator'
    });

    setPublishedSuccessMessage(true);
    setTimeout(() => setPublishedSuccessMessage(false), 4000);
  };

  return (
    <div id="quiz-generator-container" className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1 bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-700/50">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              AI Quiz Generator
            </span>
            <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/80 border border-amber-700/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Document & Link Reader
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Generate Quizzes from Documents & Links</h2>
          <p className="text-xs text-purple-200/80 max-w-xl">
            Upload study notes, paste document text, or provide web resource links. Gemini AI converts them into interactive quizzes instantly.
          </p>
        </div>
      </div>

      {/* Main Form & Input Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Configuration (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileUp className="w-4 h-4 text-purple-600" />
              1. Choose Content Source
            </h3>
            <p className="text-xs text-slate-500">Select how you want to feed study material to the AI Generator.</p>
          </div>

          {/* Source Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setSourceMode('document')}
              className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
                sourceMode === 'document' ? 'bg-white text-purple-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Document / Text
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('link')}
              className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
                sourceMode === 'link' ? 'bg-white text-purple-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Web Link / URL
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('topic')}
              className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
                sourceMode === 'topic' ? 'bg-white text-purple-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              Direct Topic
            </button>
          </div>

          <form onSubmit={handleGenerateQuiz} className="space-y-4 text-xs">
            
            {/* Mode 1: Document Upload / Paste */}
            {sourceMode === 'document' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Upload Document File (.txt, .md, .json)</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/40 rounded-xl p-4 cursor-pointer transition-all">
                    <Upload className="w-6 h-6 text-purple-500 mb-1" />
                    <span className="text-xs font-bold text-slate-700">
                      {fileName ? `File Selected: ${fileName}` : 'Click to browse or drop file here'}
                    </span>
                    <span className="text-[10px] text-slate-400">Supports text documents, notes, markdown</span>
                    <input
                      type="file"
                      accept=".txt,.md,.json,.csv,.js,.ts"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Or Paste Document / Study Notes Text *</label>
                  <textarea
                    rows={6}
                    value={documentText}
                    onChange={(e) => setDocumentText(e.target.value)}
                    placeholder="Paste textbook excerpts, lecture notes, formula lists, or lesson summaries here..."
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>
            )}

            {/* Mode 2: Link URL */}
            {sourceMode === 'link' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Study Article / Web Resource Link *</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://en.wikipedia.org/wiki/Calculus or study link"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Gemini AI will read and extract quiz questions directly from this online material.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Topic Name (Optional)</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Organic Chemistry Lecture"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            {/* Mode 3: Topic */}
            {sourceMode === 'topic' && (
              <div>
                <label className="block text-slate-800 font-bold mb-1">Study Topic *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. World War II History or Python Data Structures"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            )}

            {/* Settings */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="font-bold text-slate-900">2. Quiz Options</h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Number of Questions</label>
                  <select
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-1.5 rounded-lg border font-bold capitalize transition-all ${
                        difficulty === diff
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Gemini AI Generating Quiz...' : 'Generate AI Quiz Questions'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Generated Quiz Preview & Interactive Mode (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {generatedQuestions.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3">
              <Brain className="w-12 h-12 text-purple-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Your AI Generated Quiz Preview</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Select your source (upload document text, input a link, or pick a topic) on the left and click "Generate AI Quiz Questions".
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
              
              {/* Quiz Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                    Generated Quiz ({generatedQuestions.length} Questions)
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{generatedQuizTitle}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePublishAsAssignment}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Publish as Course Quiz</span>
                  </button>
                </div>
              </div>

              {publishedSuccessMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold">Quiz successfully added to Course Assignments! Students can now take it in the Assignments tab.</span>
                  </div>
                </div>
              )}

              {/* Questions List & Interactive Mode */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {generatedQuestions.map((q, idx) => (
                  <div key={q.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900">
                        {idx + 1}. {q.question}
                      </h4>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded shrink-0">
                        {q.points} pts
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userAnswers[q.id] === optIdx;
                        const isCorrect = q.correctAnswerIndex === optIdx;
                        const showResult = quizResult !== null;

                        let optionStyle = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';
                        if (showResult) {
                          if (isCorrect) optionStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                          else if (isSelected && !isCorrect) optionStyle = 'bg-rose-50 border-rose-300 text-rose-900 line-through';
                        } else if (isSelected) {
                          optionStyle = 'bg-purple-50 border-purple-400 text-purple-900 font-bold';
                        }

                        return (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${optionStyle}`}
                          >
                            <input
                              type="radio"
                              name={`gen-quiz-q-${q.id}`}
                              checked={isSelected}
                              onChange={() => setUserAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                              className="accent-purple-600"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>

                    {quizResult && (
                      <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-2.5 text-[11px] text-purple-900 space-y-0.5">
                        <span className="font-bold">AI Explanation:</span> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Instant Test Action Footer */}
              {!quizResult ? (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Answer questions above to test yourself immediately</span>
                  <button
                    onClick={handleGradeInstantQuiz}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-2xs"
                  >
                    Check My Instant Answers
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-slate-900 to-purple-950 text-white p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-purple-300 uppercase">Instant Score</span>
                      <h3 className="text-xl font-black">{quizResult.score} / {quizResult.maxScore} ({quizResult.percentage}%)</h3>
                    </div>
                    <button
                      onClick={() => { setQuizResult(null); setUserAnswers({}); }}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-xs text-white rounded-lg font-bold"
                    >
                      Retake Quiz
                    </button>
                  </div>
                  <p className="text-xs text-purple-200">{quizResult.feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
