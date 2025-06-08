import { useState } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">GeoScope</h1>
          <p className="text-lg text-gray-600">
            Multiplayer Geography Guessing Game
          </p>
        </div>
        
        <div className="space-y-4 mb-8">
          <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
            Play Solo
          </Button>
          <Button className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
            Create Room
          </Button>
          <Button className="w-full bg-teal-600 hover:bg-teal-700" size="lg">
            Join Room
          </Button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Setup Test Counter:</p>
          <button 
            onClick={() => setCount((count) => count + 1)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition-colors duration-200"
          >
            Count: {count}
          </button>
        </div>

        <div className="mt-8 text-xs text-gray-500 space-y-1">
          <p>✅ React + TypeScript + Vite</p>
          <p>✅ TailwindCSS v4</p>
          <p>✅ shadcn/ui Components</p>
          <p>✅ Backend tRPC API</p>
        </div>
      </div>
    </div>
  )
}

export default App
