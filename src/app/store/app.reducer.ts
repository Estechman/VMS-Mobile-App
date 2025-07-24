import { createReducer, on } from '@ngrx/store';
import { AppState, initialAuthState, initialPlatformState, initialUIState } from './app.state';
import * as AppActions from './app.actions';

const initialState: AppState = {
  auth: initialAuthState,
  platform: initialPlatformState,
  ui: initialUIState
};

export const appReducer = createReducer(
  initialState,
  on(AppActions.setAuthentication, (state, { isAuthenticated, authSession, username }) => ({
    ...state,
    auth: {
      ...state.auth,
      isAuthenticated,
      authSession,
      username
    }
  })),
  on(AppActions.setPlatformOS, (state, { platformOS }) => ({
    ...state,
    platform: {
      ...state.platform,
      platformOS
    }
  })),
  on(AppActions.setAlarmState, (state, { isAlarm, alarmCount }) => ({
    ...state,
    platform: {
      ...state.platform,
      isAlarm,
      alarmCount
    }
  })),
  on(AppActions.setInitComplete, (state, { initComplete }) => ({
    ...state,
    ui: {
      ...state.ui,
      initComplete
    }
  }))
);
