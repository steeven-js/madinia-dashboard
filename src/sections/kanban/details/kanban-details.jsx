import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTabs } from 'src/hooks/use-tabs';
import { useBoolean } from 'src/hooks/use-boolean';

import { varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomTabs } from 'src/components/custom-tabs';
import { useDateRangePicker, CustomDateRangePicker } from 'src/components/custom-date-range-picker';

import { KanbanDetailsToolbar } from './kanban-details-toolbar';
import { KanbanInputName } from '../components/kanban-input-name';
import { KanbanDetailsPriority } from './kanban-details-priority';
import { KanbanDetailsAttachments } from './kanban-details-attachments';
import { KanbanDetailsCommentList } from './kanban-details-comment-list';
import { KanbanDetailsCommentInput } from './kanban-details-comment-input';
import { KanbanContactsDialog } from '../components/kanban-contacts-dialog';

// ----------------------------------------------------------------------

const SUBTASKS = [
  'Compléter la proposition de projet',
  'Effectuer une étude de marché',
  "Concevoir les maquettes d'interface utilisateur",
  "Développer l'API backend",
  "Implémenter le système d'authentification",
];

const StyledLabel = styled('span')(({ theme }) => ({
  ...theme.typography.caption,
  width: 100,
  flexShrink: 0,
  color: theme.vars.palette.text.secondary,
  fontWeight: theme.typography.fontWeightBold,
}));

// ----------------------------------------------------------------------

export function KanbanDetails({ task, openDetails, onUpdateTask, onDeleteTask, onCloseDetails }) {
  const tabs = useTabs('overview');
  const user = useSelector((state) => state.auth.user);

  const [priority, setPriority] = useState(task.priority);
  const [taskName, setTaskName] = useState(task.name);
  const [taskDescription, setTaskDescription] = useState(task.description);
  const [subtaskCompleted, setSubtaskCompleted] = useState(SUBTASKS.slice(0, 2));
  const [labels, setLabels] = useState(task.labels || []);
  const [availableLabels] = useState([
    'Urgent',
    'Important',
    'En attente',
    'En cours',
    'Terminé',
    'Bug',
    'Feature',
    'Documentation',
  ]);
  const like = useBoolean();
  const contacts = useBoolean();
  const rangePicker = useDateRangePicker(dayjs(task.due[0]), dayjs(task.due[1]));

  const handleChangeTaskName = useCallback((event) => {
    setTaskName(event.target.value);
  }, []);

  const handleUpdateTask = useCallback(
    (event) => {
      try {
        if (event.key === 'Enter') {
          if (taskName) {
            onUpdateTask({
              ...task,
              name: taskName,
              updatedBy: user?.uid,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
    [onUpdateTask, task, taskName, user?.uid]
  );

  const handleChangeTaskDescription = useCallback((event) => {
    setTaskDescription(event.target.value);
  }, []);

  const handleChangePriority = useCallback(
    (newValue) => {
      setPriority(newValue);
      onUpdateTask({
        ...task,
        priority: newValue,
        updatedBy: user?.uid,
        updatedAt: new Date().toISOString(),
      });
    },
    [onUpdateTask, task, user?.uid]
  );

  const handleClickSubtaskComplete = (taskId) => {
    const selected = subtaskCompleted.includes(taskId)
      ? subtaskCompleted.filter((value) => value !== taskId)
      : [...subtaskCompleted, taskId];

    setSubtaskCompleted(selected);
  };

  const handleAssignUser = useCallback(
    (selectedUser) => {
      const isAlreadyAssigned = task.assignee.some(
        (assignedUser) => assignedUser.id === selectedUser.id
      );

      const updatedAssignee = isAlreadyAssigned
        ? task.assignee.filter((assignedUser) => assignedUser.id !== selectedUser.id)
        : [...task.assignee, selectedUser];

      onUpdateTask({
        ...task,
        assignee: updatedAssignee,
        updatedBy: user?.id,
        updatedAt: new Date().toISOString(),
      });
    },
    [task, onUpdateTask, user?.id]
  );

  const handleChangeLabels = useCallback(
    (event) => {
      const newLabels = event.target.value;
      setLabels(newLabels);
      onUpdateTask({
        ...task,
        labels: newLabels,
        updatedBy: user?.id,
        updatedAt: new Date().toISOString(),
      });
    },
    [onUpdateTask, task, user?.id]
  );

  const renderToolbar = (
    <KanbanDetailsToolbar
      liked={like.value}
      taskName={task.name}
      onLike={like.onToggle}
      onDelete={onDeleteTask}
      taskStatus={task.status}
      onCloseDetails={onCloseDetails}
    />
  );

  const renderTabs = (
    <CustomTabs
      value={tabs.value}
      onChange={tabs.onChange}
      variant="fullWidth"
      slotProps={{ tab: { px: 0 } }}
    >
      {[
        { value: 'overview', label: 'Aperçu' },
        { value: 'subTasks', label: 'Sous-tâches' },
        { value: 'comments', label: `Commentaires (${task.comments.length})` },
      ].map((tab) => (
        <Tab key={tab.value} value={tab.value} label={tab.label} />
      ))}
    </CustomTabs>
  );

  const renderTabOverview = (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      {/* Task name */}
      <KanbanInputName
        placeholder="Nom de la tâche"
        value={taskName}
        onChange={handleChangeTaskName}
        onKeyUp={handleUpdateTask}
        inputProps={{ id: `input-task-${taskName}` }}
      />

      {/* Reporter */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <StyledLabel>Rapporteur</StyledLabel>
        <Avatar alt={task.reporter?.name} src={task.reporter?.avatarUrl}>
          {task.reporter?.name?.charAt(0).toUpperCase()}
        </Avatar>
        <Typography variant="body2" sx={{ ml: 1 }}>
          {task.reporter?.name || 'Anonymous'}
        </Typography>
      </Box>

      {/* Assignee */}
      <Box sx={{ display: 'flex' }}>
        <StyledLabel sx={{ height: 40, lineHeight: '40px' }}>Assigné à</StyledLabel>

        <Box sx={{ gap: 1, display: 'flex', flexWrap: 'wrap' }}>
          {task.assignee.map((assignee) => (
            <Avatar key={assignee.id} alt={assignee.name} src={assignee.avatarUrl} />
          ))}

          <Tooltip title="Ajouter un assigné">
            <IconButton
              onClick={contacts.onTrue}
              sx={{
                bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
              }}
            >
              <Iconify icon="mingcute:add-line" />
            </IconButton>
          </Tooltip>

          <KanbanContactsDialog
            assignee={task.assignee}
            open={contacts.value}
            onClose={contacts.onFalse}
            onAssign={handleAssignUser}
          />
        </Box>
      </Box>

      {/* Label */}
      <Box sx={{ display: 'flex' }}>
        <StyledLabel sx={{ height: 24, lineHeight: '24px' }}>Étiquettes</StyledLabel>

        <Box sx={{ flex: 1 }}>
          <Select
            multiple
            value={labels}
            onChange={handleChangeLabels}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" color="info" variant="soft" />
                ))}
              </Box>
            )}
            sx={{ minWidth: 200 }}
          >
            {availableLabels.map((label) => (
              <MenuItem key={label} value={label}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>

      {/* Due date */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <StyledLabel> Date d&apos;échéance </StyledLabel>

        {rangePicker.selected ? (
          <Button size="small" onClick={rangePicker.onOpen}>
            {rangePicker.shortLabel}
          </Button>
        ) : (
          <Tooltip title="Ajouter une date d'échéance">
            <IconButton
              onClick={rangePicker.onOpen}
              sx={{
                bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
              }}
            >
              <Iconify icon="mingcute:add-line" />
            </IconButton>
          </Tooltip>
        )}

        <CustomDateRangePicker
          variant="calendar"
          title="Choisir la date d'échéance"
          startDate={rangePicker.startDate}
          endDate={rangePicker.endDate}
          onChangeStartDate={rangePicker.onChangeStartDate}
          onChangeEndDate={rangePicker.onChangeEndDate}
          open={rangePicker.open}
          onClose={() => {
            // Mise à jour de la tâche avec les nouvelles dates sans conversion de fuseau horaire
            if (rangePicker.startDate && rangePicker.endDate && !rangePicker.error) {
              onUpdateTask({
                ...task,
                due: [
                  dayjs(rangePicker.startDate).format('YYYY-MM-DDTHH:mm:ss'),
                  dayjs(rangePicker.endDate).format('YYYY-MM-DDTHH:mm:ss'),
                ],
                updatedBy: user?.id,
                updatedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
              });
            }
            rangePicker.onClose();
          }}
          selected={rangePicker.selected}
          error={rangePicker.error}
        />
      </Box>

      {/* Priority */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <StyledLabel>Priorité</StyledLabel>
        <KanbanDetailsPriority priority={priority} onChangePriority={handleChangePriority} />
      </Box>

      {/* Description */}
      <Box sx={{ display: 'flex' }}>
        <StyledLabel> Description </StyledLabel>
        <TextField
          fullWidth
          multiline
          size="small"
          minRows={4}
          value={taskDescription}
          onChange={handleChangeTaskDescription}
          InputProps={{ sx: { typography: 'body2' } }}
        />
      </Box>

      {/* Attachments */}
      <Box sx={{ display: 'flex' }}>
        <StyledLabel>Pièces jointes</StyledLabel>
        <KanbanDetailsAttachments
          attachments={task.attachments}
          taskId={task.id}
          onUpdateAttachments={(newAttachments) => {
            onUpdateTask({
              ...task,
              attachments: newAttachments,
              updatedBy: user?.id,
              updatedAt: new Date().toISOString(),
            });
          }}
        />
      </Box>
    </Box>
  );

  const renderTabSubtasks = (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <div>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {subtaskCompleted.length} sur {SUBTASKS.length}
        </Typography>

        <LinearProgress
          variant="determinate"
          value={(subtaskCompleted.length / SUBTASKS.length) * 100}
        />
      </div>

      <FormGroup>
        {SUBTASKS.map((taskItem) => (
          <FormControlLabel
            key={taskItem}
            control={
              <Checkbox
                disableRipple
                name={taskItem}
                checked={subtaskCompleted.includes(taskItem)}
              />
            }
            label={taskItem}
            onChange={() => handleClickSubtaskComplete(taskItem)}
          />
        ))}
      </FormGroup>

      <Button
        variant="outlined"
        startIcon={<Iconify icon="mingcute:add-line" />}
        sx={{ alignSelf: 'flex-start' }}
      >
        Sous-tâche
      </Button>
    </Box>
  );

  const renderTabComments = (
    <>{!!task.comments.length && <KanbanDetailsCommentList comments={task.comments} />}</>
  );

  return (
    <Drawer
      open={openDetails}
      onClose={onCloseDetails}
      anchor="right"
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{ sx: { width: { xs: 1, sm: 480 } } }}
    >
      {renderToolbar}

      {renderTabs}

      <Scrollbar fillContent sx={{ py: 3, px: 2.5 }}>
        {tabs.value === 'overview' && renderTabOverview}
        {tabs.value === 'subTasks' && renderTabSubtasks}
        {tabs.value === 'comments' && renderTabComments}
      </Scrollbar>

      {tabs.value === 'comments' && <KanbanDetailsCommentInput taskId={task.id} />}

      <KanbanContactsDialog
        assignee={task.assignee}
        open={contacts.value}
        onClose={contacts.onFalse}
        onAssign={handleAssignUser}
      />
    </Drawer>
  );
}
