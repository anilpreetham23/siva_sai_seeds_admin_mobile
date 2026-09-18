import { LocalNotifications } from '@capacitor/local-notifications';
import { isNative } from './index';
import toast from 'react-hot-toast';

export const platformNotifications = {
  /**
   * Request system notification permissions
   */
  async requestPermissions() {
    if (isNative) {
      try {
        return await LocalNotifications.requestPermissions();
      } catch (err) {
        console.warn('[Notifications] requestPermissions error:', err);
      }
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      return { display: perm };
    }
    return { display: 'granted' };
  },

  /**
   * Trigger or schedule a local notification
   */
  async notify({ id = Date.now(), title, body, scheduleAt = null, data = {} }) {
    // Show in-app banner toast always
    toast((t) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-bold text-xs text-agro-forest">{title}</span>
        <span className="text-xs text-gray-600">{body}</span>
      </div>
    ), { duration: 4000 });

    if (isNative) {
      try {
        const notifOptions = {
          notifications: [
            {
              id: typeof id === 'number' ? id : Math.floor(Math.random() * 100000),
              title,
              body,
              schedule: scheduleAt ? { at: new Date(scheduleAt) } : undefined,
              extra: data,
              smallIcon: 'ic_stat_icon_config_sample',
              iconColor: '#2E7D5B',
            },
          ],
        };
        await LocalNotifications.schedule(notifOptions);
      } catch (err) {
        console.warn('[Notifications] LocalNotifications.schedule error:', err);
      }
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/logo-icon.jpeg' });
      } catch (e) {
        // Notification constructor may throw on mobile browsers
      }
    }
  }
};

export default platformNotifications;
