
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { HomePage } from '@/pages/HomePage';
import { SoloPage } from '@/pages/SoloPage';
import { CreateRoomPage } from '@/pages/CreateRoomPage';
import { JoinRoomPage } from '@/pages/JoinRoomPage';
import { RoomPage } from '@/pages/RoomPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { StatsPage } from '@/pages/StatsPage';

function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/solo" element={<SoloPage />} />
          <Route path="/room/create" element={<CreateRoomPage />} />
          <Route path="/room/join" element={<JoinRoomPage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="*" element={
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="text-center text-white">
                <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                <p className="text-blue-200 mb-4">The page you're looking for doesn't exist.</p>
                <a href="/" className="text-blue-400 hover:text-blue-300 underline">
                  ← Go back home
                </a>
              </div>
            </div>
          } />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;
