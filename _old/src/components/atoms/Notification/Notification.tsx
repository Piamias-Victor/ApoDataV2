// src/components/atoms/Notification/Notification.tsx
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';
type NotificationPosition = 'top-right' | 'top-center' | 'bottom-right';

interface NotificationProps {
  readonly type: NotificationType;
  readonly title?: string;
  readonly message: string;
  readonly show: boolean;
  readonly duration?: number;
  readonly position?: NotificationPosition;
  readonly closable?: boolean;
  readonly onClose: () => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: {
    bg: 'bg-success-50 border-success-200',
    text: 'text-success-800',
    icon: 'text-success-500',
  },
  error: {
    bg: 'bg-danger-50 border-danger-200',
    text: 'text-danger-800',
    icon: 'text-danger-500',
  },
  warning: {
    bg: 'bg-warning-50 border-warning-200',
    text: 'text-warning-800',
    icon: 'text-warning-500',
  },
  info: {
    bg: 'bg-primary-50 border-primary-200',
    text: 'text-primary-800',
    icon: 'text-primary-500',
  },
};

const positions = {
  'top-right': 'top-4 right-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
};

/**
 * Notification Component - Toast notifications Apple style
 * 
 * @example
 * <Notification
 *   type="success"
 *   message="Connexion réussie"
 *   show={showNotification}
 *   onClose={() => setShowNotification(false)}
 * />
 */
export const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  show,
  duration = 5000,
  position = 'top-right',
  closable = true,
  onClose,
}) => {
  const IconComponent = icons[type];
  const style = styles[type];

  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
    
    return undefined;
  }, [show, duration, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`fixed z-50 ${positions[position]} max-w-md`}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className={`
            ${style.bg} ${style.text} border rounded-lg shadow-lg p-4
            backdrop-blur-sm relative overflow-hidden
          `}>
            <div className="flex items-start space-x-3">
              <div className={`${style.icon} flex-shrink-0 mt-0.5`}>
                <IconComponent className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                {title && (
                  <h4 className="text-sm font-medium mb-1">{title}</h4>
                )}
                <p className="text-sm leading-relaxed">{message}</p>
              </div>

              {closable && (
                <button
                  onClick={onClose}
                  className={`
                    ${style.text} hover:opacity-70 flex-shrink-0
                    p-1 rounded-md transition-opacity duration-200
                  `}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};