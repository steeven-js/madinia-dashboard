import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import { fetchAllUsers } from 'src/store/slices/userSlice';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { SearchNotFound } from 'src/components/search-not-found';

// ----------------------------------------------------------------------

const ITEM_HEIGHT = 64;

// ----------------------------------------------------------------------

export function KanbanContactsDialog({ assignee = [], open, onClose, onAssign }) {
  const [searchContact, setSearchContact] = useState('');
  const dispatch = useDispatch();
  const users = useSelector((state) => state.user.users);
  const status = useSelector((state) => state.user.status);

  useEffect(() => {
    // console.log('🔍 Component mounted, fetching users...');
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const handleSearchContacts = useCallback((event) => {
    setSearchContact(event.target.value);
  }, []);

  const dataFiltered = applyFilter({ inputData: users, query: searchContact });

  const notFound = !dataFiltered.length && !!searchContact;

  const handleAssignUser = useCallback(
    (user) => {
      // console.log('👤 Assigning user:', user);
      onAssign(user);
    },
    [onAssign]
  );

  // console.log('🎯 Current users:', users);
  // console.log('🔎 Filtered users:', dataFiltered);

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <DialogTitle sx={{ pb: 0 }}>
        Contacts{' '}
        <Typography component="span">({Array.isArray(users) ? users.length : 0})</Typography>
      </DialogTitle>

      <Box sx={{ px: 3, py: 2.5 }}>
        <TextField
          fullWidth
          value={searchContact}
          onChange={handleSearchContacts}
          placeholder="Rechercher..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {status === 'loading' ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography>Chargement des utilisateurs...</Typography>
          </Box>
        ) : notFound ? (
          <SearchNotFound query={searchContact} sx={{ mt: 3, mb: 10 }} />
        ) : (
          <Scrollbar sx={{ height: ITEM_HEIGHT * 6, px: 2.5 }}>
            <Box component="ul">
              {Array.isArray(dataFiltered) &&
                dataFiltered.map((user) => {
                  const isAssigned = assignee.some((assignedUser) => assignedUser.id === user.id);

                  return (
                    <Box
                      component="li"
                      key={user.id}
                      sx={{
                        gap: 2,
                        display: 'flex',
                        height: ITEM_HEIGHT,
                        alignItems: 'center',
                      }}
                    >
                      <Avatar src={user.avatarUrl} alt={user.displayName}>
                        {user.displayName?.charAt(0).toUpperCase()}
                      </Avatar>

                      <ListItemText
                        primaryTypographyProps={{ typography: 'subtitle2', sx: { mb: 0.25 } }}
                        secondaryTypographyProps={{ typography: 'caption' }}
                        primary={user.displayName}
                        secondary={user.email}
                      />

                      <Button
                        size="small"
                        color={isAssigned ? 'primary' : 'inherit'}
                        startIcon={
                          <Iconify
                            width={16}
                            icon={isAssigned ? 'eva:checkmark-fill' : 'mingcute:add-line'}
                            sx={{ mr: -0.5 }}
                          />
                        }
                        onClick={() => handleAssignUser(user)}
                      >
                        {isAssigned ? 'Assigné' : 'Assigner'}
                      </Button>
                    </Box>
                  );
                })}
            </Box>
          </Scrollbar>
        )}
      </DialogContent>
    </Dialog>
  );
}

function applyFilter({ inputData, query }) {
  // S'assurer que inputData est un tableau
  const data = Array.isArray(inputData) ? inputData : [];

  if (!query) {
    return data;
  }

  return data.filter(
    (user) =>
      user.displayName?.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
      user.email?.toLowerCase().indexOf(query.toLowerCase()) !== -1
  );
}
