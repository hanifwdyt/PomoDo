import { useState, useEffect, useRef } from "react";
import {
  Plus,
  LogOut,
  X,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Menu,
  Clock,
  Edit2,
  Settings,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
} from "lucide-react";
import { scopesAPI, todosAPI, authAPI } from "../../services/api";
import MusicPlayer from "../Music/MusicPlayer";

export default function TodoApp() {
  const [scopes, setScopes] = useState([]);
  const [activeScope, setActiveScope] = useState(null);
  const [todoInput, setTodoInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingTabName, setEditingTabName] = useState("");
  const [showScopeMenu, setShowScopeMenu] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingTodoText, setEditingTodoText] = useState("");

  // Pomodoro states
  const [pomodoroEnabled, setPomodoroEnabled] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [timerCollapsed, setTimerCollapsed] = useState(false);
  const timerRef = useRef(null);

  // UI states
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [undoAction, setUndoAction] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const inputRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Load user data on mount
  useEffect(() => {
    loadUserData();

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
    }

    // Load timer settings from localStorage
    const savedWorkDuration = localStorage.getItem("pomodoroWorkDuration");
    const savedBreakDuration = localStorage.getItem("pomodoroBreakDuration");
    if (savedWorkDuration) {
      setWorkDuration(parseInt(savedWorkDuration));
    }
    if (savedBreakDuration) {
      setBreakDuration(parseInt(savedBreakDuration));
    }

    // Load timer state from localStorage
    const savedTimerState = localStorage.getItem("pomodoroTimerState");
    if (savedTimerState) {
      try {
        const { time, isBreak: savedIsBreak, isRunning: savedIsRunning, enabled, lastUpdate } = JSON.parse(savedTimerState);

        // Set enabled state first
        if (enabled) {
          setPomodoroEnabled(true);
        }

        // Set break state
        setIsBreak(savedIsBreak);

        // Calculate elapsed time since last update if timer was running
        if (savedIsRunning && enabled && lastUpdate) {
          const elapsed = Math.floor((Date.now() - lastUpdate) / 1000);
          const newTime = Math.max(0, time - elapsed);

          if (newTime > 0) {
            setPomodoroTime(newTime);
            setIsRunning(true);
          } else {
            setPomodoroTime(savedIsBreak ? (parseInt(savedBreakDuration) || 5) * 60 : (parseInt(savedWorkDuration) || 25) * 60);
            setIsRunning(false);
          }
        } else {
          // Timer was paused or stopped
          setPomodoroTime(time);
          setIsRunning(false);
        }
      } catch (error) {
        console.error("Failed to load timer state:", error);
      }
    }

    // Mark as initialized after a short delay to ensure all state updates are done
    setTimeout(() => {
      isInitializedRef.current = true;
    }, 100);
  }, []);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  // Save timer state to localStorage whenever it changes (skip on initial mount)
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const timerState = {
      time: pomodoroTime,
      isBreak,
      isRunning,
      enabled: pomodoroEnabled,
      lastUpdate: Date.now()
    };
    localStorage.setItem("pomodoroTimerState", JSON.stringify(timerState));
  }, [pomodoroTime, isBreak, isRunning, pomodoroEnabled]);

  // Save timer settings to localStorage (skip on initial mount)
  useEffect(() => {
    if (!isInitializedRef.current) return;

    localStorage.setItem("pomodoroWorkDuration", workDuration.toString());
    localStorage.setItem("pomodoroBreakDuration", breakDuration.toString());
  }, [workDuration, breakDuration]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Focus input: / or Cmd+K
      if (e.key === "/" || (e.metaKey && e.key === "k")) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Clear input: Esc
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setTodoInput("");
        inputRef.current?.blur();
      }
      // Switch scopes: Cmd+1/2/3...
      if (e.metaKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (scopes[index]) {
          setActiveScope(scopes[index].id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scopes, activeScope]);

  // Undo timeout effect
  useEffect(() => {
    if (undoAction) {
      const timer = setTimeout(() => {
        setUndoAction(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [undoAction]);

  // Mobile swipe detection
  const minSwipeDistance = 50;
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    const currentIndex = scopes.findIndex((s) => s.id === activeScope);
    if (isLeftSwipe && currentIndex < scopes.length - 1) {
      setActiveScope(scopes[currentIndex + 1].id);
    }
    if (isRightSwipe && currentIndex > 0) {
      setActiveScope(scopes[currentIndex - 1].id);
    }
  };

  // Pomodoro timer effect
  useEffect(() => {
    if (isRunning && pomodoroEnabled) {
      timerRef.current = setInterval(() => {
        setPomodoroTime((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playNotificationSound();
            if (!isBreak) {
              setIsBreak(true);
              return 5 * 60;
            } else {
              setIsBreak(false);
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, pomodoroEnabled, isBreak]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log("Audio notification failed:", e);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePomodoro = () => {
    if (!pomodoroEnabled) {
      setPomodoroTime(workDuration * 60);
      setIsBreak(false);
      setIsRunning(false);
      setTimerCollapsed(false);
    }
    setPomodoroEnabled(!pomodoroEnabled);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setPomodoroTime(isBreak ? breakDuration * 60 : workDuration * 60);
  };

  const saveTimerSettings = () => {
    setPomodoroTime(workDuration * 60);
    setIsBreak(false);
    setIsRunning(false);
    setShowTimerSettings(false);
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const scopesData = await scopesAPI.getAll();

      if (scopesData.length > 0) {
        const scopesWithTodos = await Promise.all(
          scopesData.map(async (scope) => {
            const todos = await todosAPI.getByScopeId(scope.id);
            return { ...scope, todos };
          }),
        );
        setScopes(scopesWithTodos);
        setActiveScope(scopesWithTodos[0].id);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentScope = scopes.find((s) => s.id === activeScope);

  const addScope = async () => {
    try {
      const maxPosition = Math.max(...scopes.map((s) => s.position), -1);
      const newScope = await scopesAPI.create("Untitled", maxPosition + 1);
      setScopes([...scopes, { ...newScope, todos: [] }]);
      setActiveScope(newScope.id);
      setShowScopeMenu(false);
    } catch (error) {
      console.error("Failed to add scope:", error);
    }
  };

  const deleteScope = async (scopeId) => {
    if (scopes.length === 1) return;

    const scopeToDelete = scopes.find((s) => s.id === scopeId);
    const newScopes = scopes.filter((s) => s.id !== scopeId);
    const previousActiveScope = activeScope;

    setScopes(newScopes);
    if (activeScope === scopeId && newScopes.length > 0) {
      setActiveScope(newScopes[0].id);
    }

    setUndoAction({
      type: "scope",
      data: scopeToDelete,
      previousActiveScope,
      action: async () => {
        setScopes([...newScopes, scopeToDelete]);
        setActiveScope(scopeToDelete.id);
        setUndoAction(null);
      },
    });

    try {
      await scopesAPI.delete(scopeId);
    } catch (error) {
      console.error("Failed to delete scope:", error);
      // Revert on error
      setScopes(scopes);
      setActiveScope(previousActiveScope);
      setUndoAction(null);
    }
  };

  const startEditingTab = (scope) => {
    setEditingTabId(scope.id);
    setEditingTabName(scope.name);
  };

  const saveTabName = async () => {
    const finalName = editingTabName.trim() || "Untitled";
    try {
      await scopesAPI.update(editingTabId, finalName);
      setScopes(
        scopes.map((s) =>
          s.id === editingTabId ? { ...s, name: finalName } : s,
        ),
      );
    } catch (error) {
      console.error("Failed to rename scope:", error);
    }
    setEditingTabId(null);
  };

  const startEditingTodo = (todo) => {
    setEditingTodoId(todo.id);
    setEditingTodoText(todo.text);
  };

  const saveTodoText = async () => {
    const finalText = editingTodoText.trim();
    if (!finalText) {
      setEditingTodoId(null);
      return;
    }

    try {
      await todosAPI.update(editingTodoId, finalText);
      setScopes(
        scopes.map((s) =>
          s.id === activeScope
            ? {
                ...s,
                todos: s.todos.map((t) =>
                  t.id === editingTodoId ? { ...t, text: finalText } : t,
                ),
              }
            : s,
        ),
      );
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
    setEditingTodoId(null);
  };

  const addTodo = async () => {
    if (todoInput.trim() === "" || !activeScope) return;

    try {
      const currentScopeTodos = currentScope?.todos || [];
      const maxPosition = Math.max(
        ...currentScopeTodos.map((t) => t.position),
        -1,
      );

      const newTodo = await todosAPI.create(
        activeScope,
        todoInput.trim(),
        maxPosition + 1,
      );

      setScopes(
        scopes.map((s) =>
          s.id === activeScope ? { ...s, todos: [...s.todos, newTodo] } : s,
        ),
      );
      setTodoInput("");
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const toggleTodo = async (todoId) => {
    try {
      const todo = currentScope.todos.find((t) => t.id === todoId);
      await todosAPI.toggle(todoId, !todo.completed);

      setScopes(
        scopes.map((s) =>
          s.id === activeScope
            ? {
                ...s,
                todos: s.todos.map((t) =>
                  t.id === todoId ? { ...t, completed: !t.completed } : t,
                ),
              }
            : s,
        ),
      );
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  };

  const deleteTodo = async (todoId) => {
    const todoToDelete = currentScope.todos.find((t) => t.id === todoId);
    const previousScopes = scopes;

    setScopes(
      scopes.map((s) =>
        s.id === activeScope
          ? { ...s, todos: s.todos.filter((t) => t.id !== todoId) }
          : s,
      ),
    );

    setUndoAction({
      type: "todo",
      data: todoToDelete,
      action: async () => {
        setScopes(previousScopes);
        setUndoAction(null);
      },
    });

    try {
      await todosAPI.delete(todoId);
    } catch (error) {
      console.error("Failed to delete todo:", error);
      // Revert on error
      setScopes(previousScopes);
      setUndoAction(null);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear timer localStorage on logout
      localStorage.removeItem("pomodoroTimerState");
      localStorage.removeItem("pomodoroWorkDuration");
      localStorage.removeItem("pomodoroBreakDuration");

      await authAPI.logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const activeTodos = currentScope?.todos.filter((t) => !t.completed) || [];
  const completedTodos = currentScope?.todos.filter((t) => t.completed) || [];
  const stats = {
    completed: completedTodos.length,
    total: currentScope?.todos.length || 0,
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-dark-bg" : "bg-neutral-50"} font-lora`}
      >
        <div className="w-full max-w-2xl p-4 space-y-4">
          {/* Skeleton header */}
          <div
            className={`${darkMode ? "bg-dark-bg" : "bg-white"} border ${darkMode ? "border-dark-border/30" : "border-neutral-200"} rounded-lg p-4 flex items-center justify-between`}
          >
            <div
              className={`h-6 w-32 ${darkMode ? "bg-neutral-600" : "bg-neutral-200"} rounded animate-pulse`}
            ></div>
            <div
              className={`h-6 w-20 ${darkMode ? "bg-neutral-600" : "bg-neutral-200"} rounded animate-pulse`}
            ></div>
          </div>
          {/* Skeleton input */}
          <div
            className={`${darkMode ? "bg-dark-bg" : "bg-white"} border ${darkMode ? "border-dark-border/30" : "border-neutral-200"} rounded-lg p-4`}
          >
            <div
              className={`h-10 w-full ${darkMode ? "bg-neutral-600" : "bg-neutral-200"} rounded animate-pulse`}
            ></div>
          </div>
          {/* Skeleton todos */}
          <div
            className={`${darkMode ? "bg-dark-bg" : "bg-white"} border ${darkMode ? "border-dark-border/30" : "border-neutral-200"} rounded-lg p-4 space-y-3`}
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`h-5 w-5 ${darkMode ? "bg-neutral-600" : "bg-neutral-200"} rounded animate-pulse`}
                ></div>
                <div
                  className={`h-5 flex-1 ${darkMode ? "bg-neutral-600" : "bg-neutral-200"} rounded animate-pulse`}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-dark-bg" : "bg-neutral-50"} font-lora transition-colors`}
    >
      {/* Desktop-only Navbar at top - OUTSIDE container */}
      <div className={`hidden lg:block sticky top-0 z-20`}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div
            className={`text-xl font-light tracking-tight ${darkMode ? "text-dark-text" : "text-neutral-400"}`}
          >
            PomoDo
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`p-2 ${darkMode ? "text-dark-text hover:text-white" : "text-neutral-400 hover:text-neutral-400"} transition-colors`}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div
        className="min-h-screen flex flex-col lg:items-center lg:justify-center lg:p-4 lg:gap-4"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Desktop Timer - Above todolist container */}
        {pomodoroEnabled && (
          <div className="hidden lg:block w-full lg:max-w-2xl">
            <div className={`${darkMode ? "bg-dark-card border-dark-border/30" : "bg-white border-neutral-200"} border rounded-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`text-5xl font-light tracking-tight ${darkMode ? "text-dark-text" : "text-neutral-800"}`}>
                    {formatTime(pomodoroTime)}
                  </div>
                  <div className={`text-sm ${darkMode ? "text-dark-muted" : "text-neutral-500"}`}>
                    {isBreak ? "Break" : "Focus"}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowTimerSettings(true)}
                    className={`p-2 ${darkMode ? "hover:bg-neutral-700" : "hover:bg-neutral-100"} rounded-full transition-colors`}
                    title="Timer settings"
                  >
                    <Settings
                      size={18}
                      className={darkMode ? "text-dark-muted" : "text-neutral-700"}
                    />
                  </button>
                  <button
                    onClick={togglePomodoro}
                    className={`p-2 ${darkMode ? "hover:bg-neutral-700" : "hover:bg-neutral-100"} rounded-full transition-colors`}
                  >
                    <X
                      size={18}
                      className={darkMode ? "text-dark-muted" : "text-neutral-700"}
                    />
                  </button>
                </div>
              </div>

              <div className={`h-1 ${darkMode ? "bg-dark-bg" : "bg-neutral-100"} rounded-full overflow-hidden mb-4`}>
                <div
                  className={`h-full ${darkMode ? "bg-white" : "bg-neutral-700"} transition-all duration-1000`}
                  style={{
                    width: `${(((isBreak ? breakDuration * 60 : workDuration * 60) - pomodoroTime) / (isBreak ? breakDuration * 60 : workDuration * 60)) * 100}%`,
                  }}
                />
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  onClick={toggleTimer}
                  className={`w-10 h-10 flex items-center justify-center rounded-full ${darkMode ? "hover:bg-neutral-700" : "hover:bg-neutral-100"} transition-colors active:scale-95`}
                >
                  {isRunning ? (
                    <Pause
                      size={18}
                      className={darkMode ? "text-dark-text" : "text-neutral-700"}
                    />
                  ) : (
                    <Play
                      size={18}
                      className={darkMode ? "text-dark-text" : "text-neutral-700"}
                    />
                  )}
                </button>
                <button
                  onClick={resetTimer}
                  className={`w-10 h-10 flex items-center justify-center rounded-full ${darkMode ? "hover:bg-neutral-700" : "hover:bg-neutral-100"} transition-colors active:scale-95`}
                >
                  <RotateCcw
                    size={18}
                    className={darkMode ? "text-dark-text" : "text-neutral-700"}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Todo App Container */}
        <div className="w-full lg:max-w-2xl flex flex-col h-screen lg:h-auto">
          {/* Header - Tabs & Controls */}
          <div
            className={`${darkMode ? "bg-dark-card border-dark-border/30" : "bg-white border-neutral-200"} border-b lg:border lg:rounded-t-lg px-4 py-3 lg:py-4 sticky top-0 lg:top-0 z-10 transition-all`}
          >
            {/* Mobile Header */}
            <div className="lg:hidden">
              {/* Timer when enabled - compact inline */}
              {pomodoroEnabled && (
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-200 dark:border-dark-border/30">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xl font-light ${darkMode ? "text-dark-text" : "text-neutral-800"}`}
                    >
                      {formatTime(pomodoroTime)}
                    </span>
                    <span
                      className={`text-xs ${darkMode ? "text-dark-muted" : "text-neutral-500"}`}
                    >
                      {isBreak ? "Break" : "Focus"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={toggleTimer}
                      className={`p-2 ${darkMode ? "hover:bg-neutral-600" : "hover:bg-neutral-100"} rounded transition-colors`}
                    >
                      {isRunning ? (
                        <Pause
                          size={16}
                          className={
                            darkMode ? "text-dark-text" : "text-neutral-700"
                          }
                        />
                      ) : (
                        <Play
                          size={16}
                          className={
                            darkMode ? "text-dark-text" : "text-neutral-700"
                          }
                        />
                      )}
                    </button>
                    <button
                      onClick={resetTimer}
                      className={`p-2 ${darkMode ? "hover:bg-neutral-600" : "hover:bg-neutral-100"} rounded transition-colors`}
                    >
                      <RotateCcw
                        size={16}
                        className={
                          darkMode ? "text-dark-muted" : "text-neutral-600"
                        }
                      />
                    </button>
                    <button
                      onClick={togglePomodoro}
                      className={`p-2 ${darkMode ? "hover:bg-neutral-600" : "hover:bg-neutral-100"} rounded transition-colors`}
                    >
                      <X
                        size={16}
                        className={
                          darkMode ? "text-dark-muted" : "text-neutral-500"
                        }
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Scope selector & actions */}
              <div className="flex items-center justify-between gap-3">
                <select
                  value={activeScope || ""}
                  onChange={(e) => setActiveScope(e.target.value)}
                  className={`flex-1 px-3 py-2 text-sm border ${darkMode ? "bg-dark-bg border-dark-border/30 text-dark-text" : "bg-neutral-50 border-neutral-200 text-neutral-800"} rounded focus:outline-none focus:border-neutral-400`}
                >
                  {scopes.map((scope) => (
                    <option key={scope.id} value={scope.id}>
                      {scope.name}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1">
                  <MusicPlayer darkMode={darkMode} />

                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`p-2 ${darkMode ? "text-dark-text" : "text-neutral-600"}`}
                    title="Toggle theme"
                  >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                  {!pomodoroEnabled && (
                    <button
                      onClick={togglePomodoro}
                      className={`p-2 ${darkMode ? "text-dark-text" : "text-neutral-600"}`}
                      title="Start timer"
                    >
                      <Clock size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className={`p-2 ${darkMode ? "text-dark-text" : "text-neutral-600"}`}
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop: Single Row - Tabs, Controls */}
            <div className="hidden lg:flex items-center justify-between gap-6">
              {/* Left: Tabs */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Tabs container with fade effect */}
                <div className="relative flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    {scopes.map((scope) => (
                      <div
                        key={scope.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                          activeScope === scope.id
                            ? `${darkMode ? "bg-white text-neutral-900" : "bg-neutral-700 text-white"}`
                            : `${darkMode ? "text-neutral-400 hover:bg-dark-bg/50" : "text-neutral-600 hover:bg-neutral-100"}`
                        }`}
                      >
                        {editingTabId === scope.id ? (
                          <input
                            type="text"
                            value={editingTabName}
                            onChange={(e) => setEditingTabName(e.target.value)}
                            onBlur={saveTabName}
                            onKeyPress={(e) =>
                              e.key === "Enter" && saveTabName()
                            }
                            className={`${darkMode ? "bg-dark-bg text-dark-text border-dark-border/30" : "bg-white text-neutral-800 border-neutral-300"} px-2 py-0.5 rounded outline-none text-sm w-24 border`}
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => setActiveScope(scope.id)}
                            onDoubleClick={() => startEditingTab(scope)}
                            className="text-sm cursor-pointer select-none"
                          >
                            {scope.name}
                          </span>
                        )}
                        {scopes.length > 1 && (
                          <button
                            onClick={() => deleteScope(scope.id)}
                            className="opacity-60 hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addScope}
                      className={`flex items-center gap-1 px-3 py-1.5 ${darkMode ? "text-dark-muted hover:text-dark-text hover:bg-dark-bg/50" : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100"} rounded transition-colors text-sm whitespace-nowrap`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Fade effect for overflow */}
                  <div
                    className={`absolute top-0 right-0 bottom-0 w-12 pointer-events-none bg-gradient-to-l ${darkMode ? "from-dark-card" : "from-white"}`}
                  ></div>
                </div>
              </div>

              {/* Right: Controls */}
              <div className="flex items-center gap-1">
                <MusicPlayer darkMode={darkMode} />

                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2 ${darkMode ? "text-dark-text hover:text-white" : "text-neutral-600 hover:text-neutral-800"} transition-colors`}
                  title="Toggle theme"
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {!pomodoroEnabled && (
                  <button
                    onClick={togglePomodoro}
                    className={`p-2 ${darkMode ? "text-dark-text hover:text-white" : "text-neutral-600 hover:text-neutral-800"} transition-colors`}
                    title="Start timer"
                  >
                    <Clock size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Input Section */}
          <div
            className={`${darkMode ? "bg-dark-card border-dark-border/30" : "bg-white border-neutral-200"} lg:border-x p-3 lg:p-4 border-b`}
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTodo()}
                placeholder="Add a task..."
                className={`flex-1 px-3 py-3 lg:py-2 text-sm border ${darkMode ? "bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500" : "bg-white border-neutral-200 text-neutral-900"} rounded focus:outline-none ${darkMode ? "focus:border-neutral-400" : "focus:border-neutral-400"} transition-colors`}
              />
              <button
                onClick={addTodo}
                className={`px-5 py-3 lg:py-2 ${darkMode ? "bg-white text-neutral-900 hover:bg-neutral-100" : "bg-neutral-700 text-white hover:bg-neutral-700"} text-sm rounded active:scale-95 transition-all whitespace-nowrap font-medium`}
              >
                Add
              </button>
            </div>
          </div>

          {/* Todo List - Scrollable */}
          <div
            className={`flex-1 ${darkMode ? "bg-neutral-700 border-neutral-600 divide-neutral-700/50" : "bg-white border-neutral-200 divide-neutral-100"} lg:border-x lg:border-b lg:rounded-b-lg overflow-y-auto divide-y`}
          >
            {currentScope && currentScope.todos.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="text-5xl">✨</div>
                <div
                  className={`${darkMode ? "text-neutral-500" : "text-neutral-400"} text-sm`}
                >
                  Your mind is clear
                </div>
                <button
                  onClick={() => inputRef.current?.focus()}
                  className={`text-xs ${darkMode ? "text-neutral-600 hover:text-neutral-400" : "text-neutral-400 hover:text-neutral-600"} transition-colors`}
                >
                  Add your first task to get started
                </button>
              </div>
            ) : (
              <>
                {/* Active Todos */}
                {activeTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`group flex items-center gap-3 px-4 py-4 lg:py-3 ${darkMode ? "hover:bg-neutral-700/50 active:bg-neutral-700" : "hover:bg-neutral-50 active:bg-neutral-100"} transition-all animate-slideIn`}
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      className={`w-5 h-5 lg:w-4 lg:h-4 rounded ${darkMode ? "border-neutral-600 bg-neutral-800" : "border-neutral-300"} text-neutral-800 focus:ring-0 focus:ring-offset-0 cursor-pointer flex-shrink-0 transition-transform active:scale-90`}
                    />

                    <span
                      className={`flex-1 text-sm leading-relaxed ${darkMode ? "text-dark-text" : "text-neutral-700"}`}
                    >
                      {todo.text}
                    </span>

                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className={`opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-2 lg:p-1 ${darkMode ? "text-neutral-500 hover:text-neutral-300 active:text-white" : "text-neutral-400 hover:text-neutral-600 active:text-neutral-800"} transition-all flex-shrink-0`}
                    >
                      <Trash2 size={18} className="lg:w-4 lg:h-4" />
                    </button>
                  </div>
                ))}

                {/* Completed Tasks Section */}
                {completedTodos.length > 0 && (
                  <>
                    <div
                      onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                      className={`flex items-center justify-between px-4 py-2 ${darkMode ? "bg-neutral-800/50 text-neutral-500 hover:bg-neutral-800" : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100"} cursor-pointer select-none transition-colors`}
                    >
                      <span className="text-xs font-medium">
                        Completed ({completedTodos.length})
                      </span>
                      {showCompletedTasks ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </div>

                    {showCompletedTasks &&
                      completedTodos.map((todo) => (
                        <div
                          key={todo.id}
                          className={`group flex items-center gap-3 px-4 py-4 lg:py-3 ${darkMode ? "bg-neutral-800/30 hover:bg-neutral-700/30" : "bg-neutral-50/50 hover:bg-neutral-50"} transition-all animate-slideIn`}
                        >
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => toggleTodo(todo.id)}
                            className={`w-5 h-5 lg:w-4 lg:h-4 rounded ${darkMode ? "border-neutral-600 bg-neutral-800" : "border-neutral-300"} text-neutral-800 focus:ring-0 focus:ring-offset-0 cursor-pointer flex-shrink-0 transition-transform active:scale-90`}
                          />

                          <span
                            className={`flex-1 text-sm line-through leading-relaxed ${darkMode ? "text-neutral-600" : "text-neutral-400"} transition-all`}
                          >
                            {todo.text}
                          </span>

                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className={`opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-2 lg:p-1 ${darkMode ? "text-neutral-600 hover:text-neutral-400" : "text-neutral-400 hover:text-neutral-600"} transition-all flex-shrink-0`}
                          >
                            <Trash2 size={18} className="lg:w-4 lg:h-4" />
                          </button>
                        </div>
                      ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer Stats */}
          <div
            className={`${darkMode ? "bg-dark-card border-dark-border/30" : "bg-white border-neutral-200"} lg:border-x lg:border-b lg:rounded-b-lg px-4 py-3 pb-6 lg:pb-3 border-t lg:border-t-0 sticky bottom-0 lg:static`}
          >
            {currentScope && currentScope.todos.length > 0 && (
              <div
                className={`text-xs ${darkMode ? "text-neutral-500" : "text-neutral-500"} text-center mb-2 lg:mb-0`}
              >
                {stats.completed} of {stats.total} completed
              </div>
            )}
            {/* Mobile: Logo */}
            <div className="lg:hidden text-center">
              <span
                className={`text-xs font-light tracking-tight ${darkMode ? "text-neutral-600" : "text-neutral-400"}`}
              >
                PomoDo
              </span>
            </div>
          </div>
        </div>

        {/* Undo Toast Notification */}
        {undoAction && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
            <div
              className={`${darkMode ? "bg-neutral-700 border-neutral-600 text-white" : "bg-white border-neutral-300 text-neutral-900"} border-2 rounded-full px-4 py-3 shadow-xl flex items-center gap-4`}
            >
              <span className="text-sm">
                {undoAction.type === "todo" ? "Task" : "Scope"} deleted
              </span>
              <button
                onClick={() => {
                  undoAction.action();
                }}
                className={`text-sm font-medium ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"} transition-colors`}
              >
                Undo
              </button>
            </div>
          </div>
        )}

        {/* Logout Confirmation Dialog */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className={`${darkMode ? "bg-dark-card border-dark-border/30" : "bg-white border-neutral-200"} border rounded-lg p-6 max-w-sm w-full animate-scaleIn`}
            >
              <h3
                className={`text-lg font-medium ${darkMode ? "text-dark-text" : "text-neutral-900"} mb-2`}
              >
                Logout
              </h3>
              <p
                className={`text-sm ${darkMode ? "text-dark-muted" : "text-neutral-600"} mb-6`}
              >
                Are you sure you want to logout?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className={`px-4 py-2 text-sm ${darkMode ? "text-neutral-300 hover:bg-neutral-700" : "text-neutral-600 hover:bg-neutral-100"} rounded transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className={`px-4 py-2 text-sm ${darkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"} text-white rounded transition-colors`}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Timer Settings Modal */}
        {showTimerSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className={`${darkMode ? "bg-dark-card border-dark-border/30" : "bg-white border-neutral-200"} border rounded-lg p-6 max-w-sm w-full animate-scaleIn`}
            >
              <h3
                className={`text-lg font-medium ${darkMode ? "text-dark-text" : "text-neutral-900"} mb-4`}
              >
                Timer Settings
              </h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label
                    className={`text-sm ${darkMode ? "text-dark-muted" : "text-neutral-600"} block mb-2`}
                  >
                    Focus duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={workDuration}
                    onChange={(e) =>
                      setWorkDuration(
                        Math.max(1, parseInt(e.target.value) || 1),
                      )
                    }
                    min="1"
                    max="60"
                    className={`w-full px-3 py-2 border ${darkMode ? "bg-neutral-800 border-neutral-600 text-white" : "bg-white border-neutral-300 text-neutral-900"} rounded focus:outline-none focus:border-neutral-400`}
                  />
                </div>
                <div>
                  <label
                    className={`text-sm ${darkMode ? "text-dark-muted" : "text-neutral-600"} block mb-2`}
                  >
                    Break duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={breakDuration}
                    onChange={(e) =>
                      setBreakDuration(
                        Math.max(1, parseInt(e.target.value) || 1),
                      )
                    }
                    min="1"
                    max="30"
                    className={`w-full px-3 py-2 border ${darkMode ? "bg-neutral-800 border-neutral-600 text-white" : "bg-white border-neutral-300 text-neutral-900"} rounded focus:outline-none focus:border-neutral-400`}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowTimerSettings(false)}
                  className={`px-4 py-2 text-sm ${darkMode ? "text-neutral-300 hover:bg-neutral-700" : "text-neutral-600 hover:bg-neutral-100"} rounded transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={saveTimerSettings}
                  className={`px-4 py-2 text-sm ${darkMode ? "bg-white text-neutral-900 hover:bg-neutral-100" : "bg-neutral-700 text-white hover:bg-neutral-700"} rounded transition-colors`}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
