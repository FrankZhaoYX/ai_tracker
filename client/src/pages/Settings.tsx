import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Check, Bell, Clock, Shield } from 'lucide-react'
import { fetchSettings, updateSettings } from '../lib/api'
import { CardSpotlight } from '../components/aceternity/CardSpotlight'
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
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  const inputClass = [
    'w-full bg-white/[0.04] border border-white/8 rounded-xl px-3.5 py-2.5',
    'text-sm text-white font-mono placeholder-white/20',
    'focus:outline-none focus:border-cyan-400/40 focus:bg-white/[0.06]',
    'transition-all duration-200',
  ].join(' ')

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors text-xs font-mono tracking-widest mb-6 group"
        >
          <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
          RETURN TO FEED
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold">Configuration</h1>
          <p className="text-white/25 text-xs font-mono mt-0.5 tracking-wide">Signal monitor parameters</p>
        </div>

        {isLoading || !settings ? (
          <div className="flex justify-center py-16">
            <motion.div
              className="w-8 h-8 rounded-full border-t border-cyan-400"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            />
          </div>
        ) : (
          <CardSpotlight radius={400} color="#00f5d408" className="border border-white/8 bg-white/[0.03] p-6">
            <div className="space-y-6">
              {/* Cron */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[10px] font-mono text-white/35 uppercase tracking-widest">
                  <Clock size={10} /> Scan Interval (Cron)
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.cronExpression ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, cronExpression: e.target.value }))}
                  placeholder="*/30 * * * *"
                />
                <p className="text-white/15 text-[10px] font-mono">
                  Standard cron format — e.g. <code className="text-white/30">*/30 * * * *</code> = every 30 min
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/5" />

              {/* Threshold */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[10px] font-mono text-white/35 uppercase tracking-widest">
                  <Shield size={10} /> Alert Threshold
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={50}
                    max={99}
                    value={form.alertThreshold ?? 80}
                    onChange={(e) => setForm((f) => ({ ...f, alertThreshold: Number(e.target.value) }))}
                    className="flex-1 accent-violet-500 cursor-pointer"
                  />
                  <span className="text-violet-400 font-mono font-bold text-sm w-7 text-right glow-violet">
                    {form.alertThreshold}
                  </span>
                </div>
                <p className="text-white/15 text-[10px] font-mono">
                  Topics scoring above this trigger email alerts
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/5" />

              {/* Email */}
              <div className="space-y-3">
                <label className="flex items-center gap-1.5 text-[10px] font-mono text-white/35 uppercase tracking-widest">
                  <Bell size={10} /> Email Alerts
                </label>
                <div
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer"
                  onClick={() => setForm((f) => ({ ...f, emailEnabled: !f.emailEnabled }))}
                >
                  <span className="text-sm text-white/60">
                    {form.emailEnabled ? 'Alerts enabled' : 'Alerts disabled'}
                  </span>
                  <div
                    className="relative w-10 h-5 rounded-full transition-colors duration-200"
                    style={{ background: form.emailEnabled ? '#8b5cf6' : '#ffffff15' }}
                  >
                    <motion.div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                      animate={{ left: form.emailEnabled ? '1.375rem' : '0.125rem' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  </div>
                </div>

                {form.emailEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <input
                      type="email"
                      className={inputClass}
                      value={form.notifyEmail ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, notifyEmail: e.target.value }))}
                      placeholder="recipient@example.com"
                    />
                  </motion.div>
                )}
              </div>

              {/* Save */}
              <motion.button
                onClick={handleSave}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300"
                style={{
                  background: saved
                    ? 'linear-gradient(135deg, #00f5d4, #00c9a7)'
                    : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  color: saved ? '#000' : '#fff',
                  boxShadow: saved
                    ? '0 0 20px rgba(0,245,212,0.3)'
                    : '0 0 20px rgba(139,92,246,0.3)',
                }}
              >
                {saved ? (
                  <><Check size={15} /> Parameters Saved</>
                ) : (
                  <><Save size={15} /> Save Configuration</>
                )}
              </motion.button>
            </div>
          </CardSpotlight>
        )}
      </motion.div>
    </div>
  )
}
