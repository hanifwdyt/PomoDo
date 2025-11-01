import { Plus } from 'lucide-react'

export default function TodoInput({ value, onChange, onSubmit, placeholder = "Add a new task..." }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSubmit()
    }
  }

  return (
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
      />
      <button
        onClick={onSubmit}
        className="px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors flex items-center gap-2"
      >
        <Plus size={18} />
        Add
      </button>
    </div>
  )
}
