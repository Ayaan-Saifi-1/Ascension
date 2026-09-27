'use client';

import React, { useEffect, useState } from 'react';

export default function AppLoader() {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Starting up...');
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Progress increment from 0 to 100
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const step = prev < 30 ? 4 : prev < 75 ? 3 : prev < 95 ? 2 : 1;
        const next = Math.min(prev + step, 100);

        if (next < 30) {
          setStatusText('Initializing Safety Core...');
        } else if (next < 70) {
          setStatusText('Loading AI Inference Engine...');
        } else if (next < 95) {
          setStatusText('Starting up...');
        } else {
          setStatusText('Ready');
        }

        return next;
      });
    }, 32);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const fadeTimer = setTimeout(() => {
        setFading(true);
      }, 250);

      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 750);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [progress]);

  if (!visible) return null;

  return (
    <div
      id="app-startup-loader"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#07090e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1), transform 0.45s ease',
        transform: fading ? 'scale(1.02)' : 'scale(1)',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Ambient glow in background */}
      <div
        style={{
          position: 'absolute',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(14, 165, 233, 0.16) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      {/* Ascension Logo front and center */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s ease',
          }}
        >
          <img
            src="/ascension-logo.png"
            alt="ASCENSION"
            style={{
              width: '190px',
              maxWidth: '80vw',
              height: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 26px rgba(14, 165, 233, 0.4))',
            }}
          />
        </div>

        {/* Brand Title */}
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              letterSpacing: '0.22em',
              color: '#ffffff',
              margin: 0,
              fontFamily: "'IBM Plex Sans', sans-serif",
              textTransform: 'uppercase',
            }}
          >
            Ascension
          </h1>
          <p
            style={{
              fontSize: '0.75rem',
              color: '#94a3b8',
              letterSpacing: '0.08em',
              margin: '4px 0 0 0',
              fontWeight: 500,
            }}
          >
            Safety Intelligence Platform
          </p>
        </div>

        {/* Progress Container */}
        <div
          style={{
            width: '260px',
            maxWidth: '75vw',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '10px',
          }}
        >
          {/* Track line */}
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '999px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {/* The Line Going from 0 to 100 */}
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background:
                  'linear-gradient(90deg, #0284c7 0%, #38bdf8 50%, #818cf8 100%)',
                borderRadius: '999px',
                transition: 'width 0.08s ease-out',
                boxShadow: '0 0 14px rgba(56, 189, 248, 0.8)',
              }}
            />
          </div>

          {/* Progress text and percentage */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: '#64748b',
              fontWeight: 500,
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{statusText}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: '#cbd5e1' }}>
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
