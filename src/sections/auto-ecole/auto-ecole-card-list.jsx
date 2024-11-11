import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Pagination from '@mui/material/Pagination';

import { AutoEcoleCard } from './auto-ecole';
import { BlankView } from '../blank/view';

// ----------------------------------------------------------------------

export function AutoEcoleCardList({ autoEcoles, error }) {
  // Valeur par défaut tableau vide
  const [page, setPage] = useState(1);

  const rowsPerPage = 12;

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  console.log('autoEcoles', autoEcoles);

  // Si pas de données, ne rien afficher
  if (error) {
    <BlankView />;
  }

  return (
    <>
      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        }}
      >
        {autoEcoles
          .slice((page - 1) * rowsPerPage, (page - 1) * rowsPerPage + rowsPerPage)
          .map((autoEcole) => (
            <AutoEcoleCard key={autoEcole.id} autoEcole={autoEcole} />
          ))}
      </Box>

      {autoEcoles.length > rowsPerPage && (
        <Pagination
          page={page}
          shape="circular"
          count={Math.ceil(autoEcoles.length / rowsPerPage)}
          onChange={handleChangePage}
          sx={{ mt: { xs: 5, md: 8 }, mx: 'auto' }}
        />
      )}
    </>
  );
}
