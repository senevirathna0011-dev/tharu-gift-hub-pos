'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseIdleTimerOptions {
  timeoutMs?: number; // Inactivity timeout in milliseconds (default: 2 minutes = 120,000 ms)
  onIdle?: () => void;
  onActive?: () => void;
  enabled?: boolean;
}

export function useIdleTimer({
  timeoutMs = 120000, // 2 minutes default
  onIdle,
  onActive,
  enabled = true,
}: UseIdleTimerOptions = {}) {
  const [isIdle, setIsIdle] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isIdleRef = useRef(false);

  const handleUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (isIdleRef.current) {
      isIdleRef.current = false;
      setIsIdle(false);
      onActive?.();
    }
  }, [onActive]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    isIdleRef.current = false;
    setIsIdle(false);
  }, []);

  const triggerIdle = useCallback(() => {
    isIdleRef.current = true;
    setIsIdle(true);
    onIdle?.();
  }, [onIdle]);

  useEffect(() => {
    if (!enabled) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    lastActivityRef.current = Date.now();

    // Throttled activity listener
    let throttleTimeout: NodeJS.Timeout | null = null;
    const onEvent = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          // If already idle, don't automatically unlock via mouse movement without credentials
          if (!isIdleRef.current) {
            lastActivityRef.current = Date.now();
          }
          throttleTimeout = null;
        }, 500);
      }
    };

    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'pointerdown',
      'scroll',
      'wheel',
    ];

    events.forEach((evt) => {
      window.addEventListener(evt, onEvent, { passive: true });
    });

    // Check inactivity every 2 seconds
    timerIntervalRef.current = setInterval(() => {
      if (!isIdleRef.current) {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= timeoutMs) {
          isIdleRef.current = true;
          setIsIdle(true);
          onIdle?.();
        }
      }
    }, 2000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (throttleTimeout) clearTimeout(throttleTimeout);
      events.forEach((evt) => {
        window.removeEventListener(evt, onEvent);
      });
    };
  }, [enabled, timeoutMs, onIdle]);

  return {
    isIdle,
    resetTimer,
    triggerIdle,
    lastActivity: lastActivityRef.current,
  };
}
