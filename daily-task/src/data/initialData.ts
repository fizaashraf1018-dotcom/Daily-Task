import { Subject, Task, ScheduleSlot, StudyNote, Flashcard, Announcement, SyllabusItem } from '../types';

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub-general',
    name: 'General',
    code: 'GEN 101',
    color: 'indigo',
    bgHex: '#e0e7ff',
    textHex: '#3730a3',
    teacherName: 'Main Instructor',
  }
];

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_SCHEDULE: ScheduleSlot[] = [];

export const INITIAL_NOTES: StudyNote[] = [];

export const INITIAL_FLASHCARDS: Flashcard[] = [];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export const INITIAL_SYLLABUS: SyllabusItem[] = [];

