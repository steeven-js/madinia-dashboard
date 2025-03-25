import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useRef, useState, useCallback } from 'react';

import { useResponsive } from 'src/hooks/use-responsive';

// Ajouter les plugins dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

// ----------------------------------------------------------------------

export function useCalendar() {
  const calendarRef = useRef(null);

  const calendarEl = calendarRef.current;

  const smUp = useResponsive('up', 'sm');

  const userTimezone = dayjs.tz.guess();

  const [date, setDate] = useState(new Date());

  const [openForm, setOpenForm] = useState(false);

  const [selectEventId, setSelectEventId] = useState('');

  const [selectedRange, setSelectedRange] = useState(null);

  const [view, setView] = useState(smUp ? 'dayGridMonth' : 'listWeek');

  const onOpenForm = useCallback(() => {
    setOpenForm(true);
  }, []);

  const onCloseForm = useCallback(() => {
    setOpenForm(false);
    setSelectedRange(null);
    setSelectEventId('');
  }, []);

  const onInitialView = useCallback(() => {
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      const newView = smUp ? 'dayGridMonth' : 'listWeek';
      calendarApi.changeView(newView);
      setView(newView);
    }
  }, [calendarEl, smUp]);

  const onChangeView = useCallback(
    (newView) => {
      if (calendarEl) {
        const calendarApi = calendarEl.getApi();

        calendarApi.changeView(newView);
        setView(newView);
      }
    },
    [calendarEl]
  );

  const onDateToday = useCallback(() => {
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.today();
      setDate(calendarApi.getDate());
    }
  }, [calendarEl]);

  const onDatePrev = useCallback(() => {
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.prev();
      setDate(calendarApi.getDate());
    }
  }, [calendarEl]);

  const onDateNext = useCallback(() => {
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.next();
      setDate(calendarApi.getDate());
    }
  }, [calendarEl]);

  const onSelectRange = useCallback(
    (arg) => {
      if (calendarEl) {
        const calendarApi = calendarEl.getApi();

        calendarApi.unselect();
      }

      onOpenForm();
      setSelectedRange({ start: arg.startStr, end: arg.endStr });
    },
    [calendarEl, onOpenForm]
  );

  const onClickEvent = useCallback(
    (arg) => {
      const { event } = arg;

      onOpenForm();
      setSelectEventId(event.id);
    },
    [onOpenForm]
  );

  const onDropEvent = useCallback((arg, updateEvent) => {
    const { event } = arg;

    const eventData = {
      id: event.id,
      allDay: event.allDay,
      start: event.startStr ? dayjs(event.startStr).format() : undefined,
      end: event.endStr ? dayjs(event.endStr).format() : undefined,
      userId: event.extendedProps.userId || '',
      userDisplayName: event.extendedProps.userDisplayName || 'Anonymous',
      photoURL: event.extendedProps.photoURL || '',
      userEmail: event.extendedProps.userEmail || '',
      createdAt: event.extendedProps.createdAt || Date.now(),
      title: event.title,
      description: event.extendedProps.description || '',
      color: event.backgroundColor || event.extendedProps.color || '#00AB55',
    };

    const cleanedData = Object.fromEntries(
      Object.entries(eventData).filter(([_, value]) => value !== undefined)
    );

    updateEvent(cleanedData);
  }, []);

  const onResizeEvent = useCallback((arg, updateEvent) => {
    const { event } = arg;

    const eventData = {
      id: event.id,
      allDay: event.allDay,
      start: event.startStr ? dayjs(event.startStr).format() : undefined,
      end: event.endStr ? dayjs(event.endStr).format() : undefined,
      userId: event.extendedProps.userId || '',
      userDisplayName: event.extendedProps.userDisplayName || 'Anonymous',
      photoURL: event.extendedProps.photoURL || '',
      userEmail: event.extendedProps.userEmail || '',
      createdAt: event.extendedProps.createdAt || Date.now(),
      title: event.title,
      description: event.extendedProps.description || '',
      color: event.backgroundColor || event.extendedProps.color || '#00AB55',
    };

    const cleanedData = Object.fromEntries(
      Object.entries(eventData).filter(([_, value]) => value !== undefined)
    );

    updateEvent(cleanedData);
  }, []);

  const onClickEventInFilters = useCallback(
    (eventId) => {
      if (eventId) {
        onOpenForm();
        setSelectEventId(eventId);
      }
    },
    [onOpenForm]
  );

  return {
    calendarRef,
    //
    view,
    date,
    //
    onDatePrev,
    onDateNext,
    onDateToday,
    onDropEvent,
    onClickEvent,
    onChangeView,
    onSelectRange,
    onResizeEvent,
    onInitialView,
    //
    openForm,
    onOpenForm,
    onCloseForm,
    //
    selectEventId,
    selectedRange,
    //
    onClickEventInFilters,
  };
}
