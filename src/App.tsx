import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WelcomeAnimation from './components/WelcomeAnimation';
import Dashboard from './components/Dashboard';
import PlayerStatsScreen from './components/PlayerStatsScreen';

const basePath = import.meta.env.VITE_BASE_PATH || '/';

function App() {
  const [showWelcome, setShowWelcome] = useState(true);

  function handleWelcomeComplete() {
    setShowWelcome(false);
  }

  return (
    <BrowserRouter basename={basePath}>
      {showWelcome && <WelcomeAnimation onComplete={handleWelcomeComplete} />}
      {!showWelcome && (
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/players" element={<PlayerStatsScreen />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
