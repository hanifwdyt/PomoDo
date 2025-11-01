import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle({ darkMode, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      aria-label="Toggle dark mode"
    >
      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
