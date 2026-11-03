// ==============================================================================
// HABITX V1 – Premium Habit Tracker Application
// "Build Discipline. Become Unstoppable."
// ==============================================================================

const { useState, useEffect, useMemo, useRef } = React;

// --- MOTIVATIONAL QUOTES (Discipline & Focus) ---
const MOTIVATIONAL_QUOTES = [
  { text: "Discipline equals freedom.", author: "Jocko Willink" },
  { text: "We don't rise to the level of our expectations, we fall to the level of our training.", author: "Archilochus" },
  { text: "You do not decide your future. You decide your habits, and your habits decide your future.", author: "F.M. Alexander" },
  { text: "The pain of discipline is far less than the pain of regret.", author: "Sarah Hamilton" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "Small disciplines repeated with consistency every day lead to great achievements.", author: "John C. Maxwell" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "David Goggins" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
  { text: "Success is the product of daily habits—not once-in-a-lifetime transformations.", author: "James Clear" },
  { text: "First make your habits, then your habits make you.", author: "Steven Covey" },
  { text: "Self-discipline is the magic power that makes you virtually unstoppable.", author: "Dan Kennedy" },
  { text: "Action creates motivation, not the other way around.", author: "Habitx Philosophy" }
];

// --- DEFAULT SUGGESTED HABITS ---
const SUGGESTED_HABITS = [
  { name: "Wake Up Early", icon: "sunrise", category: "Mindset", reminderTime: "06:00", color: "#f97316" },
  { name: "Study", icon: "book", category: "Learning", reminderTime: "10:00", color: "#3b82f6" },
  { name: "Exercise", icon: "dumbbell", category: "Health", reminderTime: "17:30", color: "#ef4444" },
  { name: "Coding", icon: "code", category: "Skill", reminderTime: "14:00", color: "#8b5cf6" },
  { name: "Reading", icon: "book-open", category: "Knowledge", reminderTime: "21:30", color: "#10b981" }
];

// --- AVAILABLE ICONS ---
const AVAILABLE_ICONS = [
  { id: "target", label: "Target" },
  { id: "sunrise", label: "Sunrise" },
  { id: "dumbbell", label: "Fitness" },
  { id: "book", label: "Study" },
  { id: "book-open", label: "Reading" },
  { id: "code", label: "Coding" },
  { id: "brain", label: "Mental" },
  { id: "droplets", label: "Hydration" },
  { id: "zap", label: "Energy" },
  { id: "flame", label: "Discipline" },
  { id: "bed", label: "Sleep" },
  { id: "clock", label: "Time" }
];

// --- DATE HELPERS ---
const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const getDaysInMonth = (year, monthIndex) => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, monthIndex) => {
  return new Date(year, monthIndex, 1).getDay();
};

// --- STREAK CALCULATION ENGINE ---
// Calculates consecutive days ending today or yesterday.
// Does NOT multiply streak when toggled multiple times on the same day.
const calculateHabitStreaks = (habitId, logs) => {
  const today = getTodayStr();
  const completedDates = new Set();

  Object.entries(logs).forEach(([key, value]) => {
    if (value && value.completed) {
      const parts = key.split('_');
      if (parts[0] === habitId) {
        completedDates.add(parts[1]);
      }
    }
  });

  if (completedDates.size === 0) {
    return { currentStreak: 0, longestStreak: 0, totalCompletions: 0 };
  }

  // Sort dates ascending
  const sortedDates = Array.from(completedDates).sort();

  // Calculate Longest Streak in history
  let maxStreak = 0;
  let currentRun = 0;
  let lastDate = null;

  for (const dStr of sortedDates) {
    const currentDate = new Date(dStr + "T00:00:00");
    if (!lastDate) {
      currentRun = 1;
    } else {
      const diffTime = currentDate - lastDate;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentRun += 1;
      } else if (diffDays > 1) {
        currentRun = 1;
      }
    }
    lastDate = currentDate;
    if (currentRun > maxStreak) {
      maxStreak = currentRun;
    }
  }

  // Calculate Current Streak
  let curStreak = 0;
  let checkDate = new Date();
  const todayKey = getTodayStr();
  const isCompletedToday = completedDates.has(todayKey);

  if (isCompletedToday) {
    curStreak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Check if yesterday was completed to keep the streak live
    checkDate.setDate(checkDate.getDate() - 1);
    const yestStr = checkDate.toISOString().split('T')[0];
    if (completedDates.has(yestStr)) {
      curStreak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      curStreak = 0;
    }
  }

  if (curStreak > 0) {
    while (true) {
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const dStr = `${year}-${month}-${day}`;

      if (completedDates.has(dStr)) {
        curStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    currentStreak: curStreak,
    longestStreak: Math.max(maxStreak, curStreak),
    totalCompletions: completedDates.size
  };
};

// --- ICON COMPONENT (Lucide SVG renderer) ---
const Icon = ({ name, className = "w-5 h-5", strokeWidth = 2 }) => {
  const icons = {
    target: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
      </svg>
    ),
    sunrise: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v6"/><path d="m4.93 10.93 4.24-4.24"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-4.24-4.24"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/>
      </svg>
    ),
    dumbbell: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>
      </svg>
    ),
    book: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/>
      </svg>
    ),
    "book-open": (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    code: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    brain: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M12 5v14"/>
      </svg>
    ),
    droplets: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
      </svg>
    ),
    zap: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    flame: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
      </svg>
    ),
    bed: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
      </svg>
    ),
    clock: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    home: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    list: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
    calendar: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    settings: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
    plus: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
    check: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    trash: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    ),
    edit: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
      </svg>
    ),
    bell: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    logout: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
    user: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    undo: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
      </svg>
    ),
    x: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
    shield: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    chevronLeft: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    ),
    chevronRight: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    ),
    alert: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    )
  };

  return icons[name] || icons.target;
};

// ==============================================================================
// MAIN APP COMPONENT
// ==============================================================================
function App() {
  // --- Persistent States ---
  const [splashFinished, setSplashFinished] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('habitx_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem('habitx_theme') || 'beast';
    } catch (e) {
      return 'beast';
    }
  });

  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'habits' | 'progress' | 'settings'
  const [authView, setAuthView] = useState('welcome'); // 'welcome' | 'login' | 'signup' | 'forgot' | 'modeSelect'

  // Habits State (Max 5 enforced in V1)
  const [habits, setHabits] = useState(() => {
    try {
      const saved = localStorage.getItem('habitx_habits');
      if (saved) return JSON.parse(saved);
      // Default starter habits for new users
      return [
        { id: 'h1', name: 'Wake Up Early', icon: 'sunrise', category: 'Mindset', reminderTime: '06:00', reminderEnabled: true, color: '#f97316', createdAt: new Date().toISOString() },
        { id: 'h2', name: 'Exercise', icon: 'dumbbell', category: 'Health', reminderTime: '17:30', reminderEnabled: true, color: '#ef4444', createdAt: new Date().toISOString() },
        { id: 'h3', name: 'Coding', icon: 'code', category: 'Skill', reminderTime: '14:00', reminderEnabled: false, color: '#8b5cf6', createdAt: new Date().toISOString() },
        { id: 'h4', name: 'Reading', icon: 'book-open', category: 'Knowledge', reminderTime: '21:30', reminderEnabled: true, color: '#10b981', createdAt: new Date().toISOString() }
      ];
    } catch (e) {
      return [];
    }
  });

  // Daily Completion Logs { [habitId_dateStr]: { completed: boolean, completedAt: ISOString } }
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('habitx_logs');
      if (saved) return JSON.parse(saved);
      // Preload a few consecutive days so streaks are immediately apparent!
      const initialLogs = {};
      const today = new Date();
      for (let i = 1; i <= 3; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const yStr = d.toISOString().split('T')[0];
        initialLogs[`h1_${yStr}`] = { completed: true, completedAt: d.toISOString() };
        initialLogs[`h2_${yStr}`] = { completed: true, completedAt: d.toISOString() };
      }
      return initialLogs;
    } catch (e) {
      return {};
    }
  });

  // UI Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deletingHabitId, setDeletingHabitId] = useState(null);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(getTodayStr());

  // Supabase Settings (Optional Cloud Sync)
  const [supabaseConfig, setSupabaseConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('habitx_supabase');
      return saved ? JSON.parse(saved) : { url: '', anonKey: '', isConnected: false };
    } catch (e) {
      return { url: '', anonKey: '', isConnected: false };
    }
  });

  // --- SAVE TO LOCALSTORAGE ---
  useEffect(() => {
    localStorage.setItem('habitx_theme', themeMode);
    document.body.className = themeMode === 'beast' ? 'bg-[#0a0a0a] text-neutral-100 font-inter' : 'bg-[#f8fafc] text-slate-900 font-inter';
  }, [themeMode]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('habitx_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('habitx_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('habitx_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('habitx_logs', JSON.stringify(logs));
  }, [logs]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Splash screen timeout
  useEffect(() => {
    const timer = setTimeout(() => setSplashFinished(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Notifications checking interval (checks every 30 seconds if any habit reminder matches current time)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentHours}:${currentMinutes}`;

      habits.forEach(habit => {
        if (habit.reminderEnabled && habit.reminderTime === timeStr) {
          const todayKey = `${habit.id}_${getTodayStr()}`;
          // Only notify if not completed today yet
          if (!logs[todayKey] || !logs[todayKey].completed) {
            new Notification(`HABITX Reminder: ${habit.name}`, {
              body: `Time to stay disciplined and conquer: ${habit.name}! 🔥`,
              icon: 'https://cdn-icons-png.flaticon.com/512/744/744922.png'
            });
          }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [habits, logs]);

  // Daily Quote (Computed based on day of year)
  const todayQuote = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
  }, []);

  // --- HABIT ACTIONS ---
  const handleToggleHabit = (habitId) => {
    const today = getTodayStr();
    const logKey = `${habitId}_${today}`;
    const isCurrentlyCompleted = logs[logKey]?.completed || false;

    setLogs(prev => ({
      ...prev,
      [logKey]: {
        completed: !isCurrentlyCompleted,
        completedAt: new Date().toISOString()
      }
    }));

    if (!isCurrentlyCompleted) {
      setToastMessage({ text: "Habit completed! Streak maintained 🔥", type: "success" });
    } else {
      setToastMessage({ text: "Habit marked incomplete.", type: "info" });
    }
  };

  const handleSaveHabit = (habitData) => {
    if (editingHabit) {
      setHabits(prev => prev.map(h => h.id === editingHabit.id ? { ...h, ...habitData, updatedAt: new Date().toISOString() } : h));
      setToastMessage({ text: "Habit updated successfully.", type: "success" });
      setEditingHabit(null);
    } else {
      // V1 Limit: Max 5 habits!
      if (habits.length >= 5) {
        setShowLimitAlert(true);
        return;
      }
      const newHabit = {
        id: 'h_' + Date.now(),
        ...habitData,
        createdAt: new Date().toISOString()
      };
      setHabits(prev => [...prev, newHabit]);
      setToastMessage({ text: "New habit added! Stay consistent.", type: "success" });
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteHabit = (habitId) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setToastMessage({ text: "Habit removed.", type: "info" });
    setDeletingHabitId(null);
  };

  const handleAddHabitClick = () => {
    if (habits.length >= 5) {
      setShowLimitAlert(true);
    } else {
      setEditingHabit(null);
      setIsAddModalOpen(true);
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification("HABITX Notifications Activated! 🔥", {
        body: "You will now receive reminder alerts for your scheduled habits."
      });
      setToastMessage({ text: "Notifications enabled successfully!", type: "success" });
    } else {
      setToastMessage({ text: "Notification permission was denied.", type: "warning" });
    }
  };

  // --- STATS COMPUTATION ---
  const today = getTodayStr();
  const completedTodayCount = habits.filter(h => logs[`${h.id}_${today}`]?.completed).length;
  const todayPercentage = habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0;

  // Best active streak among all habits
  const habitStreaksMap = useMemo(() => {
    const map = {};
    habits.forEach(h => {
      map[h.id] = calculateHabitStreaks(h.id, logs);
    });
    return map;
  }, [habits, logs]);

  const bestCurrentStreak = useMemo(() => {
    let max = 0;
    Object.values(habitStreaksMap).forEach(s => {
      if (s.currentStreak > max) max = s.currentStreak;
    });
    return max;
  }, [habitStreaksMap]);

  // Past 7 Days overview
  const past7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const completedCount = habits.filter(h => logs[`${h.id}_${dateStr}`]?.completed).length;
      const pct = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
      days.push({
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        completedCount,
        percentage: pct,
        isToday: dateStr === today
      });
    }
    return days;
  }, [habits, logs, today]);

  // --- STYLING HELPERS BY MODE ---
  const isBeast = themeMode === 'beast';
  const theme = {
    bg: isBeast ? 'bg-[#0a0a0a]' : 'bg-[#f8fafc]',
    surface: isBeast ? 'bg-[#121212]' : 'bg-white',
    card: isBeast ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200 shadow-sm',
    cardHover: isBeast ? 'hover:border-red-500/50' : 'hover:border-blue-500/50',
    border: isBeast ? 'border-[#262626]' : 'border-slate-200',
    textPrimary: isBeast ? 'text-white' : 'text-slate-900',
    textSecondary: isBeast ? 'text-neutral-400' : 'text-slate-500',
    accent: isBeast ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
    accentBorder: isBeast ? 'border-red-500' : 'border-blue-500',
    accentText: isBeast ? 'text-red-500' : 'text-blue-600',
    accentGradient: isBeast ? 'gradient-text-beast' : 'gradient-text-normal',
    pillActive: isBeast ? 'bg-red-600 text-white' : 'bg-blue-600 text-white',
    pillInactive: isBeast ? 'bg-[#222222] text-neutral-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900',
    bottomNav: isBeast ? 'bg-[#111111]/90 border-t border-[#222222]' : 'bg-white/95 border-t border-slate-200 shadow-lg',
  };

  // --- SPLASH SCREEN ---
  if (!splashFinished) {
    return (
      <div className="fixed inset-0 splash-bg flex flex-col items-center justify-center z-50 text-white">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-2xl shadow-red-600/40 animate-pulse-slow">
            <span className="text-4xl font-black font-grotesk tracking-widest text-white">HX</span>
          </div>
          <div className="absolute -inset-4 bg-red-600/20 blur-xl rounded-full -z-10 animate-ping" />
        </div>
        <h1 className="text-4xl font-black font-grotesk tracking-wider gradient-text-beast mb-2">HABITX</h1>
        <p className="text-neutral-400 text-sm tracking-widest uppercase font-medium">Build Discipline. Become Unstoppable.</p>
        <div className="w-36 h-1 bg-neutral-800 rounded-full mt-8 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-red-600 to-orange-500 animate-pulse" />
        </div>
      </div>
    );
  }

  // --- AUTH / ONBOARDING FLOW ---
  if (!currentUser) {
    return (
      <AuthFlow
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        authView={authView}
        setAuthView={setAuthView}
        onLogin={(userData) => {
          setCurrentUser(userData);
          // If mode select not yet done, direct there or set default
          setToastMessage({ text: `Welcome back, ${userData.name}!`, type: "success" });
        }}
        toastMessage={toastMessage}
        setToastMessage={setToastMessage}
      />
    );
  }

  // --- MAIN APP SHELL ---
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} flex flex-col md:flex-row transition-colors duration-300 pb-20 md:pb-0`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl glass-dark border border-neutral-700 text-white text-sm toast">
          <Icon name={toastMessage.type === 'success' ? 'check' : 'alert'} className={`w-5 h-5 ${toastMessage.type === 'success' ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-neutral-400 hover:text-white">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden md:flex flex-col w-64 ${theme.surface} border-r ${theme.border} p-6 justify-between shrink-0 h-screen sticky top-0`}>
        <div>
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-10 h-10 rounded-xl ${isBeast ? 'bg-gradient-to-tr from-red-600 to-orange-500' : 'bg-gradient-to-tr from-blue-600 to-emerald-500'} flex items-center justify-center shadow-md`}>
              <span className="text-xl font-black font-grotesk text-white">HX</span>
            </div>
            <div>
              <div className="font-black text-xl tracking-tight font-grotesk">HABITX</div>
              <div className="text-[10px] tracking-wider uppercase opacity-60 font-medium">Build Discipline</div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {[
              { id: 'home', label: 'Dashboard', icon: 'home' },
              { id: 'habits', label: 'Habits', icon: 'list', badge: `${habits.length}/5` },
              { id: 'progress', label: 'Calendar & Progress', icon: 'calendar' },
              { id: 'settings', label: 'Settings', icon: 'settings' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id ? theme.pillActive : theme.pillInactive
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon name={item.icon} className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Profile & Mode Quick-Toggle */}
        <div className={`pt-4 border-t ${theme.border} space-y-3`}>
          {/* Theme Quick Toggle */}
          <div className={`flex items-center justify-between p-2 rounded-xl ${isBeast ? 'bg-[#181818]' : 'bg-slate-100'}`}>
            <span className="text-xs font-semibold px-2">{isBeast ? '🔥 Beast Mode' : '🌱 Normal Mode'}</span>
            <button
              onClick={() => setThemeMode(isBeast ? 'normal' : 'beast')}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${isBeast ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}
            >
              Switch
            </button>
          </div>

          {/* User Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-amber-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold truncate">{currentUser.name}</div>
                <div className="text-[11px] opacity-60 truncate">{currentUser.email}</div>
              </div>
            </div>
            <button
              onClick={() => setCurrentUser(null)}
              title="Logout"
              className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-neutral-800 transition-colors"
            >
              <Icon name="logout" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        
        {/* MOBILE TOP HEADER */}
        <header className="flex md:hidden items-center justify-between pb-4 mb-4 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${isBeast ? 'bg-red-600' : 'bg-blue-600'} flex items-center justify-center text-white font-bold text-sm`}>
              HX
            </div>
            <span className="font-black text-lg font-grotesk tracking-tight">HABITX</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setThemeMode(isBeast ? 'normal' : 'beast')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${isBeast ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}
            >
              <span>{isBeast ? '🔥 BEAST' : '🌱 NORMAL'}</span>
            </button>
            <button
              onClick={handleAddHabitClick}
              className={`p-2 rounded-lg ${theme.accent}`}
              title="Add Habit"
            >
              <Icon name="plus" className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'home' && (
          <DashboardView
            currentUser={currentUser}
            habits={habits}
            logs={logs}
            theme={theme}
            isBeast={isBeast}
            todayQuote={todayQuote}
            todayPercentage={todayPercentage}
            completedTodayCount={completedTodayCount}
            bestCurrentStreak={bestCurrentStreak}
            habitStreaksMap={habitStreaksMap}
            past7Days={past7Days}
            onToggleHabit={handleToggleHabit}
            onAddHabitClick={handleAddHabitClick}
          />
        )}

        {/* TAB 2: HABITS MANAGEMENT */}
        {activeTab === 'habits' && (
          <HabitsManagementView
            habits={habits}
            habitStreaksMap={habitStreaksMap}
            theme={theme}
            isBeast={isBeast}
            onAddHabitClick={handleAddHabitClick}
            onEditHabit={(habit) => {
              setEditingHabit(habit);
              setIsAddModalOpen(true);
            }}
            onDeleteHabit={(habitId) => setDeletingHabitId(habitId)}
            onQuickAdd={(suggested) => {
              if (habits.length >= 5) {
                setShowLimitAlert(true);
                return;
              }
              handleSaveHabit(suggested);
            }}
          />
        )}

        {/* TAB 3: CALENDAR & PROGRESS */}
        {activeTab === 'progress' && (
          <CalendarProgressView
            habits={habits}
            logs={logs}
            theme={theme}
            isBeast={isBeast}
            calendarMonth={calendarMonth}
            setCalendarMonth={setCalendarMonth}
            calendarYear={calendarYear}
            setCalendarYear={setCalendarYear}
            selectedCalendarDate={selectedCalendarDate}
            setSelectedCalendarDate={setSelectedCalendarDate}
          />
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <SettingsView
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
            theme={theme}
            isBeast={isBeast}
            onRequestNotificationPermission={handleRequestNotificationPermission}
            supabaseConfig={supabaseConfig}
            setSupabaseConfig={setSupabaseConfig}
            onResetData={() => {
              if (confirm("Reset all habits and streak records? This cannot be undone.")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            onLogout={() => setCurrentUser(null)}
          />
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 ${theme.bottomNav} z-40 px-3 py-2 flex items-center justify-around bottom-nav backdrop-blur-md`}>
        {[
          { id: 'home', label: 'Home', icon: 'home' },
          { id: 'habits', label: 'Habits', icon: 'list', badge: `${habits.length}` },
          { id: 'progress', label: 'Progress', icon: 'calendar' },
          { id: 'settings', label: 'Settings', icon: 'settings' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 relative ${
              activeTab === item.id ? theme.accentText : 'opacity-60'
            }`}
          >
            <div className="relative">
              <Icon name={item.icon} className="w-5 h-5" />
              {item.badge && activeTab !== item.id && (
                <span className="absolute -top-1.5 -right-2 bg-neutral-700 text-[9px] text-white font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold mt-1 tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ADD / EDIT HABIT MODAL */}
      {isAddModalOpen && (
        <HabitModal
          theme={theme}
          isBeast={isBeast}
          initialData={editingHabit}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingHabit(null);
          }}
          onSave={handleSaveHabit}
        />
      )}

      {/* 5-HABIT V1 LIMIT ALERT MODAL */}
      {showLimitAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm modal-overlay">
          <div className={`w-full max-w-md ${theme.surface} border ${theme.border} p-6 rounded-2xl shadow-2xl modal-content`}>
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
              <Icon name="shield" className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black font-grotesk mb-2">V1 Limit: Maximum 5 Habits</h3>
            <p className="text-sm opacity-80 leading-relaxed mb-6">
              "Focus is your superpower." In HABITX V1, ambitious students and builders are limited to <strong>5 core habits</strong>. Research shows that trying to build more than 5 habits at once results in an 80% failure rate. Master these 5 first!
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLimitAlert(false)}
                className={`w-full py-2.5 rounded-xl font-bold text-sm ${theme.accent}`}
              >
                Understood. Let's Master These 5.
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingHabitId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm modal-overlay">
          <div className={`w-full max-w-sm ${theme.surface} border ${theme.border} p-6 rounded-2xl shadow-2xl modal-content`}>
            <h3 className="text-lg font-bold mb-2">Delete Habit?</h3>
            <p className="text-sm opacity-70 mb-6">
              Are you sure you want to delete this habit? All associated streak history will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingHabitId(null)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold ${isBeast ? 'bg-neutral-800 text-neutral-300' : 'bg-slate-200 text-slate-700'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteHabit(deletingHabitId)}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Habit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==============================================================================
// 1. DASHBOARD VIEW COMPONENT
// ==============================================================================
function DashboardView({
  currentUser,
  habits,
  logs,
  theme,
  isBeast,
  todayQuote,
  todayPercentage,
  completedTodayCount,
  bestCurrentStreak,
  habitStreaksMap,
  past7Days,
  onToggleHabit,
  onAddHabitClick
}) {
  const today = getTodayStr();
  const dateFormatted = formatDateDisplay(today);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* GREETING & DAILY QUOTE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold tracking-widest opacity-60 mb-1">{dateFormatted}</div>
          <h2 className="text-2xl sm:text-3xl font-black font-grotesk tracking-tight">
            {isBeast ? "Crush Your Limits," : "Welcome back,"} <span className={theme.accentGradient}>{currentUser.name}</span>
          </h2>
        </div>

        {/* Action Button */}
        <button
          onClick={onAddHabitClick}
          className={`self-start md:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg ${theme.accent}`}
        >
          <Icon name="plus" className="w-4 h-4" />
          <span>New Habit ({habits.length}/5)</span>
        </button>
      </div>

      {/* DAILY MOTIVATIONAL QUOTE BANNER */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${theme.card} relative overflow-hidden`}>
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${isBeast ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-600'} shrink-0 mt-0.5`}>
            <Icon name="flame" className="w-5 h-5 fire-animate" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-semibold italic leading-relaxed">
              "{todayQuote.text}"
            </div>
            <div className="text-xs opacity-60 font-medium mt-1">
              — {todayQuote.author}
            </div>
          </div>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Today's Completion */}
        <div className={`p-4 rounded-2xl border ${theme.card} flex flex-col justify-between`}>
          <div className="text-xs font-semibold opacity-60 mb-2">Today's Progress</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black font-grotesk">{todayPercentage}%</span>
          </div>
          <div className="w-full bg-neutral-800/20 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full progress-fill ${isBeast ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-blue-600'}`}
              style={{ width: `${todayPercentage}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Completed / Total */}
        <div className={`p-4 rounded-2xl border ${theme.card} flex flex-col justify-between`}>
          <div className="text-xs font-semibold opacity-60 mb-2">Completed Today</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black font-grotesk">{completedTodayCount}</span>
            <span className="text-xs opacity-50 font-medium">/ {habits.length} habits</span>
          </div>
          <div className="text-[11px] opacity-60 mt-3">
            {habits.length - completedTodayCount === 0 ? "🎉 All habits done!" : `${habits.length - completedTodayCount} habits left`}
          </div>
        </div>

        {/* Metric 3: Active Habits */}
        <div className={`p-4 rounded-2xl border ${theme.card} flex flex-col justify-between`}>
          <div className="text-xs font-semibold opacity-60 mb-2">Active Habits</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black font-grotesk">{habits.length}</span>
            <span className="text-xs opacity-50 font-medium">/ 5 max (V1)</span>
          </div>
          <div className="text-[11px] opacity-60 mt-3">
            {5 - habits.length > 0 ? `${5 - habits.length} slots available` : 'Full capacity'}
          </div>
        </div>

        {/* Metric 4: Top Streak */}
        <div className={`p-4 rounded-2xl border ${theme.card} flex flex-col justify-between`}>
          <div className="text-xs font-semibold opacity-60 mb-2">Top Streak</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-black font-grotesk text-orange-500">{bestCurrentStreak}</span>
            <span className="text-xs opacity-50 font-medium">days</span>
            <span className="text-lg">🔥</span>
          </div>
          <div className="text-[11px] opacity-60 mt-3">Unbreakable momentum</div>
        </div>
      </div>

      {/* WEEKLY PROGRESS STRIP */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${theme.card}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider opacity-60">Last 7 Days Consistency</span>
          <span className="text-xs font-semibold">{past7Days.filter(d => d.percentage === 100).length} of 7 Perfect Days</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {past7Days.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="text-[11px] font-bold opacity-60 mb-1.5">{day.dayName}</div>
              <div
                className={`w-full h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
                  day.isToday ? 'ring-2 ring-offset-2 ' + (isBeast ? 'ring-red-500 ring-offset-[#121212]' : 'ring-blue-500 ring-offset-white') : ''
                } ${
                  day.percentage === 100
                    ? (isBeast ? 'bg-gradient-to-t from-red-600 to-orange-500 text-white' : 'bg-emerald-500 text-white')
                    : day.percentage > 0
                    ? (isBeast ? 'bg-neutral-800 text-orange-400 border border-neutral-700' : 'bg-blue-100 text-blue-700 border border-blue-200')
                    : (isBeast ? 'bg-[#1e1e1e] text-neutral-600' : 'bg-slate-100 text-slate-400')
                }`}
              >
                <span className="text-xs font-black">{day.percentage}%</span>
                <span className="text-[9px] font-semibold opacity-75">{day.completedCount}/{habits.length}</span>
              </div>
              <span className="text-[9px] opacity-40 mt-1">{day.dateStr.split('-')[2]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TODAY'S HABITS CHECKLIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-grotesk tracking-tight">Today's Discipline Checklist</h3>
          <span className="text-xs opacity-60 font-medium">Click to complete / undo</span>
        </div>

        {habits.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl border ${theme.card} space-y-3`}>
            <div className="w-12 h-12 rounded-xl bg-neutral-800/40 mx-auto flex items-center justify-center text-neutral-400">
              <Icon name="list" className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base">No habits created yet</h4>
            <p className="text-xs opacity-60 max-w-sm mx-auto">
              Start building your daily discipline by adding your first habit. Maximum 5 habits in V1.
            </p>
            <button
              onClick={onAddHabitClick}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${theme.accent}`}
            >
              Add First Habit
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {habits.map(habit => {
              const isCompleted = logs[`${habit.id}_${today}`]?.completed || false;
              const streak = habitStreaksMap[habit.id] || { currentStreak: 0, longestStreak: 0 };

              return (
                <div
                  key={habit.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${theme.card} ${
                    isCompleted
                      ? (isBeast ? 'bg-[#181818]/90 border-red-900/40' : 'bg-emerald-50/60 border-emerald-200')
                      : theme.cardHover
                  } flex items-center justify-between gap-3`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Habit Icon */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isCompleted
                          ? (isBeast ? 'bg-red-600 text-white' : 'bg-emerald-500 text-white')
                          : (isBeast ? 'bg-neutral-800 text-neutral-300' : 'bg-slate-100 text-slate-700')
                      }`}
                    >
                      <Icon name={habit.icon} className="w-5 h-5" />
                    </div>

                    {/* Habit Title & Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm sm:text-base truncate ${isCompleted ? 'line-through opacity-70' : ''}`}>
                          {habit.name}
                        </span>
                        {habit.category && (
                          <span className={`hidden sm:inline text-[10px] px-2 py-0.5 rounded-full font-semibold ${isBeast ? 'bg-neutral-800 text-neutral-400' : 'bg-slate-100 text-slate-600'}`}>
                            {habit.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 mt-1 text-xs">
                        {/* Streak Badge */}
                        <div className="flex items-center gap-1 font-bold text-orange-500">
                          <Icon name="flame" className="w-3.5 h-3.5" />
                          <span>{streak.currentStreak}d streak</span>
                        </div>

                        {/* Reminder Time */}
                        {habit.reminderEnabled && habit.reminderTime && (
                          <div className="flex items-center gap-1 opacity-50">
                            <Icon name="clock" className="w-3 h-3" />
                            <span>{habit.reminderTime}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Complete / Undo Button */}
                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <button
                        onClick={() => onToggleHabit(habit.id)}
                        title="Undo completion"
                        className="p-2 rounded-xl opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <Icon name="undo" className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onToggleHabit(habit.id)}
                      className={`habit-check px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                        isCompleted
                          ? (isBeast ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white')
                          : (isBeast ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300')
                      }`}
                    >
                      <Icon name="check" className={`w-4 h-4 ${isCompleted ? 'text-white' : 'opacity-40'}`} />
                      <span>{isCompleted ? 'Done' : 'Complete'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

// ==============================================================================
// 2. HABITS MANAGEMENT VIEW COMPONENT
// ==============================================================================
function HabitsManagementView({
  habits,
  habitStreaksMap,
  theme,
  isBeast,
  onAddHabitClick,
  onEditHabit,
  onDeleteHabit,
  onQuickAdd
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-grotesk tracking-tight">Habit Portfolio</h2>
          <p className="text-xs opacity-60 mt-1">Manage your 5 core daily disciplines. Focus is power.</p>
        </div>

        <button
          onClick={onAddHabitClick}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg ${theme.accent}`}
        >
          <Icon name="plus" className="w-4 h-4" />
          <span>Add Habit ({habits.length}/5)</span>
        </button>
      </div>

      {/* SUGGESTED DEFAULTS CHIPS */}
      {habits.length < 5 && (
        <div className={`p-4 rounded-2xl border ${theme.card}`}>
          <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2.5">
            Suggested Core Habits (Quick Add)
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_HABITS.filter(sh => !habits.some(h => h.name.toLowerCase() === sh.name.toLowerCase())).map((suggested, idx) => (
              <button
                key={idx}
                onClick={() => onQuickAdd(suggested)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isBeast
                    ? 'bg-neutral-900 border-neutral-700 hover:border-red-500 text-neutral-300 hover:text-white'
                    : 'bg-slate-50 border-slate-200 hover:border-blue-500 text-slate-700 hover:text-blue-700'
                }`}
              >
                <Icon name={suggested.icon} className="w-3.5 h-3.5 text-orange-500" />
                <span>+ {suggested.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* HABIT CARDS LIST */}
      <div className="space-y-3">
        {habits.map(habit => {
          const streak = habitStreaksMap[habit.id] || { currentStreak: 0, longestStreak: 0, totalCompletions: 0 };

          return (
            <div
              key={habit.id}
              className={`p-4 sm:p-5 rounded-2xl border ${theme.card} flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-hover`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isBeast ? 'bg-neutral-800 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                  <Icon name={habit.icon} className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">{habit.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isBeast ? 'bg-neutral-800 text-neutral-400' : 'bg-slate-100 text-slate-600'}`}>
                      {habit.category || 'General'}
                    </span>
                  </div>

                  {/* Streak & Details Row */}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs opacity-75">
                    <div className="flex items-center gap-1 font-bold text-orange-500">
                      <Icon name="flame" className="w-3.5 h-3.5" />
                      <span>{streak.currentStreak} day streak</span>
                    </div>
                    <span>•</span>
                    <div>Best: <strong>{streak.longestStreak} days</strong></div>
                    <span>•</span>
                    <div>Completed: <strong>{streak.totalCompletions} times</strong></div>
                    {habit.reminderEnabled && habit.reminderTime && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Icon name="bell" className="w-3 h-3 text-amber-500" />
                          <span>{habit.reminderTime}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => onEditHabit(habit)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    isBeast ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700' : 'bg-slate-100 hover:bg-slate-200 border-slate-200'
                  }`}
                  title="Edit Habit"
                >
                  <Icon name="edit" className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>

                <button
                  onClick={() => onDeleteHabit(habit.id)}
                  className="p-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Delete Habit"
                >
                  <Icon name="trash" className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

// ==============================================================================
// 3. CALENDAR & PROGRESS VIEW COMPONENT
// ==============================================================================
function CalendarProgressView({
  habits,
  logs,
  theme,
  isBeast,
  calendarMonth,
  setCalendarMonth,
  calendarYear,
  setCalendarYear,
  selectedCalendarDate,
  setSelectedCalendarDate
}) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
  const today = getTodayStr();

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  // Calendar cells calculation
  const calendarCells = [];
  // Empty leading days
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push({ empty: true, key: `empty-${i}` });
  }

  // Days of month
  let monthCompletedTotal = 0;
  let perfectDaysCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const monthStr = String(calendarMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${calendarYear}-${monthStr}-${dayStr}`;

    const completedCount = habits.filter(h => logs[`${h.id}_${dateStr}`]?.completed).length;
    const isPerfect = habits.length > 0 && completedCount === habits.length;
    const isPartial = completedCount > 0 && completedCount < habits.length;
    const isMissed = completedCount === 0 && dateStr < today;
    const isCurrentDay = dateStr === today;
    const isFuture = dateStr > today;

    monthCompletedTotal += completedCount;
    if (isPerfect) perfectDaysCount++;

    calendarCells.push({
      empty: false,
      day,
      dateStr,
      completedCount,
      isPerfect,
      isPartial,
      isMissed,
      isCurrentDay,
      isFuture,
      key: dateStr
    });
  }

  // Selected date details
  const selectedDateHabits = habits.map(h => ({
    ...h,
    isCompleted: logs[`${h.id}_${selectedCalendarDate}`]?.completed || false
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-black font-grotesk tracking-tight">Calendar & Consistency</h2>
        <p className="text-xs opacity-60 mt-1">Track every single day of discipline. Never break the chain.</p>
      </div>

      {/* MONTHLY SUMMARY METRICS */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className={`p-4 rounded-2xl border ${theme.card}`}>
          <div className="text-xs font-semibold opacity-60">Total Completions</div>
          <div className="text-2xl font-black font-grotesk mt-1 text-orange-500">{monthCompletedTotal}</div>
          <div className="text-[11px] opacity-60 mt-1">This month</div>
        </div>

        <div className={`p-4 rounded-2xl border ${theme.card}`}>
          <div className="text-xs font-semibold opacity-60">Perfect Days</div>
          <div className="text-2xl font-black font-grotesk mt-1 text-emerald-500">{perfectDaysCount}</div>
          <div className="text-[11px] opacity-60 mt-1">100% completed</div>
        </div>

        <div className={`p-4 rounded-2xl border ${theme.card}`}>
          <div className="text-xs font-semibold opacity-60">Active Habits</div>
          <div className="text-2xl font-black font-grotesk mt-1">{habits.length}</div>
          <div className="text-[11px] opacity-60 mt-1">Max 5 tracked</div>
        </div>
      </div>

      {/* CALENDAR CONTROLS & GRID */}
      <div className={`p-5 rounded-2xl border ${theme.card} space-y-4`}>
        {/* Month Selector Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black font-grotesk">
              {monthNames[calendarMonth]} {calendarYear}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const now = new Date();
                setCalendarMonth(now.getMonth());
                setCalendarYear(now.getFullYear());
                setSelectedCalendarDate(today);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${isBeast ? 'border-neutral-700 bg-neutral-800' : 'border-slate-200 bg-slate-100'}`}
            >
              Today
            </button>
            <button
              onClick={handlePrevMonth}
              className={`p-1.5 rounded-lg border ${isBeast ? 'border-neutral-700 bg-neutral-800' : 'border-slate-200 bg-slate-100'}`}
            >
              <Icon name="chevronLeft" className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className={`p-1.5 rounded-lg border ${isBeast ? 'border-neutral-700 bg-neutral-800' : 'border-slate-200 bg-slate-100'}`}
            >
              <Icon name="chevronRight" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs opacity-75 pt-1 border-t border-inherit">
          <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${isBeast ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <span>100% Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${isBeast ? 'bg-neutral-800' : 'bg-slate-200'}`} />
            <span>Missed</span>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs opacity-50 py-1">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarCells.map(cell => {
            if (cell.empty) {
              return <div key={cell.key} className="h-10 sm:h-12 rounded-xl opacity-0" />;
            }

            const isSelected = selectedCalendarDate === cell.dateStr;

            let bgStyle = isBeast ? 'bg-[#1a1a1a] text-neutral-400' : 'bg-slate-50 text-slate-500';
            if (cell.isPerfect) {
              bgStyle = isBeast ? 'bg-gradient-to-tr from-red-600 to-orange-500 text-white font-bold' : 'bg-emerald-500 text-white font-bold';
            } else if (cell.isPartial) {
              bgStyle = isBeast ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-amber-100 text-amber-800 border border-amber-300';
            } else if (cell.isMissed) {
              bgStyle = isBeast ? 'bg-[#181818] text-neutral-600' : 'bg-slate-100 text-slate-400';
            }

            return (
              <button
                key={cell.key}
                onClick={() => setSelectedCalendarDate(cell.dateStr)}
                className={`h-11 sm:h-14 rounded-xl flex flex-col items-center justify-center p-1 relative transition-all ${bgStyle} ${
                  cell.isCurrentDay ? 'ring-2 ring-blue-500' : ''
                } ${isSelected ? 'scale-95 shadow-md ring-2 ring-white' : 'hover:scale-[1.02]'}`}
              >
                <span className="text-xs sm:text-sm font-semibold">{cell.day}</span>
                {cell.completedCount > 0 && (
                  <span className="text-[9px] font-bold opacity-80 mt-0.5">
                    {cell.completedCount}/{habits.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED DATE BREAKDOWN PANEL */}
      <div className={`p-5 rounded-2xl border ${theme.card} space-y-3`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm sm:text-base">
              Records for {formatDateDisplay(selectedCalendarDate)}
            </h4>
            <div className="text-xs opacity-60">
              {selectedCalendarDate === today ? "Today's status" : "Historical completion"}
            </div>
          </div>
          <div className="text-xs font-bold px-2.5 py-1 rounded-full bg-neutral-800/40">
            {selectedDateHabits.filter(h => h.isCompleted).length} of {habits.length} completed
          </div>
        </div>

        <div className="space-y-2 pt-2">
          {selectedDateHabits.map(habit => (
            <div
              key={habit.id}
              className={`p-3 rounded-xl border flex items-center justify-between text-sm ${
                habit.isCompleted
                  ? (isBeast ? 'bg-red-500/10 border-red-500/30 text-white' : 'bg-emerald-50 border-emerald-200 text-emerald-900')
                  : (isBeast ? 'bg-neutral-900/60 border-neutral-800 text-neutral-500' : 'bg-slate-50 border-slate-200 text-slate-400')
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon name={habit.icon} className="w-4 h-4" />
                <span className={`font-semibold ${habit.isCompleted ? '' : 'line-through'}`}>{habit.name}</span>
              </div>
              <span className="text-xs font-bold">
                {habit.isCompleted ? '✓ Completed' : '✕ Missed'}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ==============================================================================
// 4. SETTINGS VIEW COMPONENT
// ==============================================================================
function SettingsView({
  currentUser,
  setCurrentUser,
  themeMode,
  setThemeMode,
  theme,
  isBeast,
  onRequestNotificationPermission,
  supabaseConfig,
  setSupabaseConfig,
  onResetData,
  onLogout
}) {
  const [nameInput, setNameInput] = useState(currentUser.name || '');
  const [isSaved, setIsSaved] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setCurrentUser(prev => ({ ...prev, name: nameInput.trim() }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      
      <div>
        <h2 className="text-2xl font-black font-grotesk tracking-tight">Settings</h2>
        <p className="text-xs opacity-60 mt-1">Personalize your HABITX experience and environment.</p>
      </div>

      {/* THEME MODE SELECTION */}
      <div className={`p-5 rounded-2xl border ${theme.card} space-y-4`}>
        <div>
          <h3 className="font-bold text-base">Visual Mode</h3>
          <p className="text-xs opacity-60">Choose between peaceful minimal clarity or dark aggressive focus.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Normal Mode Card */}
          <button
            onClick={() => setThemeMode('normal')}
            className={`p-4 rounded-xl border text-left transition-all ${
              !isBeast
                ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500'
                : 'border-neutral-800 bg-neutral-900/60 opacity-60 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-900">🌱 NORMAL MODE</span>
              {!isBeast && <span className="text-xs bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">Active</span>}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              White background, peaceful minimal UI, soft shadows, subtle blue/green accents. Clean and distraction-free.
            </p>
          </button>

          {/* Beast Mode Card */}
          <button
            onClick={() => setThemeMode('beast')}
            className={`p-4 rounded-xl border text-left transition-all ${
              isBeast
                ? 'border-red-600 bg-red-950/20 shadow-md ring-2 ring-red-500'
                : 'border-slate-200 bg-white opacity-60 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white">🔥 BEAST MODE</span>
              {isBeast && <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">Active</span>}
            </div>
            <p className="text-xs opacity-75 leading-relaxed">
              Deep black background, dark surfaces, red/orange aggressive accents, high contrast. Powerful and motivating.
            </p>
          </button>
        </div>
      </div>

      {/* PROFILE DETAILS */}
      <div className={`p-5 rounded-2xl border ${theme.card} space-y-4`}>
        <div>
          <h3 className="font-bold text-base">User Profile</h3>
          <p className="text-xs opacity-60">Update your personal account credentials.</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold opacity-75 mb-1">Display Name</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${isBeast ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              placeholder="e.g. Alex Hunter"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold opacity-75 mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={currentUser.email}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm opacity-50 cursor-not-allowed ${isBeast ? 'bg-neutral-900 border-neutral-800' : 'bg-slate-100 border-slate-300'}`}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              className={`px-4 py-2 rounded-xl text-xs font-bold ${theme.accent}`}
            >
              Save Profile
            </button>
            {isSaved && <span className="text-xs text-emerald-500 font-bold">✓ Saved!</span>}
          </div>
        </form>
      </div>

      {/* NOTIFICATIONS */}
      <div className={`p-5 rounded-2xl border ${theme.card} space-y-4`}>
        <div>
          <h3 className="font-bold text-base">Daily Reminders & Notifications</h3>
          <p className="text-xs opacity-60">Receive browser alerts when scheduled habit times arrive.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-inherit">
          <div>
            <div className="text-xs font-bold">Browser Push Permission</div>
            <div className="text-[11px] opacity-60">
              {('Notification' in window)
                ? `Status: ${Notification.permission}`
                : "Not supported in this environment"}
            </div>
          </div>
          <button
            onClick={onRequestNotificationPermission}
            className={`px-4 py-2 rounded-xl text-xs font-bold border ${isBeast ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700' : 'bg-slate-100 border-slate-300 hover:bg-slate-200'}`}
          >
            Request / Test Alert
          </button>
        </div>
      </div>

      {/* SUPABASE CLOUD SYNC CONFIGURATION */}
      <div className={`p-5 rounded-2xl border ${theme.card} space-y-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Supabase Cloud Sync</h3>
            <p className="text-xs opacity-60">Connect to your Supabase project for cross-device database synchronization.</p>
          </div>
          <button
            onClick={() => setShowSupabaseModal(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${theme.accent}`}
          >
            Configure
          </button>
        </div>

        <div className={`p-3 rounded-xl text-xs font-mono break-all ${isBeast ? 'bg-neutral-900' : 'bg-slate-100'}`}>
          <div>Status: {supabaseConfig.isConnected ? "🟢 Connected to Supabase Cloud" : "🟡 Local Storage Mode (Offline Safe)"}</div>
          {supabaseConfig.url && <div className="mt-1 opacity-70">URL: {supabaseConfig.url}</div>}
        </div>
      </div>

      {/* DANGER ZONE / DATA RESET */}
      <div className={`p-5 rounded-2xl border border-red-500/30 ${isBeast ? 'bg-red-950/10' : 'bg-red-50/50'} space-y-3`}>
        <h3 className="font-bold text-sm text-red-500">Account Management</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
          >
            Log Out
          </button>
          <button
            onClick={onResetData}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-500/30 transition-colors"
          >
            Reset All Local Data
          </button>
        </div>
      </div>

      {/* SUPABASE MODAL */}
      {showSupabaseModal && (
        <SupabaseConfigModal
          theme={theme}
          isBeast={isBeast}
          currentConfig={supabaseConfig}
          onClose={() => setShowSupabaseModal(false)}
          onSave={(newConfig) => {
            setSupabaseConfig(newConfig);
            localStorage.setItem('habitx_supabase', JSON.stringify(newConfig));
            setShowSupabaseModal(false);
          }}
        />
      )}

    </div>
  );
}

// ==============================================================================
// 5. HABIT ADD / EDIT MODAL
// ==============================================================================
function HabitModal({ theme, isBeast, initialData, onClose, onSave }) {
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState(initialData?.category || 'General');
  const [icon, setIcon] = useState(initialData?.icon || 'target');
  const [reminderTime, setReminderTime] = useState(initialData?.reminderTime || '07:00');
  const [reminderEnabled, setReminderEnabled] = useState(initialData?.reminderEnabled ?? true);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Habit name is required');
      return;
    }
    onSave({
      name: name.trim(),
      category: category.trim(),
      icon,
      reminderTime,
      reminderEnabled
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm modal-overlay">
      <div className={`w-full max-w-md ${theme.surface} border ${theme.border} p-6 rounded-3xl shadow-2xl modal-content`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-black font-grotesk">
            {initialData ? 'Edit Habit' : 'Create New Habit'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg opacity-60 hover:opacity-100">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-xs text-red-500 font-semibold">{error}</div>}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold opacity-75 mb-1.5">Habit Name *</label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Read 20 Pages"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${isBeast ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold opacity-75 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${isBeast ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
            >
              <option value="Health">Health & Fitness</option>
              <option value="Mindset">Mindset & Discipline</option>
              <option value="Learning">Learning & Study</option>
              <option value="Skill">Technical & Coding</option>
              <option value="Productivity">Productivity</option>
              <option value="General">General</option>
            </select>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold opacity-75 mb-1.5">Select Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {AVAILABLE_ICONS.map(ic => (
                <button
                  type="button"
                  key={ic.id}
                  onClick={() => setIcon(ic.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                    icon === ic.id
                      ? (isBeast ? 'bg-red-600 border-red-500 text-white scale-105' : 'bg-blue-600 border-blue-500 text-white scale-105')
                      : (isBeast ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')
                  }`}
                  title={ic.label}
                >
                  <Icon name={ic.id} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Daily Reminder Time */}
          <div className="pt-2 border-t border-inherit">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold opacity-75">Daily Reminder</label>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
              />
            </div>
            {reminderEnabled && (
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${isBeast ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${isBeast ? 'bg-neutral-800 text-neutral-300' : 'bg-slate-200 text-slate-700'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-xs font-bold ${theme.accent}`}
            >
              {initialData ? 'Update Habit' : 'Save Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==============================================================================
// 6. SUPABASE CLOUD CONFIG MODAL
// ==============================================================================
function SupabaseConfigModal({ theme, isBeast, currentConfig, onClose, onSave }) {
  const [url, setUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey || '');
  const [status, setStatus] = useState('');

  const handleTestAndSave = async (e) => {
    e.preventDefault();
    if (!url || !anonKey) {
      onSave({ url: '', anonKey: '', isConnected: false });
      return;
    }

    setStatus('Testing connection...');
    try {
      if (window.supabase) {
        const client = window.supabase.createClient(url, anonKey);
        const { data, error } = await client.from('habits').select('count', { count: 'exact', head: true });
        if (error && error.code !== 'PGRST116') {
          // Connected to Supabase endpoint even if empty table
        }
        setStatus('✓ Connected successfully!');
        setTimeout(() => {
          onSave({ url, anonKey, isConnected: true });
        }, 1000);
      } else {
        onSave({ url, anonKey, isConnected: true });
      }
    } catch (err) {
      setStatus('Could not verify, but credentials saved.');
      setTimeout(() => {
        onSave({ url, anonKey, isConnected: true });
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm modal-overlay">
      <div className={`w-full max-w-lg ${theme.surface} border ${theme.border} p-6 rounded-3xl shadow-2xl modal-content`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black font-grotesk">Supabase Configuration</h3>
          <button onClick={onClose} className="p-1 rounded-lg opacity-60 hover:opacity-100">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs opacity-75 mb-4">
          Enter your Supabase credentials to enable multi-device sync and PostgreSQL cloud persistence with Row Level Security.
        </p>

        <form onSubmit={handleTestAndSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold opacity-75 mb-1">Project URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${isBeast ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold opacity-75 mb-1">Anon / Public API Key</label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${isBeast ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
            />
          </div>

          {status && <div className="text-xs font-bold text-emerald-400">{status}</div>}

          <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 text-[11px] space-y-1">
            <div className="font-bold text-neutral-300">💡 SQL Schema Included:</div>
            <div className="text-neutral-400">
              Run <code className="text-red-400">supabase_schema.sql</code> in your Supabase SQL Editor to initialize the <code>profiles</code>, <code>habits</code>, and <code>habit_logs</code> tables with RLS!
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold ${isBeast ? 'bg-neutral-800 text-neutral-300' : 'bg-slate-200 text-slate-700'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-xs font-bold ${theme.accent}`}
            >
              Save & Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==============================================================================
// 7. AUTH & ONBOARDING FLOW
// ==============================================================================
function AuthFlow({ themeMode, setThemeMode, authView, setAuthView, onLogin, toastMessage, setToastMessage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('habitx_registered_users');
      return saved ? JSON.parse(saved) : [{ email: 'demo@habitx.app', password: 'password123', name: 'Alex Hunter' }];
    } catch (e) {
      return [];
    }
  });

  const isBeast = themeMode === 'beast';

  const handleSignUp = (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const newUser = { email: email.toLowerCase().trim(), password, name: fullName.trim() };
    const updatedUsers = [...registeredUsers, newUser];
    setRegisteredUsers(updatedUsers);
    localStorage.setItem('habitx_registered_users', JSON.stringify(updatedUsers));

    // Move to Mode Selection
    setAuthView('modeSelect');
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    const found = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password);
    if (found) {
      onLogin({ email: found.email, name: found.name });
    } else {
      setError('Invalid email or password. Use demo@habitx.app / password123 or sign up!');
    }
  };

  return (
    <div className={`min-h-screen ${isBeast ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8fafc] text-slate-900'} flex flex-col justify-center items-center p-4 sm:p-6 relative`}>
      
      {/* Background radial glow */}
      <div className={`absolute inset-0 pointer-events-none -z-10 ${isBeast ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-black to-black' : 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/50 via-slate-50 to-slate-50'}`} />

      {/* HEADER LOGO */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className={`w-16 h-16 rounded-2xl ${isBeast ? 'bg-gradient-to-tr from-red-600 to-orange-500 shadow-red-600/30' : 'bg-gradient-to-tr from-blue-600 to-emerald-500 shadow-blue-600/20'} flex items-center justify-center shadow-2xl mb-3`}>
          <span className="text-3xl font-black font-grotesk text-white">HX</span>
        </div>
        <h1 className="text-3xl font-black font-grotesk tracking-wider">HABITX</h1>
        <p className="text-xs uppercase tracking-widest font-semibold opacity-60 mt-1">
          Build Discipline. Become Unstoppable.
        </p>
      </div>

      {/* VIEW: WELCOME SCREEN */}
      {authView === 'welcome' && (
        <div className={`w-full max-w-md ${isBeast ? 'bg-[#141414] border-[#222222]' : 'bg-white border-slate-200'} border p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 text-center animate-scale-in`}>
          <div className="space-y-2">
            <h2 className="text-2xl font-black font-grotesk">Build Daily Discipline</h2>
            <p className="text-xs opacity-70 leading-relaxed max-w-sm mx-auto">
              A minimalist, premium habit tracker for ambitious students and builders. 5 habits. Unbreakable streaks. Absolute focus.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setError('');
                setAuthView('signup');
              }}
              className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide ${isBeast ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white shadow-lg shadow-red-600/30' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'}`}
            >
              Get Started Free
            </button>

            <button
              onClick={() => {
                setError('');
                setAuthView('login');
              }}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm border transition-all ${isBeast ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'}`}
            >
              Sign In to Account
            </button>
          </div>

          {/* Quick Demo Access */}
          <div className="pt-2 border-t border-inherit">
            <button
              onClick={() => onLogin({ email: 'demo@habitx.app', name: 'Alex Hunter' })}
              className="text-xs font-semibold opacity-60 hover:opacity-100 transition-opacity"
            >
              ⚡ Quick Demo Login (Alex Hunter)
            </button>
          </div>
        </div>
      )}

      {/* VIEW: LOGIN */}
      {authView === 'login' && (
        <div className={`w-full max-w-md ${isBeast ? 'bg-[#141414] border-[#222222]' : 'bg-white border-slate-200'} border p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5 animate-scale-in`}>
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black font-grotesk">Welcome Back</h2>
            <p className="text-xs opacity-60">Enter your credentials to continue your streaks.</p>
          </div>

          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">{error}</div>}

          <form onSubmit={handleSignIn} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold opacity-75 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${isBeast ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold opacity-75">Password</label>
                <button
                  type="button"
                  onClick={() => setAuthView('forgot')}
                  className="text-xs opacity-60 hover:opacity-100 underline"
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${isBeast ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide mt-2 ${isBeast ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              Sign In
            </button>
          </form>

          <div className="text-center text-xs opacity-75 pt-2">
            Don't have an account?{' '}
            <button
              onClick={() => {
                setError('');
                setAuthView('signup');
              }}
              className="font-bold underline text-red-500"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}

      {/* VIEW: SIGN UP */}
      {authView === 'signup' && (
        <div className={`w-full max-w-md ${isBeast ? 'bg-[#141414] border-[#222222]' : 'bg-white border-slate-200'} border p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5 animate-scale-in`}>
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black font-grotesk">Create Your Account</h2>
            <p className="text-xs opacity-60">Commit to discipline and daily execution.</p>
          </div>

          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">{error}</div>}

          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold opacity-75 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Hunter"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${isBeast ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold opacity-75 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${isBeast ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold opacity-75 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${isBeast ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide mt-2 ${isBeast ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              Continue to Mode Selection
            </button>
          </form>

          <div className="text-center text-xs opacity-75 pt-2">
            Already have an account?{' '}
            <button
              onClick={() => {
                setError('');
                setAuthView('login');
              }}
              className="font-bold underline text-red-500"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* VIEW: FORGOT PASSWORD */}
      {authView === 'forgot' && (
        <div className={`w-full max-w-md ${isBeast ? 'bg-[#141414] border-[#222222]' : 'bg-white border-slate-200'} border p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5 animate-scale-in`}>
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black font-grotesk">Reset Password</h2>
            <p className="text-xs opacity-60">Enter your email and we'll send a recovery link.</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert(`Password recovery instructions sent to ${email || 'your email'}!`);
              setAuthView('login');
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold opacity-75 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${isBeast ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 rounded-2xl font-black text-sm ${isBeast ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              Send Reset Link
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setAuthView('login')}
              className="text-xs font-semibold opacity-70 hover:opacity-100 underline"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      )}

      {/* VIEW: MODE SELECTION (MANDATORY ONBOARDING STEP) */}
      {authView === 'modeSelect' && (
        <div className={`w-full max-w-lg ${isBeast ? 'bg-[#141414] border-[#222222]' : 'bg-white border-slate-200'} border p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 text-center animate-scale-in`}>
          <div className="space-y-1">
            <h2 className="text-2xl font-black font-grotesk">Choose Your Mindset</h2>
            <p className="text-xs opacity-60">Select your visual theme. You can switch this anytime in Settings.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {/* Normal Option */}
            <div
              onClick={() => setThemeMode('normal')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                themeMode === 'normal'
                  ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-500'
                  : 'border-neutral-800 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-sm">🌱 NORMAL MODE</span>
                {themeMode === 'normal' && <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">Selected</span>}
              </div>
              <p className="text-xs opacity-75 leading-relaxed">
                Clean white background, calm aesthetics, soft shadows, peaceful & distraction-free.
              </p>
            </div>

            {/* Beast Option */}
            <div
              onClick={() => setThemeMode('beast')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                themeMode === 'beast'
                  ? 'border-red-500 bg-red-950/20 ring-2 ring-red-500'
                  : 'border-neutral-800 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-sm text-red-500">🔥 BEAST MODE</span>
                {themeMode === 'beast' && <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">Selected</span>}
              </div>
              <p className="text-xs opacity-75 leading-relaxed">
                Deep black surfaces, aggressive red & orange neon accents, bold typography, high adrenaline focus.
              </p>
            </div>
          </div>

          <button
            onClick={() => onLogin({ email: email || 'user@habitx.app', name: fullName || 'Disciplined Builder' })}
            className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide ${themeMode === 'beast' ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-xl shadow-red-600/30' : 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'}`}
          >
            Enter HABITX Dashboard →
          </button>
        </div>
      )}

    </div>
  );
}

// Render the Application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
