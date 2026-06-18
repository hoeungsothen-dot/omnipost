import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import { useQueryClient } from '@tanstack/react-query';

export function useSocket() {
  const { token, workspace } = useAuthStore();
  const socketRef = useRef(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (!token || !workspace?._id) return;
    const socket = io(window.location.origin, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;
    socket.emit('join:workspace', workspace._id);
    socket.on('content:created', () => qc.invalidateQueries(['content']));
    socket.on('content:updated', () => qc.invalidateQueries(['content']));
    socket.on('content:publishing', () => qc.invalidateQueries(['content']));
    socket.on('notification:new', () => qc.invalidateQueries(['notifications']));
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [token, workspace?._id]);

  return socketRef;
}

export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });
  const setValue = (value) => {
    try {
      const val = value instanceof Function ? value(stored) : value;
      setStored(val);
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { console.error(e); }
  };
  return [stored, setValue];
}

export function usePlatformPublishStatus(contentId, enabled = true) {
  const [status, setStatus] = useState(null);
  const intervalRef = useRef(null);
  useEffect(() => {
    if (!enabled || !contentId) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/content/${contentId}`, {
          headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
        });
        const data = await res.json();
        setStatus(data);
        if (data.status !== 'publishing') clearInterval(intervalRef.current);
      } catch { clearInterval(intervalRef.current); }
    };
    poll();
    intervalRef.current = setInterval(poll, 3000);
    return () => clearInterval(intervalRef.current);
  }, [contentId, enabled]);
  return status;
}
