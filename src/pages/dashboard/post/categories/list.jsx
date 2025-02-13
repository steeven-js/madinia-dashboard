import { Helmet } from 'react-helmet-async';

import { Box, Alert, CircularProgress } from '@mui/material';

import { usePostCategories } from 'src/hooks/use-posts';

import { CONFIG } from 'src/config-global';

import { BlogCategorieTable } from 'src/sections/blog/blog-category/blog-category-table';

export default function ProjectCategoriesPage() {
  const {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
  } = usePostCategories();

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Une erreur est survenue: {error.message}</Alert>;
  }

  return (
    <>
      <Helmet>
        <title>{`Liste des catégories | ${CONFIG.name}`}</title>
      </Helmet>

      <BlogCategorieTable
        categories={categories}
        loading={loading}
        addCategory={addCategory}
        updateCategory={updateCategory}
        deleteCategory={deleteCategory}
        getCategoryById={getCategoryById}
      />
    </>
  );
}
