import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

// voice message player inside a balloon
interface AudioPlayerProps {
  src: string
  theme: string
}

export function AudioPlayer({ src, theme }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [currentTime, setCurrent] = useState<number>(0)
  const [error, setError] = useState<boolean>(false)

  // Исправление: Инициализируем duration, если метаданные уже упали в кэш браузера
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    setError(false) // сбрасываем ошибку при смене источника

    const onLoaded = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    const onTime = () => {
      setCurrent(audio.currentTime)
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
    }

    const onEnded = () => {
      setPlaying(false)
      setProgress(0)
      setCurrent(0)
    }

    const onError = (e: any) => {
      console.error("Audio element error details:", audio.error)
      setError(true)
    }

    // Если аудио уже загрузилось (для быстрых Base64 строк)
    if (audio.readyState >= 1 && audio.duration) {
      setDuration(audio.duration)
    }

    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [src])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      // Перезапрашиваем duration на случай, если loadedmetadata проспал
      if (!duration && audio.duration) {
        setDuration(audio.duration)
      }
      
      audio.play()
        .then(() => setPlaying(true))
        .catch((err) => {
          console.error("Playback failed:", err)
          setError(true)
        })
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    // Если duration равен 0, но в самом аудио-элементе он есть — подставляем его
    const actualDuration = duration || audio?.duration
    if (!audio || !actualDuration || isNaN(actualDuration)) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, x / rect.width))
    audio.currentTime = ratio * actualDuration
  }

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const dark = theme === 'dark'
  const fg = dark ? '#fff' : '#111'
  const track = dark ? '#555' : '#ccc'
  const fill = 'var(--accent)'

  if (error) {
    return (
      <div style={{
        fontFamily: "'AnimeAce', sans-serif",
        fontSize: '10px', color: 'var(--accent)', opacity: 0.9,
        padding: '4px 0',
        display: 'flex', flexDirection: 'column', gap: '4px'
      }}>
        <span>⚠️ Ошибка проигрывания ГС</span>
        <span style={{ fontSize: '8px', opacity: 0.6 }}>Не поддерживаемый кодек или пустой файл</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '180px' }}>
      {/* Добавили preload="auto" для Base64 */}
      <audio ref={audioRef} src={src} preload="auto" crossOrigin="anonymous" />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          style={{
            width: '28px', height: '28px',
            flexShrink: 0,
            background: fill,
            border: `2px solid ${fg}`,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', color: '#fff',
            boxShadow: `2px 2px 0 ${fg}`,
          }}
        >
          {playing ? '⏸' : '▶'}
        </motion.button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            onClick={handleSeek}
            style={{
              width: '100%', height: '6px', // Чуть толще, чтобы кликать было удобнее
              background: track,
              cursor: 'pointer',
              position: 'relative',
              border: `1px solid ${fg}`,
            }}
          >
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: fill,
              transition: 'width 0.1s linear',
            }} />
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: "'AnimeAce', sans-serif",
            fontSize: '9px', color: fg, opacity: 0.6,
          }}>
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration || audioRef.current?.duration || 0)}</span>
          </div>
        </div>
      </div>

      <div style={{
        fontFamily: "'AnimeAce', sans-serif",
        fontSize: '9px', color: fg, opacity: 0.4,
        letterSpacing: '1px',
        textAlign: 'right',
      }}>
        🎤 VOICE MSG
      </div>
    </div>
  )
}
