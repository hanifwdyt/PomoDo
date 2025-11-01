import ProtectedRoute from './components/Auth/ProtectedRoute'
import TodoApp from './components/Todo/TodoApp'

function App() {
  return (
    <ProtectedRoute>
      <TodoApp />
    </ProtectedRoute>
  )
}

export default App
