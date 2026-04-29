import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BackgroundOrbs } from './components/BackgroundOrbs'
import { Dashboard } from './pages/Dashboard'
import { TopicDetail } from './pages/TopicDetail'
import { Settings } from './pages/Settings'

export function App() {
  return (
    <BrowserRouter>
      <BackgroundOrbs />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/topic/:id" element={<TopicDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}
