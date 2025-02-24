import { paths } from 'src/routes/paths';

import packageJson from '../package.json';

// ----------------------------------------------------------------------

export const CONFIG = {
  name: 'Madin.IA Admin',
  apiUrl: import.meta.env.VITE_API_URL_PROD || '',
  serverUrl: import.meta.env.VITE_SERVER_URL ?? '',
  assetsDir: import.meta.env.VITE_ASSET_URL ?? '',
  basePath: import.meta.env.VITE_BASE_PATH ?? '',
  sitePath: import.meta.env.VITE_SITE_URL ?? '',
  maintenance: import.meta.env.VITE_MAINTENANCE ?? false,
  version: packageJson.version,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_BEARER_TOKEN ?? ''}`,
  },
  /**
   * Auth
   * @method jwt | amplify | firebase | supabase | auth0
   */
  auth: {
    method: 'firebase',
    skip: false,
    redirectPath: paths.dashboard.root,
  },
  /**
   * Mapbox
   */
  mapboxApiKey: import.meta.env.VITE_MAPBOX_API_KEY ?? '',
  /**
   * Firebase
   */
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: import.meta.env.VITE_FIREBASE_APPID ?? '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? '',
  },
  /**
   * Amplify
   */
  amplify: {
    userPoolId: import.meta.env.VITE_AWS_AMPLIFY_USER_POOL_ID ?? '',
    userPoolWebClientId: import.meta.env.VITE_AWS_AMPLIFY_USER_POOL_WEB_CLIENT_ID ?? '',
    region: import.meta.env.VITE_AWS_AMPLIFY_REGION ?? '',
  },
  /**
   * Auth0
   */
  auth0: {
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID ?? '',
    domain: import.meta.env.VITE_AUTH0_DOMAIN ?? '',
    callbackUrl: import.meta.env.VITE_AUTH0_CALLBACK_URL ?? '',
  },
  /**
   * Supabase
   */
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL ?? '',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  },
  /**
   * Roles
   */
  roles: {
    super_admin: {
      name: 'super_admin',
      level: 4,
      permissions: ['all']
    },
    dev: {
      name: 'dev',
      level: 3,
      permissions: ['all']
    },
    admin: {
      name: 'admin',
      level: 2,
      permissions: ['manage_users', 'manage_content', 'view_analytics']
    },
    user: {
      name: 'user',
      level: 1,
      permissions: ['view_content']
    }
  },
};

export const ENDPOINTS = {
  API_EVENT_URL: `${CONFIG.apiUrl}/api/events`,
  API_EVENT_ORDER_URL: `${CONFIG.apiUrl}/api/event-orders`,
  API_STRIPE_EVENT_URL: `${CONFIG.apiUrl}/api/stripe`,
};
