import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { UserCardList } from '../user-card-list';

// ----------------------------------------------------------------------

export default function UserCardsView({ users }) {
  return (
    <Container maxWidth="xl">
      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        }}
      >
        <Typography variant="h4" sx={{ mb: 3 }}>
          Utilisateurs
        </Typography>
      </Box>

      <UserCardList users={users} />
    </Container>
  );
}
