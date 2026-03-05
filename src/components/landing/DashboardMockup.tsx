'use client';

import { useEffect, useState, useRef } from 'react';

function CounterAnimation({ target, duration = 2000, prefix = '', suffix = '' }: { target: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * target);
      setCount(currentCount);
      if (progress >= 1) {
        clearInterval(timer);
        setCount(target);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{prefix}{count}{suffix}</span>;
}

export function DashboardMockup() {
  const [mounted, setMounted] = useState(false);
  const [animate, setAnimate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => setAnimate(true), 300);
  }, []);

  if (!mounted) return null;

  const stats = [
    { label: 'Prospects Chauds', value: 8, trend: '+3', trendUp: true, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', dotColor: '#ef4444', bgGlow: 'rgba(239, 68, 68, 0.08)' },
    { label: 'Prospects Tièdes', value: 15, trend: '+5', trendUp: true, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', dotColor: '#f59e0b', bgGlow: 'rgba(245, 158, 11, 0.08)' },
    { label: 'Prospects Froids', value: 23, trend: '-2', trendUp: false, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', dotColor: '#3b82f6', bgGlow: 'rgba(59, 130, 246, 0.08)' },
    { label: 'Emails Envoyés', value: 42, trend: '+12', trendUp: true, gradient: 'linear-gradient(135deg, #22c55e, #16a34a)', dotColor: '#22c55e', bgGlow: 'rgba(34, 197, 94, 0.08)' }
  ];

  const activities = [
    { action: 'Nouveau prospect', name: 'Marie Dubois', time: 'Il y a 2 min', dotColor: '#22c55e' },
    { action: 'RDV planifié', name: 'Jean Martin', time: 'Il y a 15 min', dotColor: '#3b82f6' },
    { action: 'Qualifié CHAUD', name: 'Claire Simon', time: 'Il y a 1h', dotColor: '#ef4444' },
    { action: 'Email envoyé', name: 'Paul Durand', time: 'Il y a 2h', dotColor: '#8b5cf6' },
  ];

  const prospects = [
    { nom: 'Marie Dubois', qualification: 'CHAUD', score: 95, statut: 'RDV: 15/01', qColor: '#ef4444', qBg: 'rgba(239, 68, 68, 0.12)' },
    { nom: 'Jean Martin', qualification: 'CHAUD', score: 88, statut: 'RDV Pris', qColor: '#ef4444', qBg: 'rgba(239, 68, 68, 0.12)' },
    { nom: 'Claire Simon', qualification: 'TIÈDE', score: 72, statut: 'Contacté', qColor: '#f59e0b', qBg: 'rgba(245, 158, 11, 0.12)' },
  ];

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#0f1219', overflow: 'hidden', position: 'relative', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Subtle grid background */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', letterSpacing: '-0.01em' }}>Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1014.85-3.36L23 6" />
          </svg>
          <span>Actualiser</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px' }}>
        {/* Stats Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px'
        }}>
          {stats.map((stat, i) => (
            <div key={i} style={{
              background: stat.bgGlow,
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              padding: '10px 12px',
              opacity: animate ? 1 : 0,
              transform: animate ? 'translateY(0)' : 'translateY(10px)',
              transition: `all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${i * 0.1}s`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: stat.dotColor, boxShadow: `0 0 8px ${stat.dotColor}60` }} />
                <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                  {animate ? <CounterAnimation target={stat.value} duration={1800 + i * 200} /> : '0'}
                </span>
                <span style={{
                  fontSize: '9px', fontWeight: 600,
                  color: stat.trendUp ? '#22c55e' : '#ef4444',
                  background: stat.trendUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  padding: '2px 5px', borderRadius: '4px',
                }}>
                  {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {/* Chart */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '12px',
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateX(0)' : 'translateX(-15px)',
            transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#e2e8f0' }}>Évolution Prospects (30j)</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[{ label: 'Chauds', color: '#ef4444' }, { label: 'Tièdes', color: '#f59e0b' }].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: l.color }} />
                    <span style={{ fontSize: '8px', color: '#64748b' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height: '90px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 300 90" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="dashGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="dashGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[18, 36, 54, 72].map((y) => (
                  <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                ))}
                {/* Line 1 - Blue */}
                <path d="M0 72 Q40 65 80 58 T160 42 T240 30 T300 22"
                  stroke="#3b82f6" strokeWidth="2" fill="none" strokeLinecap="round"
                  strokeDasharray="400" strokeDashoffset={animate ? "0" : "400"}
                  style={{ transition: 'stroke-dashoffset 2.5s ease-in-out 0.5s' }}
                />
                <path d="M0 72 Q40 65 80 58 T160 42 T240 30 T300 22 L300 90 L0 90 Z"
                  fill="url(#dashGrad1)"
                  opacity={animate ? 1 : 0}
                  style={{ transition: 'opacity 0.8s ease-in-out 2.5s' }}
                />
                {/* Line 2 - Cyan */}
                <path d="M0 65 Q50 60 100 55 T200 48 T300 38"
                  stroke="#06b6d4" strokeWidth="1.5" fill="none" strokeLinecap="round"
                  strokeDasharray="400" strokeDashoffset={animate ? "0" : "400"}
                  style={{ transition: 'stroke-dashoffset 2.5s ease-in-out 0.8s' }}
                  opacity="0.6"
                />
                {/* Data points */}
                {[{ x: 0, y: 72 }, { x: 80, y: 58 }, { x: 160, y: 42 }, { x: 240, y: 30 }, { x: 300, y: 22 }].map((pt, i) => (
                  <circle key={i} cx={pt.x} cy={pt.y} r="0" fill="#3b82f6"
                    style={{ animation: animate ? `pointAppear 0.3s ease-out ${3 + i * 0.1}s forwards` : 'none' }}
                  />
                ))}
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              {['01 Fév', '08 Fév', '15 Fév', '22 Fév', '01 Mar'].map((d, i) => (
                <span key={i} style={{ fontSize: '7px', color: '#475569' }}>{d}</span>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '12px',
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateX(0)' : 'translateX(15px)',
            transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s',
          }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '10px' }}>Activité Récente</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activities.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  opacity: animate ? 1 : 0,
                  transform: animate ? 'translateY(0)' : 'translateY(8px)',
                  transition: `all 0.4s ease ${0.6 + i * 0.1}s`,
                }}>
                  <div style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: a.dotColor, marginTop: '4px', flexShrink: 0,
                    boxShadow: `0 0 6px ${a.dotColor}50`,
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '9px', color: '#e2e8f0', fontWeight: 500 }}>{a.action}</div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>{a.name}</div>
                    <div style={{ fontSize: '8px', color: '#475569' }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Prospects Table */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '10px', overflow: 'hidden',
          opacity: animate ? 1 : 0,
          transform: animate ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.5s',
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#e2e8f0' }}>Top Prospects</span>
          </div>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr',
            padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            {['Nom', 'Qualification', 'Score IA', 'Statut'].map((h) => (
              <span key={h} style={{ fontSize: '8px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>
          {/* Rows */}
          {prospects.map((p, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr',
              padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)',
              transition: 'background 0.2s',
            }}>
              <span style={{ fontSize: '9px', color: '#e2e8f0', fontWeight: 500 }}>{p.nom}</span>
              <span>
                <span style={{
                  fontSize: '8px', fontWeight: 600, color: p.qColor,
                  background: p.qBg, padding: '1px 6px', borderRadius: '4px',
                  border: `1px solid ${p.qColor}25`,
                }}>{p.qualification}</span>
              </span>
              <span style={{ fontSize: '9px', color: '#e2e8f0', fontWeight: 600 }}>{p.score}<span style={{ color: '#475569', fontWeight: 400 }}>/100</span></span>
              <span style={{ fontSize: '9px', color: '#94a3b8' }}>{p.statut}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes pointAppear {
          from { r: 0; opacity: 0; }
          to { r: 3; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
