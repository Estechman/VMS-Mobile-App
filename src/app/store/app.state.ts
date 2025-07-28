export interface AuthState {
  isAuthenticated: boolean;
  authSession: string;
  username: string;
  serverName: string;
  apiVersion: string;
}

export interface PlatformState {
  platformOS: string;
  isAlarm: boolean;
  alarmCount: string;
  isBackground: boolean;
}

export interface UIState {
  zmPopup: any;
  modalRand: number;
  initComplete: boolean;
}

export interface AppState {
  auth: AuthState;
  platform: PlatformState;
  ui: UIState;
}

export interface RootState {
  app: AppState;
}

export const initialAuthState: AuthState = {
  isAuthenticated: false,
  authSession: '',
  username: '',
  serverName: '',
  apiVersion: ''
};

export const initialPlatformState: PlatformState = {
  platformOS: 'unknown',
  isAlarm: false,
  alarmCount: '0',
  isBackground: false
};

export const initialUIState: UIState = {
  zmPopup: null,
  modalRand: 0,
  initComplete: false
};
