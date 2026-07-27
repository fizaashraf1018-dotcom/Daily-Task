export type UserRole = 'student' | 'teacher';

export type Priority = 'high' | 'medium' | 'low';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export type Category = 'homework' | 'exam_prep' | 'reading' | 'project' | 'quiz' | 'lecture_review' | 'teaching_prep';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  priority: Priority;
  status: TaskStatus;
  category: Category;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM e.g. "17:00"
  reminderEnabled?: boolean;
  reminderOffset?: 'same_day' | '1_day_before' | '2_days_before' | '1_hour_before';
  estimatedMinutes: number;
  completedAt?: string;
  subtasks: Subtask[];
  createdByRole: UserRole;
  isClassTask?: boolean;
  assignedClass?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string; // Tailwind color name like 'indigo', 'emerald', 'amber', 'sky', 'rose', 'purple'
  bgHex: string;
  textHex: string;
  teacherName?: string;
}

export interface ScheduleSlot {
  id: string;
  time: string; // e.g., "09:00 AM"
  hour: number; // 9
  title: string;
  subjectId: string;
  type: 'lecture' | 'study_block' | 'lab' | 'office_hours' | 'break';
  location?: string;
  notes?: string;
}

export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  subjectId: string;
  taskTitle?: string;
}

export interface StudyNote {
  id: string;
  title: string;
  subjectId: string;
  content: string;
  updatedAt: string;
  tags: string[];
}

export interface Flashcard {
  id: string;
  subjectId: string;
  question: string;
  answer: string;
  mastered: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  subjectId: string;
  urgent?: boolean;
}

export interface SyllabusItem {
  id: string;
  subjectId: string;
  topic: string;
  status: 'not_started' | 'teaching' | 'completed';
  targetDate: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  points: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  type: 'assignment' | 'quiz';
  totalPoints: number;
  dueDate: string;
  dueTime?: string;
  questions?: QuizQuestion[];
  rubricInstructions?: string;
  createdBy: string;
  createdAt: string;
}

export interface AIFeedback {
  score: number;
  maxScore: number;
  percentage: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  questionResults?: {
    questionId: string;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  gradedBy: 'ai_assistant' | 'teacher';
  gradedAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentName: string;
  submittedAt: string;
  quizAnswers?: Record<string, number>; // questionId -> selectedOptionIndex
  textSubmission?: string;
  status: 'pending' | 'graded';
  grade?: AIFeedback;
}

