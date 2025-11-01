import { Trash2 } from 'lucide-react'

export default function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <div className="flex items-center gap-2 p-2 hover:bg-neutral-50 rounded group">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className="w-4 h-4 cursor-pointer"
      />
      <span className={`flex-1 ${todo.completed ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
        {todo.text}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
