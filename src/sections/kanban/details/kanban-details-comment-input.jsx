import { useSelector } from 'react-redux';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';

import { addComment } from 'src/actions/kanban';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function KanbanDetailsCommentInput({ columnId, taskId }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const authUser = useSelector((state) => state.auth.user);

  const handleChangeMessage = useCallback((event) => {
    setMessage(event.target.value);
  }, []);

  const handleSubmitComment = useCallback(async () => {
    if (!message.trim() || !authUser) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        message: message.trim(),
        messageType: 'text',
        name: authUser.displayName || `${authUser.firstName} ${authUser.lastName}`,
        avatarUrl: authUser.avatarUrl || '',
        userId: authUser.id,
        createdBy: authUser.id,
        updatedBy: authUser.id,
        email: authUser.email,
        role: authUser.role,
        roleLevel: authUser.roleLevel,
      };

      await addComment(columnId, taskId, commentData);
      setMessage('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [message, authUser, columnId, taskId]);

  if (!authUser) {
    return null;
  }

  return (
    <Box
      sx={{
        py: 3,
        gap: 2,
        px: 2.5,
        display: 'flex',
      }}
    >
      <Avatar src={authUser.avatarUrl} alt={authUser.displayName} sx={{ width: 40, height: 40 }}>
        {authUser.displayName?.charAt(0) || authUser.firstName?.charAt(0) || 'U'}
      </Avatar>

      <Paper variant="outlined" sx={{ p: 1, flexGrow: 1, bgcolor: 'transparent' }}>
        <InputBase
          fullWidth
          multiline
          rows={2}
          value={message}
          onChange={handleChangeMessage}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmitComment();
            }
          }}
          placeholder="Écrire un commentaire..."
          disabled={isSubmitting}
          sx={{ px: 1 }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1, display: 'flex' }}>
            <IconButton disabled={isSubmitting}>
              <Iconify icon="solar:gallery-add-bold" />
            </IconButton>

            <IconButton disabled={isSubmitting}>
              <Iconify icon="eva:attach-2-fill" />
            </IconButton>
          </Box>

          <Button
            variant="contained"
            onClick={handleSubmitComment}
            disabled={!message.trim() || isSubmitting}
          >
            Commenter
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
