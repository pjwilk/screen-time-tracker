// onedrive.js — OneDrive cloud sync via Microsoft Graph API + MSAL.js v2

const MSAL_CDN_URL = 'https://alcdn.msauth.net/browser/2.28.1/js/msal-browser.min.js';
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const ONEDRIVE_FILE_PATH = '/Apps/ScreenTimeTracker/data.json';
const SCOPES = ['Files.ReadWrite'];
const CONFIG_KEY = 'masonScreenTime_cloud';

let msalInstance = null;
let currentAccount = null;
let syncStatus = 'disconnected'; // disconnected | syncing | synced | error
let statusListeners = [];
let saveDebounceTimer = null;

// --- Sync status ---

export function getSyncStatus() {
  return syncStatus;
}

export function onSyncStatusChange(listener) {
  statusListeners.push(listener);
  return () => {
    statusListeners = statusListeners.filter(l => l !== listener);
  };
}

function setSyncStatus(newStatus) {
  syncStatus = newStatus;
  for (const fn of statusListeners) {
    fn(newStatus);
  }
}

// --- Cloud config (stored separately from app data) ---

export function getCloudConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveCloudConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

// --- MSAL loading ---

function loadMsalScript() {
  return new Promise((resolve) => {
    if (window.msal) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = MSAL_CDN_URL;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

// --- Initialization ---

export async function initialize(clientId) {
  if (!clientId) return false;

  const loaded = await loadMsalScript();
  if (!loaded || !window.msal) {
    console.error('Failed to load MSAL library');
    setSyncStatus('error');
    return false;
  }

  try {
    msalInstance = new window.msal.PublicClientApplication({
      auth: {
        clientId,
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: window.location.origin + window.location.pathname,
      },
      cache: {
        cacheLocation: 'localStorage',
      },
    });

    // Handle redirect promise (for redirect-based flows)
    const response = await msalInstance.handleRedirectPromise();
    if (response) {
      currentAccount = response.account;
    }

    // Check for existing cached session
    if (!currentAccount) {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        currentAccount = accounts[0];
      }
    }

    if (currentAccount) {
      setSyncStatus('synced');
    }

    return !!currentAccount;
  } catch (err) {
    console.error('MSAL initialization error:', err);
    setSyncStatus('error');
    return false;
  }
}

// --- Auth ---

export function isSignedIn() {
  return !!currentAccount;
}

export function getAccountInfo() {
  if (!currentAccount) return null;
  return {
    name: currentAccount.name || currentAccount.username,
    email: currentAccount.username,
  };
}

export async function signIn() {
  if (!msalInstance) return false;

  try {
    const response = await msalInstance.loginPopup({ scopes: SCOPES });
    currentAccount = response.account;
    setSyncStatus('synced');
    return true;
  } catch (err) {
    console.error('Sign-in error:', err);
    if (err.errorCode !== 'user_cancelled') {
      setSyncStatus('error');
    }
    return false;
  }
}

export async function signOut() {
  if (!msalInstance || !currentAccount) return;

  try {
    await msalInstance.logoutPopup({ account: currentAccount });
  } catch {
    // Ignore logout errors
  }

  currentAccount = null;
  setSyncStatus('disconnected');
}

// --- Token acquisition ---

async function getAccessToken() {
  if (!msalInstance || !currentAccount) return null;

  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes: SCOPES,
      account: currentAccount,
    });
    return response.accessToken;
  } catch {
    // Silent acquisition failed — try interactive
    try {
      const response = await msalInstance.acquireTokenPopup({ scopes: SCOPES });
      currentAccount = response.account;
      return response.accessToken;
    } catch (err) {
      console.error('Token acquisition failed:', err);
      setSyncStatus('error');
      return null;
    }
  }
}

// --- Graph API file operations ---

export async function loadFromCloud() {
  const token = await getAccessToken();
  if (!token) return null;

  setSyncStatus('syncing');

  try {
    const res = await fetch(
      `${GRAPH_BASE}/me/drive/root:${ONEDRIVE_FILE_PATH}:/content`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.status === 404) {
      setSyncStatus('synced');
      return null;
    }

    if (!res.ok) {
      throw new Error(`Graph API ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    setSyncStatus('synced');
    return data;
  } catch (err) {
    console.error('Cloud load error:', err);
    setSyncStatus('error');
    return null;
  }
}

export async function saveToCloud(data) {
  const token = await getAccessToken();
  if (!token) return false;

  setSyncStatus('syncing');

  try {
    const res = await fetch(
      `${GRAPH_BASE}/me/drive/root:${ONEDRIVE_FILE_PATH}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data, null, 2),
      }
    );

    if (!res.ok) {
      throw new Error(`Graph API ${res.status}: ${res.statusText}`);
    }

    setSyncStatus('synced');
    return true;
  } catch (err) {
    console.error('Cloud save error:', err);
    setSyncStatus('error');
    return false;
  }
}

// --- Debounced cloud save (called from store.js after each local save) ---

export function scheduleSaveToCloud(data) {
  if (!isSignedIn()) return;

  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    saveToCloud(data);
  }, 2000);
}
