import dayjs from 'dayjs';
import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, getFirestore } from 'firebase/firestore';

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
import {
  addLabel,
  addSubtask,
  deleteLabel,
  updateSubtask,
  deleteSubtask,
  addAvailableLabel,
} from 'src/actions/kanban';

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

const StyledLabel = styled('span')(({ theme }) => ({
  ...theme.typography.caption,
  width: 100,
  flexShrink: 0,
  color: theme.vars.palette.text.secondary,
  fontWeight: theme.typography.fontWeightBold,
}));

// ----------------------------------------------------------------------

export function KanbanDetails({
  task,
  openDetails,
  onUpdateTask,
  onDeleteTask,
  onCloseDetails,
  authUser,
}) {
  const tabs = useTabs('overview');
  const db = getFirestore();

  const [priority, setPriority] = useState(task.priority);
  const [taskName, setTaskName] = useState(task.name);
  const [taskDescription, setTaskDescription] = useState(task.description);
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [labels, setLabels] = useState(task.labels || []);
  const [newLabel, setNewLabel] = useState('');
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [availableLabels, setAvailableLabels] = useState([]);
  const [isLoadingLabels, setIsLoadingLabels] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const like = useBoolean();
  const contacts = useBoolean();
  const rangePicker = useDateRangePicker(dayjs(task.due[0]), dayjs(task.due[1]));

  // Utiliser un écouteur en temps réel pour les étiquettes disponibles
  useEffect(() => {
    // console.log('Setting up labels listener');
    const labelsRef = doc(db, 'settings', 'Étiquettes');

    const unsubscribe = onSnapshot(
      labelsRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const labelsData = docSnapshot.data();
          if (Array.isArray(labelsData.labels)) {
            setAvailableLabels(labelsData.labels);
            // console.log('Available labels updated:', labelsData.labels);
          } else {
            // console.warn('Labels data is not an array:', labelsData);
            setAvailableLabels([]);
          }
        } else {
          // console.log('No labels document found');
          setAvailableLabels([]);
        }
        setIsLoadingLabels(false);
      },
      (error) => {
        // console.error('Error loading available labels:', error);
        setIsLoadingLabels(false);
      }
    );

    return () => {
      // console.log('Cleaning up labels listener');
      unsubscribe();
    };
  }, [db]); // Keep only db in the dependency array

  const filteredLabels = availableLabels.filter((label) => !labels.includes(label));
  // console.log('Task labels:', labels);
  // console.log('Available labels for selection:', filteredLabels);

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
              updatedBy: authUser?.uid,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
    [onUpdateTask, task, taskName, authUser?.uid]
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
        updatedBy: authUser?.uid,
        updatedAt: new Date().toISOString(),
      });
    },
    [onUpdateTask, task, authUser?.uid]
  );

  const handleClickSubtaskComplete = async (subtaskId) => {
    try {
      const subtask = subtasks.find((st) => st.id === subtaskId);
      if (!subtask) return;

      const updatedSubtask = await updateSubtask(task.status, task.id, subtaskId, {
        completed: !subtask.completed,
        userId: authUser?.id,
      });

      setSubtasks(subtasks.map((st) => (st.id === subtaskId ? updatedSubtask : st)));
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskName.trim()) return;

    try {
      const newSubtask = await addSubtask(task.status, task.id, {
        name: newSubtaskName.trim(),
        userId: authUser?.id,
      });

      setSubtasks([...subtasks, newSubtask]);
      setNewSubtaskName('');
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await deleteSubtask(task.status, task.id, subtaskId);
      setSubtasks(subtasks.filter((st) => st.id !== subtaskId));
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
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
        updatedBy: authUser?.id,
        updatedAt: new Date().toISOString(),
      });
    },
    [task, onUpdateTask, authUser?.id]
  );

  const handleAddLabel = useCallback(
    async (labelToAdd) => {
      const labelName = labelToAdd || newLabel.trim();
      if (labelName && !labels.includes(labelName)) {
        try {
          console.log('Adding label:', labelName);
          // Ajouter l'étiquette à la tâche
          await addLabel(task.status, task.id, labelName);

          // Ajouter l'étiquette à la liste des étiquettes disponibles si elle n'existe pas déjà
          if (!availableLabels.includes(labelName)) {
            await addAvailableLabel(labelName);
          }

          // Mettre à jour l'état local des étiquettes de la tâche
          setLabels((prevLabels) => [...prevLabels, labelName]);
          setNewLabel('');
          setIsAddingLabel(false);
        } catch (error) {
          console.error('Error adding label:', error);
        }
      }
    },
    [labels, newLabel, task.status, task.id, availableLabels]
  );

  const handleDeleteLabel = useCallback(
    async (labelToDelete) => {
      try {
        await deleteLabel(task.status, task.id, labelToDelete);
        setLabels(labels.filter((label) => label !== labelToDelete));
      } catch (error) {
        console.error('Error deleting label:', error);
      }
    },
    [labels, task.status, task.id]
  );

  const handleKeyPress = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        handleAddLabel();
      }
    },
    [handleAddLabel]
  );

  const handleReplyToComment = useCallback((comment) => {
    setReplyTo(comment);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const renderToolbar = (
    <KanbanDetailsToolbar
      liked={like.value}
      taskName={task.name}
      onLike={like.onToggle}
      onDelete={onDeleteTask}
      taskStatus={task.status}
      onCloseDetails={onCloseDetails}
      onUpdateTask={onUpdateTask}
      task={task}
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex' }}>
          <StyledLabel sx={{ height: 24, lineHeight: '24px' }}>Étiquettes</StyledLabel>

          <Box sx={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {labels.map((label) => (
              <Chip
                key={label}
                label={label}
                size="small"
                color="info"
                variant="soft"
                onDelete={() => handleDeleteLabel(label)}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, ml: 10 }}>
          {isAddingLabel ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Nouvelle étiquette"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
                sx={{ width: 200 }}
              />
              <Button
                size="small"
                variant="contained"
                onClick={() => handleAddLabel()}
                disabled={!newLabel.trim()}
              >
                Ajouter
              </Button>
              <Button
                size="small"
                color="inherit"
                onClick={() => {
                  setNewLabel('');
                  setIsAddingLabel(false);
                }}
              >
                Annuler
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Select
                size="small"
                displayEmpty
                value=""
                disabled={isLoadingLabels}
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddLabel(e.target.value);
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: { maxHeight: 240 },
                  },
                }}
                sx={{
                  width: 200,
                  '& .MuiSelect-select': {
                    color: (theme) => theme.palette.text.secondary,
                  },
                }}
              >
                <MenuItem value="" disabled>
                  {isLoadingLabels ? 'Chargement...' : 'Sélectionner une étiquette'}
                </MenuItem>
                {!isLoadingLabels &&
                  availableLabels
                    .filter((label) => !labels.includes(label))
                    .sort((a, b) => a.localeCompare(b))
                    .map((label) => (
                      <MenuItem key={label} value={label}>
                        {label}
                      </MenuItem>
                    ))}
              </Select>

              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => {
                  // console.log('Current available labels:', availableLabels);
                  // console.log('Current task labels:', labels);
                  setIsAddingLabel(true);
                }}
              >
                Nouvelle
              </Button>
            </Box>
          )}
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
                updatedBy: authUser?.id,
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
          onBlur={() => {
            if (taskDescription !== task.description) {
              onUpdateTask({
                ...task,
                description: taskDescription,
                updatedBy: authUser?.id,
                updatedAt: new Date().toISOString(),
              });
            }
          }}
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
              updatedBy: authUser?.id,
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
          {subtasks.filter((st) => st.completed).length} sur {subtasks.length}
        </Typography>

        <LinearProgress
          variant="determinate"
          value={(subtasks.filter((st) => st.completed).length / (subtasks.length || 1)) * 100}
        />
      </div>

      <FormGroup>
        {subtasks.map((subtask) => (
          <FormControlLabel
            key={subtask.id}
            control={
              <Checkbox
                disableRipple
                name={subtask.id}
                checked={subtask.completed}
                onChange={() => handleClickSubtaskComplete(subtask.id)}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">{subtask.name}</Typography>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteSubtask(subtask.id)}
                  sx={{ ml: 'auto' }}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Box>
            }
          />
        ))}
      </FormGroup>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Nouvelle sous-tâche"
          value={newSubtaskName}
          onChange={(e) => setNewSubtaskName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddSubtask();
            }
          }}
        />
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleAddSubtask}
          disabled={!newSubtaskName.trim()}
          sx={{ alignSelf: 'flex-end' }}
        >
          Ajouter une sous-tâche
        </Button>
      </Box>
    </Box>
  );

  const renderTabComments = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 200px)',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          px: 2.5,
          pb: 2,
        }}
      >
        <KanbanDetailsCommentList
          columnId={task.status}
          taskId={task.id}
          onReply={handleReplyToComment}
        />
      </Box>
      <Box
        sx={{
          flexShrink: 0,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <KanbanDetailsCommentInput
          columnId={task.status}
          taskId={task.id}
          replyTo={replyTo}
          onCancelReply={handleCancelReply}
        />
      </Box>
    </Box>
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

      <KanbanContactsDialog
        assignee={task.assignee}
        open={contacts.value}
        onClose={contacts.onFalse}
        onAssign={handleAssignUser}
      />
    </Drawer>
  );
}
