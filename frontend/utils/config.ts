import Constants from 'expo-constants';

const fallbackBaseUrl = 'https://api.sloms.local';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  Constants.expoConfig?.extra?.apiBaseUrl ??
  fallbackBaseUrl;

export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },
  admin: {
    dashboard: '/admin/dashboard',
  },
  client: {
    dashboard: '/client/dashboard',
  },
} as const;
