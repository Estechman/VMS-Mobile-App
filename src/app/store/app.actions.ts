import { createAction, props } from '@ngrx/store';

export const setAuthentication = createAction(
  '[Auth] Set Authentication',
  props<{ isAuthenticated: boolean; authSession: string; username: string }>()
);

export const setPlatformOS = createAction(
  '[Platform] Set Platform OS',
  props<{ platformOS: string }>()
);

export const setAlarmState = createAction(
  '[Platform] Set Alarm State',
  props<{ isAlarm: boolean; alarmCount: string }>()
);

export const setInitComplete = createAction(
  '[UI] Set Init Complete',
  props<{ initComplete: boolean }>()
);

export const logout = createAction('[Auth] Logout');
