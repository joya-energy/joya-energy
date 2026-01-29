export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // Optional auto-dismiss duration
}

export interface NotificationState {
  notifications: Notification[];
}

