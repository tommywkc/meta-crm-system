import { toLocalISOString } from './dateFormatter';

export const backendSessionToFormState = (backendSession) => {
  const startDate = backendSession.datetime_start ? new Date(backendSession.datetime_start) : null;
  
  return {
    session_id: backendSession.session_id,
    session_name: backendSession.session_name || '',
    dates: startDate ? [startDate] : [],
    time: startDate ? backendSession.datetime_start.slice(11, 16) : '09:00',
    duration_minutes: backendSession.duration_minutes || 60,
    session_description: backendSession.session_description || backendSession.description || '',
    session_capacity: backendSession.session_capacity || backendSession.capacity || ''
  };
};

export const backendSessionsToFormState = (backendSessions) => {
  if (!Array.isArray(backendSessions)) {
    return [];
  }
  
  return backendSessions.map(backendSessionToFormState);
};

export const formSessionToBackendPayload = (formSession) => {
  const dur = formSession.duration_minutes || 60;
  const timeParts = (formSession.time || '09:00').split(':');
  const hours = parseInt(timeParts[0], 10) || 0;
  const minutes = parseInt(timeParts[1], 10) || 0;
  
  const payloads = [];
  
  (formSession.dates || []).forEach(d => {
    const dateObj = new Date(d);
    dateObj.setHours(hours, minutes, 0, 0);
    const endDate = new Date(dateObj.getTime() + dur * 60000);
    endDate.setSeconds(0, 0);
    
    const payload = {
      session_name: formSession.session_name || '',
      datetime_start: toLocalISOString(dateObj),
      datetime_end: toLocalISOString(endDate),
      session_description: formSession.session_description || '',
      session_capacity: formSession.session_capacity ? parseInt(formSession.session_capacity, 10) : null
    };
    
    if (formSession.session_id) {
      payload.session_id = formSession.session_id;
    }
    
    payloads.push(payload);
  });
  
  return payloads;
};

export const formSessionsToBackendPayload = (formSessions) => {
  if (!Array.isArray(formSessions)) {
    return [];
  }
  
  const allPayloads = [];
  formSessions.forEach(session => {
    const payloads = formSessionToBackendPayload(session);
    allPayloads.push(...payloads);
  });
  
  return allPayloads;
};

export const calculateEventDateTimes = (sessionPayloads) => {
  if (!Array.isArray(sessionPayloads) || sessionPayloads.length === 0) {
    return {
      datetime_start: null,
      datetime_end: null
    };
  }
  
  const allStartTimes = sessionPayloads.map(s => new Date(s.datetime_start));
  const datetime_start = toLocalISOString(new Date(Math.min(...allStartTimes)));
  
  const allEndTimes = sessionPayloads.map(s => new Date(s.datetime_end));
  const datetime_end = toLocalISOString(new Date(Math.max(...allEndTimes)));
  
  return {
    datetime_start,
    datetime_end
  };
};
