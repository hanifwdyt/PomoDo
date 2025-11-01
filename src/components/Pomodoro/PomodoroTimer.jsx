import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

export default function PomodoroTimer({ workMinutes = 25, breakMinutes = 5 }) {
  const [minutes, setMinutes] = useState(workMinutes)
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isBreak, setIsBreak] = useState(false)

  useEffect(() => {
    let interval = null

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer finished
            setIsActive(false)
            // Play sound notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(isBreak ? 'Break over!' : 'Work session complete!', {
                body: isBreak ? 'Time to focus again' : 'Time for a break',
              })
            }
            // Switch between work and break
            setIsBreak(!isBreak)
            setMinutes(isBreak ? workMinutes : breakMinutes)
          } else {
            setMinutes(minutes - 1)
            setSeconds(59)
          }
        } else {
          setSeconds(seconds - 1)
        }
      }, 1000)
    } else {
      clearInterval(interval)
    }

    return () => clearInterval(interval)
  }, [isActive, minutes, seconds, isBreak, workMinutes, breakMinutes])

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setIsBreak(false)
    setMinutes(workMinutes)
    setSeconds(0)
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
      <div className="text-sm text-neutral-500 mb-2">
        {isBreak ? 'Break Time' : 'Focus Time'}
      </div>
      <div className="text-4xl font-light mb-4 font-mono">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <div className="flex justify-center gap-2">
        <button
          onClick={toggleTimer}
          className="px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors flex items-center gap-2"
        >
          {isActive ? <Pause size={16} /> : <Play size={16} />}
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={resetTimer}
          className="px-4 py-2 bg-neutral-100 text-neutral-800 rounded hover:bg-neutral-200 transition-colors flex items-center gap-2"
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>
    </div>
  )
}
