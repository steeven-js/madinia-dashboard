import { useSelector } from 'react-redux';
import { useMemo, useState, useCallback } from 'react';

import Paper from '@mui/material/Paper';
import FormHelperText from '@mui/material/FormHelperText';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import InputBase, { inputBaseClasses } from '@mui/material/InputBase';

// ----------------------------------------------------------------------

export function KanbanTaskAdd({ status, openAddTask, onAddTask, onCloseAddTask }) {
  const [taskName, setTaskName] = useState('');
  const user = useSelector((state) => state.auth.user);

  const defaultTask = useMemo(
    () => ({
      id: crypto.randomUUID(),
      status,
      name: taskName.trim() || 'Untitled',
      priority: 'medium',
      attachments: [],
      labels: [],
      comments: [],
      assignee: [],
      due: [new Date().toISOString(), new Date(Date.now() + 86400000).toISOString()],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user?.id || null,
      updatedBy: user?.id || null,
      reporter: {
        id: user?.id || null,
        name: user?.displayName || `${user?.firstName} ${user?.lastName}` || 'Anonymous',
        avatarUrl: user?.avatarUrl || null,
        email: user?.email || null,
        role: user?.role || null,
        roleLevel: user?.roleLevel || 0,
        isVerified: user?.isVerified || false,
      },
      description: '',
    }),
    [status, taskName, user]
  );

  const handleChangeName = useCallback((event) => {
    setTaskName(event.target.value);
  }, []);

  const handleKeyUpAddTask = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        onAddTask(defaultTask);
        setTaskName('');
      }
    },
    [defaultTask, onAddTask]
  );

  const handleCancel = useCallback(() => {
    setTaskName('');
    onCloseAddTask();
  }, [onCloseAddTask]);

  if (!openAddTask) {
    return null;
  }

  return (
    <ClickAwayListener onClickAway={handleCancel}>
      <div>
        <Paper
          sx={{
            borderRadius: 1.5,
            bgcolor: 'background.default',
            boxShadow: (theme) => theme.customShadows.z1,
          }}
        >
          <InputBase
            autoFocus
            fullWidth
            placeholder="Untitled"
            value={taskName}
            onChange={handleChangeName}
            onKeyUp={handleKeyUpAddTask}
            sx={{
              px: 2,
              height: 56,
              [`& .${inputBaseClasses.input}`]: { p: 0, typography: 'subtitle2' },
            }}
          />
        </Paper>

        <FormHelperText sx={{ mx: 1 }}>Press Enter to create the task.</FormHelperText>
      </div>
    </ClickAwayListener>
  );
}
