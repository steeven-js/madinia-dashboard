import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { db } from 'src/utils/firebase';
import { fToNow } from 'src/utils/format-time';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';
import { Lightbox, useLightBox } from 'src/components/lightbox';

// Composant pour un commentaire unique (peut être un commentaire principal ou une réponse)
function CommentItem({ comment, columnId, taskId, onReply, authUser }) {
  const slides = comment.messageType === 'image' ? [{ src: comment.message }] : [];
  const lightbox = useLightBox(slides);

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={2}>
        <Avatar src={comment.avatarUrl} alt={comment.name} sx={{ width: 40, height: 40 }}>
          {comment.name?.charAt(0)}
        </Avatar>

        <Stack spacing={1} flexGrow={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle2">{comment.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {fToNow(comment.createdAt)}
            </Typography>
          </Stack>

          {/* Affichage du message d'origine si c'est une réponse */}
          {comment.replyTo && (
            <Box
              sx={{
                bgcolor: 'background.neutral',
                p: 1,
                borderRadius: 1,
                mb: 1,
                borderLeft: 3,
                borderColor: 'primary.main',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Avatar
                  src={comment.replyTo.avatarUrl}
                  alt={comment.replyTo.name}
                  sx={{ width: 20, height: 20 }}
                >
                  {comment.replyTo.name?.charAt(0)}
                </Avatar>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {comment.replyTo.name}
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {comment.replyTo.message}
              </Typography>
            </Box>
          )}

          <Box sx={{ position: 'relative' }}>
            {comment.messageType === 'image' ? (
              <Image
                alt={comment.message}
                src={comment.message}
                onClick={() => lightbox.onOpen(comment.message)}
                sx={{
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  transition: (theme) => theme.transitions.create(['opacity']),
                  '&:hover': { opacity: 0.8 },
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  bgcolor: 'background.neutral',
                  p: 1.5,
                  borderRadius: 1,
                }}
              >
                {comment.message}
              </Typography>
            )}

            {authUser && (
              <IconButton
                size="small"
                onClick={() => onReply(comment)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'text.secondary',
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: 'background.paper',
                  },
                }}
              >
                <Iconify icon="eva:corner-down-left-outline" width={16} />
              </IconButton>
            )}
          </Box>
        </Stack>
      </Stack>

      <Lightbox
        index={lightbox.selected}
        slides={slides}
        open={lightbox.open}
        close={lightbox.onClose}
      />
    </Box>
  );
}

// ----------------------------------------------------------------------

export function KanbanDetailsCommentList({ columnId, taskId, onReply }) {
  const authUser = useSelector((state) => state.auth.user);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!columnId || !taskId) return undefined;

    const boardRef = doc(db, 'boards', 'main-board');
    const unsubscribe = onSnapshot(
      boardRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const boardData = docSnapshot.data();
          const columnTasks = boardData.board.tasks[columnId] || [];
          const task = columnTasks.find((t) => t.id === taskId);

          if (task && Array.isArray(task.comments)) {
            // Trier tous les commentaires par date de création (du plus ancien au plus récent)
            const sortedComments = task.comments.sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );

            setComments(sortedComments);
          } else {
            setComments([]);
          }
        }
      },
      (error) => {
        console.error('Error in comments snapshot:', error);
      }
    );

    return () => unsubscribe();
  }, [columnId, taskId]);

  const slides = comments
    .filter((comment) => comment.messageType === 'image')
    .map((slide) => ({ src: slide.message }));

  const lightbox = useLightBox(slides);

  if (!authUser) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
        Veuillez vous connecter pour commenter
      </Typography>
    );
  }

  return (
    <Stack
      component="ul"
      spacing={3}
      sx={{
        p: 0,
        listStyle: 'none',
        flexGrow: 1,
        width: '100%',
        '& > li:last-of-type': {
          mb: 3,
        },
      }}
    >
      {comments && comments.length > 0 ? (
        comments.map((comment) => (
          <li key={comment.id}>
            <CommentItem
              comment={comment}
              columnId={columnId}
              taskId={taskId}
              onReply={onReply}
              authUser={authUser}
            />
          </li>
        ))
      ) : (
        <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 2 }}>
          Pas encore de commentaires
        </Typography>
      )}

      <Lightbox
        index={lightbox.selected}
        slides={slides}
        open={lightbox.open}
        close={lightbox.onClose}
      />
    </Stack>
  );
}
