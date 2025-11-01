import { useState } from 'react'
import { X } from 'lucide-react'

export default function ScopeTab({ scope, isActive, onClick, onDelete, onRename }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(scope.name)

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (editValue.trim() !== '' && editValue !== scope.name) {
      onRename(scope.id, editValue.trim())
    } else {
      setEditValue(scope.name)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setEditValue(scope.name)
      setIsEditing(false)
    }
  }

  return (
    <div
      className={`px-4 py-2 rounded cursor-pointer flex items-center gap-2 group ${
        isActive ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
      }`}
      onClick={!isEditing ? onClick : undefined}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyPress}
          autoFocus
          className="bg-transparent border-b border-current outline-none text-sm flex-1 min-w-0"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-sm flex-1">{scope.name}</span>
      )}
      {!isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(scope.id)
          }}
          className={`opacity-0 group-hover:opacity-100 transition-opacity ${
            isActive ? 'hover:text-red-300' : 'hover:text-red-600'
          }`}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
