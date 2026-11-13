import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { markHabitConfirmed } from '../utils/notifications';
import { formatDate } from '../utils/date';

/** Hook điều hướng khi người dùng chạm vào thông báo trên thanh trạng thái */
export function useNotificationResponse() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const { actionIdentifier, notification } = response;
      const id = notification.request.content.data?.habitId;
      if (typeof id !== 'string' || id === 'test_reminder') return;

      if (actionIdentifier === 'CONFIRM_ACTION') {
        markHabitConfirmed(id, formatDate());
        return;
      }
      router.push(`/habit/${id}` as any);
    };

    Notifications.getLastNotificationResponseAsync().then((res) => {
      if (res) handleResponse(res);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, [router]);
}
