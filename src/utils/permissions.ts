import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Request notification permissions from the user
 * @returns Promise<boolean> - true if permission granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Only ask if permissions have not already been determined
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Failed to get push notification permissions');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
}

/**
 * Check if notification permissions are granted
 * @returns Promise<boolean> - true if permission granted, false otherwise
 */
export async function checkNotificationPermissions(): Promise<boolean> {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Error checking notification permissions:', error);
        return false;
    }
}

/**
 * Configure notification behavior
 */
export function configureNotifications() {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}
