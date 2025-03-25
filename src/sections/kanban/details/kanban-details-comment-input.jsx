import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function KanbanDetailsCommentInput({ taskId }) {
  const [message, setMessage] = useState('');
  const user = useSelector((state) => state.auth.user);

  const handleChangeMessage = useCallback((event) => {
    setMessage(event.target.value);
  }, []);

  const handleSubmitComment = useCallback(async () => {
    if (!message.trim()) return;

    try {
      const comment = {
        id: crypto.randomUUID(),
        message: message.trim(),
        createdAt: new Date().toISOString(),
        createdBy: user?.uid,
        name: user?.displayName || 'Anonymous',
        avatarUrl: user?.photoURL,
      };

      // TODO: Implement comment submission to Firebase
      console.log('Comment to submit:', comment);

      setMessage('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  }, [message, user]);

  return (
    <Stack direction="row" spacing={2} sx={{ py: 3, px: 2.5 }}>
      <Avatar src={user?.photoURL} alt={user?.displayName}>
        {user?.displayName?.charAt(0).toUpperCase()}
      </Avatar>

      <Paper variant="outlined" sx={{ p: 1, flexGrow: 1, bgcolor: 'transparent' }}>
        <InputBase
          fullWidth
          multiline
          rows={2}
          value={message}
          onChange={handleChangeMessage}
          placeholder="Type a message"
          sx={{ px: 1 }}
        />

        <Stack direction="row" alignItems="center">
          <Stack direction="row" flexGrow={1}>
            <IconButton>
              <Iconify icon="solar:gallery-add-bold" />
            </IconButton>

            <IconButton>
              <Iconify icon="eva:attach-2-fill" />
            </IconButton>
          </Stack>

          <Button variant="contained" onClick={handleSubmitComment} disabled={!message.trim()}>
            Comment
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
