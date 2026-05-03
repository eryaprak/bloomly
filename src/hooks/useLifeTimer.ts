import { useEffect, useState } from 'react';
import { usePlayerStore } from '@/stores/playerStore';

const LIFE_REGEN_MS = 20 * 60 * 1000; // 20 minutes

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function useLifeTimer() {
  const lives = usePlayerStore((s) => s.lives);
  const maxLives = usePlayerStore((s) => s.maxLives);
  const lastLifeTime = usePlayerStore((s) => s.lastLifeTime);
  const setLives = usePlayerStore((s) => s.setLives);
  const setLastLifeTime = usePlayerStore((s) => s.setLastLifeTime);

  const [countdown, setCountdown] = useState('');

  // On mount: restore lives based on elapsed time
  useEffect(() => {
    if (lives >= maxLives) return;
    if (lastLifeTime === 0) return;

    const now = Date.now();
    const elapsed = now - lastLifeTime;
    const livesToAdd = Math.floor(elapsed / LIFE_REGEN_MS);

    if (livesToAdd > 0) {
      const newLives = Math.min(lives + livesToAdd, maxLives);
      const usedMs = livesToAdd * LIFE_REGEN_MS;
      const newLastLifeTime = lastLifeTime + usedMs;
      setLives(newLives);
      setLastLifeTime(newLastLifeTime);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer
  useEffect(() => {
    if (lives >= maxLives) {
      setCountdown('');
      return;
    }

    const tick = () => {
      const now = Date.now();
      const elapsed = now - lastLifeTime;
      const remaining = LIFE_REGEN_MS - (elapsed % LIFE_REGEN_MS);
      setCountdown(formatCountdown(remaining));

      // Check if a new life should be granted
      if (elapsed >= LIFE_REGEN_MS) {
        const newLives = Math.min(lives + 1, maxLives);
        setLives(newLives);
        setLastLifeTime(lastLifeTime + LIFE_REGEN_MS);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lives, maxLives, lastLifeTime, setLives, setLastLifeTime]);

  return { lives, maxLives, countdown };
}
