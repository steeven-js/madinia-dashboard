import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { db } from 'src/utils/firebase';
import { fToNow } from 'src/utils/format-time';

import { addComment, replyToComment } from 'src/actions/kanban';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';
import { Lightbox, useLightBox } from 'src/components/lightbox';

// Composant pour un commentaire unique (peut être un commentaire principal ou une réponse)
function CommentItem({ comment, columnId, taskId, onReply, isReply = false, level = 0, authUser }) {
  const [replyMessage, setReplyMessage] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const slides = comment.messageType === 'image' ? [{ src: comment.message }] : [];
  const lightbox = useLightBox(slides);

  // Maximum 3 niveaux d'imbrication de commentaires
  const maxLevel = 3;

  const handleReplySubmit = async () => {
    if (!replyMessage.trim() || !authUser) return;

    setIsSubmitting(true);
    try {
      const replyData = {
        message: replyMessage.trim(),
        messageType: 'text',
        name: authUser.displayName || `${authUser.firstName} ${authUser.lastName}`,
        avatarUrl: authUser.avatarUrl,
        userId: authUser.id,
        createdBy: authUser.id,
        updatedBy: authUser.id,
        email: authUser.email,
        role: authUser.role,
        roleLevel: authUser.roleLevel,
      };

      await replyToComment(columnId, taskId, comment.id, replyData);
      setReplyMessage('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Error replying to comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ ml: isReply ? 4 : 0, mb: 2 }}>
      <Stack direction="row" spacing={2}>
        <Avatar
          src={comment.avatarUrl}
          alt={comment.name}
          sx={{
            width: isReply ? 32 : 40,
            height: isReply ? 32 : 40,
          }}
        >
          {comment.name?.charAt(0)}
        </Avatar>

        <Stack spacing={isReply ? 0.5 : 1} flexGrow={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant={isReply ? 'body2' : 'subtitle2'}>{comment.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {fToNow(comment.createdAt)}
            </Typography>
          </Stack>

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

          {!isReply && authUser && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Button
                size="small"
                color="inherit"
                startIcon={<Iconify icon="eva:corner-down-left-outline" width={16} />}
                onClick={() => setShowReplyForm(!showReplyForm)}
                sx={{ typography: 'caption' }}
              >
                Répondre
              </Button>
            </Stack>
          )}

          {/* Formulaire de réponse */}
          <Collapse in={showReplyForm}>
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Avatar
                src={authUser?.avatarUrl}
                alt={authUser?.displayName}
                sx={{ width: 32, height: 32 }}
              >
                {authUser?.displayName?.charAt(0) || authUser?.firstName?.charAt(0) || 'U'}
              </Avatar>
              <TextField
                fullWidth
                size="small"
                placeholder="Répondre à ce commentaire..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReplySubmit();
                  }
                }}
                disabled={isSubmitting}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.neutral' } }}
              />
              <IconButton
                color="primary"
                disabled={!replyMessage.trim() || isSubmitting}
                onClick={handleReplySubmit}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled',
                  },
                }}
              >
                <Iconify icon="eva:corner-down-left-fill" />
              </IconButton>
            </Box>
          </Collapse>

          {/* Affichage des réponses */}
          {comment.replies && comment.replies.length > 0 && (
            <>
              <Button
                size="small"
                color="inherit"
                onClick={() => setShowReplies(!showReplies)}
                startIcon={
                  <Iconify
                    icon={showReplies ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
                    width={16}
                  />
                }
                sx={{ typography: 'caption', alignSelf: 'flex-start', mt: 1 }}
              >
                {showReplies ? 'Masquer' : 'Voir'} {comment.replies.length} réponse
                {comment.replies.length > 1 ? 's' : ''}
              </Button>

              <Collapse in={showReplies}>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {level < maxLevel &&
                    comment.replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        columnId={columnId}
                        taskId={taskId}
                        onReply={onReply}
                        isReply
                        level={level + 1}
                        authUser={authUser}
                      />
                    ))}

                  {level >= maxLevel && comment.replies.length > 0 && (
                    <Button
                      fullWidth
                      size="small"
                      color="inherit"
                      sx={{ typography: 'caption', mt: 1 }}
                      onClick={() => onReply(comment.id)}
                    >
                      Voir toutes les réponses
                    </Button>
                  )}
                </Stack>
              </Collapse>
            </>
          )}
        </Stack>
      </Stack>

      {isReply && (
        <Lightbox
          index={lightbox.selected}
          slides={slides}
          open={lightbox.open}
          close={lightbox.onClose}
        />
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

export function KanbanDetailsCommentList({ columnId, taskId }) {
  const authUser = useSelector((state) => state.auth.user);
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyToId, setReplyToId] = useState(null);

  useEffect(() => {
    if (!columnId || !taskId) return undefined;

    console.log('Setting up comments listener for:', { columnId, taskId });

    const boardRef = doc(db, 'boards', 'main-board');
    const unsubscribe = onSnapshot(
      boardRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const boardData = docSnapshot.data();
          const columnTasks = boardData.board.tasks[columnId] || [];
          const task = columnTasks.find((t) => t.id === taskId);

          if (task && Array.isArray(task.comments)) {
            // Filtrer les commentaires principaux (sans parentId)
            const mainComments = task.comments.filter((comment) => !comment.parentId);

            // Pour chaque commentaire principal, organiser ses réponses
            mainComments.forEach((comment) => {
              // Trouver toutes les réponses directes à ce commentaire
              const replies = task.comments
                .filter((reply) => reply.parentId === comment.id)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Trier les réponses
              comment.replies = replies;
            });

            // Trier les commentaires principaux du plus ancien au plus récent
            const sortedComments = mainComments.sort(
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !authUser) return;

    setIsSubmitting(true);
    try {
      // S'assurer que tous les champs requis sont présents
      const commentData = {
        message: message.trim(),
        messageType: 'text',
        name: authUser.displayName || `${authUser.firstName} ${authUser.lastName}`,
        avatarUrl: authUser.avatarUrl || '', // Utiliser l'avatar de l'utilisateur authentifié
        userId: authUser.id,
        createdBy: authUser.id, // Ajouter l'ID de l'utilisateur authentifié
        updatedBy: authUser.id,
        email: authUser.email,
        role: authUser.role,
        roleLevel: authUser.roleLevel,
        parentId: replyToId, // Si on répond à un commentaire spécifique
        mentions: replyToId ? [replyToId] : [], // Mentionner l'utilisateur à qui on répond
      };

      console.log('Submitting comment with data:', commentData);

      if (replyToId) {
        await replyToComment(columnId, taskId, replyToId, commentData);
        setReplyToId(null);
      } else {
        await addComment(columnId, taskId, commentData);
      }

      setMessage('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyTo = (commentId) => {
    setReplyToId(commentId);
    // Faire défiler vers le formulaire de commentaire
    setTimeout(() => {
      const formElement = document.getElementById('comment-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (!authUser) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
        Veuillez vous connecter pour commenter
      </Typography>
    );
  }

  return (
    <>
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
                onReply={handleReplyTo}
                authUser={authUser}
              />
            </li>
          ))
        ) : (
          <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 2 }}>
            Pas encore de commentaires
          </Typography>
        )}
      </Stack>

      <Box component="form" id="comment-form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        {replyToId && (
          <Box
            sx={{
              mb: 2,
              px: 2,
              py: 1,
              bgcolor: 'background.neutral',
              borderRadius: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="caption">En réponse à un commentaire</Typography>
            <IconButton size="small" onClick={() => setReplyToId(null)}>
              <Iconify icon="eva:close-fill" width={16} />
            </IconButton>
          </Box>
        )}
      </Box>

      <Lightbox
        index={lightbox.selected}
        slides={slides}
        open={lightbox.open}
        close={lightbox.onClose}
      />
    </>
  );
}
