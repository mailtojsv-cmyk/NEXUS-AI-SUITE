'use client';

import { useStore } from '@/app/lib/store';
import { useEffect } from 'react';

export default function Notifications() {
  const { notifications, removeNotification } = useStore();

  useEffect(() => {
    // Auto-remove notifications after 5 seconds
    notifications.forEach((notif) => {
      setTimeout(() => {
        removeNotification(notif.id);
      }, 5000);
    });
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-md">
      {notifications.map((notif) => (
        <div key={notif.id} className={`toast toast-${notif.type}`}>
          <div className="text-2xl">
            {notif.type === 'success' && '✅'}
            {notif.type === 'error' && '❌'}
            {notif.type === 'info' && 'ℹ️'}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">{notif.message}</div>
          </div>
          <button
            onClick={() => removeNotification(notif.id)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
