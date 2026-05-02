import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BackgroundBeams } from './components/aceternity/BackgroundBeams'
import { GridPattern } from './components/aceternity/GridPattern'
import { Meteors } from './components/aceternity/Meteors'
import { Dashboard } from './pages/Dashboard'
import { TopicDetail } from './pages/TopicDetail'
import { Settings } from './pages/Settings'

export function App() {
  return (
    <BrowserRouter>
      {/* Persistent background layers */}
      <div className="fixed inset-0 bg-[#0a0a0f]" />
      <GridPattern opacity={0.025} />
      <BackgroundBeams className="opacity-60" />
      <Meteors number={12} />
      <div className="scanline" />

      {/* Radial fade from center */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,245,212,0.06) 0%, transparent 60%)',
        }}
      />

      {/* App content above all background layers */}
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/topic/:id" element={<TopicDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
