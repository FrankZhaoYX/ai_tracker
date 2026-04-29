import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Check } from 'lucide-react'
import { fetchSettings, updateSettings } from '../lib/api'
import type { Settings as SettingsType } from '../types/index'

export function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [form, setForm] = useState<Partial<SettingsType>>({})
  const [saved, setSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
      .then((s) => { setSettings(s); setForm(s) })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const handleSave = async () => {
    try {
      const updated = await updateSettings(form)
      setSettings(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  const field = (label: string, child: React.ReactNode) => (
    <div className="space-y-1.5">
      <label className="text-xs font-mono text-white/40 uppercase tracking-wider">{label}</label>
      {child}
    </div>
  )

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-400/50 transition-colors'

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 max-w-xl mx-auto text-white">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm mb-6">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        <h1 className="text-xl font-bold mb-6">Settings</h1>

        {isLoading || !settings ? (
          <div className="flex justify-center py-12">
            <motion.div
              className="w-6 h-6 rounded-full border-2 border-cyan-400/30 border-t-cyan-400"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            />
          </div>
        ) : (
          <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6">
            {field('Cron Schedule', (
              <input
                type="text"
                className={inputClass}
                value={form.cronExpression ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, cronExpression: e.target.value }))}
                placeholder="*/30 * * * *"
              />
            ))}

            {field('Alert Threshold (Hot Score)', (
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={50}
                  max={99}
                  value={form.alertThreshold ?? 80}
                  onChange={(e) => setForm((f) => ({ ...f, alertThreshold: Number(e.target.value) }))}
                  className="flex-1 accent-violet-500"
                />
                <span className="text-violet-400 font-mono font-bold w-8 text-right">
                  {form.alertThreshold}
                </span>
              </div>
            ))}

            {field('Email Notifications', (
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className="relative w-10 h-5 rounded-full transition-colors"
                  style={{ background: form.emailEnabled ? '#8b5cf6' : '#ffffff15' }}
                  onClick={() => setForm((f) => ({ ...f, emailEnabled: !f.emailEnabled }))}
                >
                  <motion.div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
                    animate={{ left: form.emailEnabled ? '1.25rem' : '0.125rem' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                </div>
                <span className="text-white/60 text-sm">
                  {form.emailEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            ))}

            {form.emailEnabled && field('Notification Email', (
              <input
                type="email"
                className={inputClass}
                value={form.notifyEmail ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, notifyEmail: e.target.value }))}
                placeholder="you@example.com"
              />
            ))}

            <motion.button
              onClick={handleSave}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              style={{ background: saved ? '#00f5d4' : '#8b5cf6', color: saved ? '#000' : '#fff' }}
            >
              {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Settings</>}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
