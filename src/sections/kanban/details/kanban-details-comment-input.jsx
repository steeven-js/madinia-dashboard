import { useSelector } from 'react-redux';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { addComment, replyToComment, uploadCommentFile } from 'src/actions/kanban';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function KanbanDetailsCommentInput({ columnId, taskId, replyTo, onCancelReply }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const authUser = useSelector((state) => state.auth.user);

  const handleChangeMessage = useCallback((event) => {
    setMessage(event.target.value);
  }, []);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(0);
    }
  }, []);

  const handleSubmitComment = useCallback(async () => {
    if ((!message.trim() && !selectedFile) || !authUser) return;

    setIsSubmitting(true);
    try {
      if (selectedFile) {
        // Upload file
        await uploadCommentFile(columnId, taskId, selectedFile, authUser);
        setSelectedFile(null);
        setUploadProgress(0);
      }

      if (message.trim()) {
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

        if (replyTo) {
          await replyToComment(columnId, taskId, replyTo.id, commentData);
        } else {
          await addComment(columnId, taskId, commentData);
        }
      }

      setMessage('');
      if (replyTo) {
        onCancelReply();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [message, selectedFile, authUser, columnId, taskId, replyTo, onCancelReply]);

  // Focus l'input quand on commence à répondre
  useEffect(() => {
    if (replyTo) {
      const input = document.getElementById('comment-input');
      if (input) {
        input.focus();
      }
    }
  }, [replyTo]);

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
        flexDirection: 'column',
      }}
    >
      {replyTo && (
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: 'background.neutral',
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mx: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              maxWidth: 'calc(100% - 40px)', // Réserver de l'espace pour le bouton de fermeture
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            En réponse à : {replyTo.message}
          </Typography>
          <IconButton size="small" onClick={onCancelReply}>
            <Iconify icon="eva:close-fill" width={16} />
          </IconButton>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Avatar src={authUser.avatarUrl} alt={authUser.displayName} sx={{ width: 40, height: 40 }}>
          {authUser.displayName?.charAt(0) || authUser.firstName?.charAt(0) || 'U'}
        </Avatar>

        <Paper variant="outlined" sx={{ p: 1, flexGrow: 1, bgcolor: 'transparent' }}>
          <InputBase
            id="comment-input"
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
            placeholder={replyTo ? `Répondre à ${replyTo.name}...` : 'Écrire un commentaire...'}
            disabled={isSubmitting}
            sx={{ px: 1 }}
          />

          {selectedFile && (
            <Box sx={{ px: 1, py: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon="mdi:file" width={20} />
                <Typography variant="caption" sx={{ flex: 1 }}>
                  {selectedFile.name}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setSelectedFile(null)}
                  sx={{ color: 'error.main' }}
                >
                  <Iconify icon="eva:close-fill" width={16} />
                </IconButton>
              </Box>
              <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 0.5 }} />
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ flexGrow: 1, display: 'flex' }}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept="*/*"
              />
              <IconButton disabled={isSubmitting} onClick={() => fileInputRef.current?.click()}>
                <Iconify icon="eva:attach-2-fill" />
              </IconButton>
            </Box>

            <Button
              variant="contained"
              onClick={handleSubmitComment}
              disabled={(!message.trim() && !selectedFile) || isSubmitting}
            >
              {replyTo ? 'Répondre' : 'Commenter'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
