import React, { useState, useEffect, useRef } from 'react';
import { Task, FocusSession, Subject } from '../types';
import { audioSynth } from '../utils/audioSynth';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  CloudRain, 
  Waves, 
  Wind, 
  CheckCircle, 
  Sparkles, 
  Flame, 
  Target
} from 'lucide-react';

interface FocusTimerProps {
  tasks: Task[];
  subjects: Subject[];
  activeTaskForTimer: Task | null;
  onClearActiveTask: () => void;
  onLogFocusSession: (session: Omit<FocusSession, 'id'>) => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  tasks,
  subjects,
  activeTaskForTimer,
  onClearActiveTask,
  onLogFocusSession
}) => {
  const [mode, setMode] = useState<'work' | 'short_break' | 'long_break'>('work');
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(activeTaskForTimer?.id || '');

  // Sound generator state
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'waves' | 'whitenoise'>('none');
  const [volume, setVolume] = useState<number>(0.3);

  const subjectMap = new Map<string, Subject>(subjects.map(s => [s.id, s]));

  useEffect(() => {
    if (activeTaskForTimer) {
      setSelectedTaskId(activeTaskForTimer.id);
    }
  }, [activeTaskForTimer]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Mode Change
  const handleModeChange = (newMode: 'work' | 'short_break' | 'long_break') => {
    setIsRunning(false);
    setMode(newMode);
    let mins = 25;
    if (newMode === 'short_break') mins = 5;
    if (newMode === 'long_break') mins = 15;
    setDurationMinutes(mins);
    setTimeLeft(mins * 60);
  };

  // Timer Tick Interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            audioSynth.playChime();
            audioSynth.stop();

            // Log session if work mode
            if (mode === 'work') {
              const selectedTask = tasks.find(t => t.id === selectedTaskId);
              onLogFocusSession({
                date: new Date().toISOString().split('T')[0],
                durationMinutes: durationMinutes,
                subjectId: selectedTask ? selectedTask.subjectId : (subjects[0]?.id || 'sub-math'),
                taskTitle: selectedTask ? selectedTask.title : 'General Focus Study'
              });
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, durationMinutes, selectedTaskId, tasks, subjects, onLogFocusSession]);

  // Ambient sound management
  const handleToggleSound = (sound: 'rain' | 'waves' | 'whitenoise') => {
    if (ambientSound === sound) {
      setAmbientSound('none');
      audioSynth.stop();
    } else {
      setAmbientSound(sound);
      audioSynth.playSound(sound, volume);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    audioSynth.setVolume(newVol);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durationMinutes * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTask = tasks.find(t => t.id === selectedTaskId);
  const taskSubject = currentTask ? subjectMap.get(currentTask.subjectId) : null;

  const progressPercent = Math.min(100, Math.max(0, ((durationMinutes * 60 - timeLeft) / (durationMinutes * 60)) * 100));

  return (
    <div id="focus-timer-container" className="max-w-3xl mx-auto space-y-6">
      
      {/* Main Focus Clock Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xs text-center relative overflow-hidden space-y-6">
        
        {/* Subtle background progress bar */}
        <div 
          className="absolute top-0 left-0 h-1 bg-indigo-600 transition-all duration-300" 
          style={{ width: `${progressPercent}%` }}
        />

        {/* Mode Selector Tabs */}
        <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
          <button
            id="timer-mode-work"
            onClick={() => handleModeChange('work')}
            className={`px-4 py-2 rounded-xl transition-all ${
              mode === 'work' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🧠 Focus Session (25m)
          </button>
          <button
            id="timer-mode-short"
            onClick={() => handleModeChange('short_break')}
            className={`px-4 py-2 rounded-xl transition-all ${
              mode === 'short_break' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ☕ Short Break (5m)
          </button>
          <button
            id="timer-mode-long"
            onClick={() => handleModeChange('long_break')}
            className={`px-4 py-2 rounded-xl transition-all ${
              mode === 'long_break' ? 'bg-white text-sky-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌿 Long Break (15m)
          </button>
        </div>

        {/* Big Display Clock */}
        <div className="py-4">
          <div className="text-7xl sm:text-8xl font-black font-mono tracking-tight text-slate-900 select-none">
            {formatTime(timeLeft)}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-2">
            {isRunning ? 'Stay immersed in your task...' : 'Press Start when ready to focus'}
          </p>
        </div>

        {/* Link Task Selector */}
        <div className="max-w-md mx-auto bg-slate-50 border border-slate-200/80 p-3 rounded-2xl space-y-2 text-left">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              Focusing On
            </span>
            {selectedTaskId && (
              <button 
                onClick={() => { setSelectedTaskId(''); onClearActiveTask(); }}
                className="text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <select
            id="focus-timer-task-select"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">General Focused Study / Reading</option>
            {tasks.filter(t => t.status !== 'completed').map(t => (
              <option key={t.id} value={t.id}>
                [{subjectMap.get(t.subjectId)?.code || 'SUB'}] {t.title}
              </option>
            ))}
          </select>

          {currentTask && (
            <div className="flex items-center gap-2 pt-1 text-xs">
              {taskSubject && (
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{ backgroundColor: taskSubject.bgHex, color: taskSubject.textHex }}
                >
                  {taskSubject.name}
                </span>
              )}
              <span className="text-slate-600 font-medium truncate">
                {currentTask.title}
              </span>
            </div>
          )}
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            id="focus-timer-toggle-btn"
            onClick={toggleTimer}
            className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-white shadow-md transition-all active:scale-95 ${
              isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isRunning ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            <span>{isRunning ? 'Pause Session' : 'Start Focus'}</span>
          </button>

          <button
            id="focus-timer-reset-btn"
            onClick={resetTimer}
            className="p-3.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Ambient Sound & Audio Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Ambient Focus Atmosphere
            </h4>
            <p className="text-xs text-slate-500">Soothing audio backgrounds generated natively in your browser</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {ambientSound !== 'none' ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-20 accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            id="ambient-sound-rain-btn"
            onClick={() => handleToggleSound('rain')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
              ambientSound === 'rain'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <CloudRain className="w-4 h-4 text-indigo-500" />
            <span>Gentle Rain</span>
          </button>

          <button
            id="ambient-sound-waves-btn"
            onClick={() => handleToggleSound('waves')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
              ambientSound === 'waves'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Waves className="w-4 h-4 text-sky-500" />
            <span>Ocean Waves</span>
          </button>

          <button
            id="ambient-sound-white-btn"
            onClick={() => handleToggleSound('whitenoise')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
              ambientSound === 'whitenoise'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Wind className="w-4 h-4 text-purple-500" />
            <span>White Noise</span>
          </button>
        </div>
      </div>

    </div>
  );
};
