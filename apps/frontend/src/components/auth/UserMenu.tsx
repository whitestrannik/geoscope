import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { AuthModal } from './AuthModal'
import { LogIn, LogOut, User, Loader2 } from 'lucide-react'

export function UserMenu() {
  const { user, loading, signOut } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md border border-cyan-500/30 rounded-lg px-4 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
        <span className="text-sm text-cyan-400 font-mono">Loading...</span>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md border border-cyan-500/30 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-cyan-400 font-mono">{user.email}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={signingOut}
          className="bg-black/70 backdrop-blur-md border-red-500/50 text-red-400 hover:text-red-300 hover:border-red-400 hover:bg-red-500/20"
        >
          {signingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span className="hidden sm:inline font-mono">[ LOGOUT ]</span>
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setAuthModalOpen(true)}
        className="bg-black/70 backdrop-blur-md border-cyan-500/50 text-cyan-400 hover:text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/20"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline font-mono">[ LOGIN ]</span>
      </Button>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  )
} 