import { Injectable } from '@angular/core';
import { Store } from '../state/store';
import { Notification, NotificationState } from './notification.types';

const initialState: NotificationState = {
  notifications: []
};

@Injectable({
  providedIn: 'root'
})
export class NotificationStore extends Store<NotificationState> {
  constructor() {
    super(initialState);
  }

  readonly notifications$ = this.select(state => state.notifications);

  addNotification(notification: Omit<Notification, 'id'>) {
    const id = crypto.randomUUID();
    const newNotification = { ...notification, id };

    this.setState({
      notifications: [...this.state.notifications, newNotification]
    });

    // Auto-dismiss if duration is provided or default to 5s for success/info
    const duration = notification.duration || (notification.type === 'error' ? 0 : 5000);
    
    if (duration > 0) {
      setTimeout(() => {
        this.dismissNotification(id);
      }, duration);
    }
  }

  dismissNotification(id: string) {
    this.setState({
      notifications: this.state.notifications.filter(n => n.id !== id)
    });
  }
}

