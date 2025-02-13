import { useState } from 'react';

import {
  Table,
  Paper,
  Button,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { DeleteDialog } from 'src/components/delete-dialog';
import { CategoryDialog } from 'src/components/category-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

export function BlogCategorieTable({
  categories,
  loading,
  addCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
}) {
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [dialogMode, setDialogMode] = useState('add');
  const [loadingCategory, setLoadingCategory] = useState(false);

  const handleOpenAddDialog = () => {
    setDialogMode('add');
    setSelectedCategory(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = async (category) => {
    try {
      setLoadingCategory(true);
      const categoryData = await getCategoryById(category.id);
      setDialogMode('edit');
      setSelectedCategory(categoryData);
      setOpenDialog(true);
    } catch (error) {
      console.error('Erreur lors de la récupération de la catégorie:', error);
    } finally {
      setLoadingCategory(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCategory(null);
  };

  const handleOpenDeleteDialog = (category) => {
    setSelectedCategory(category);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedCategory(null);
  };

  const handleSubmit = async (formData) => {
    try {
      if (dialogMode === 'add') {
        await addCategory(formData);
      } else {
        await updateCategory(selectedCategory.id, formData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Erreur lors de l'opération:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCategory(selectedCategory.id);
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Categories"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Blog', href: paths.dashboard.post.root },
          { name: 'Categories' },
        ]}
        action={
          <Button
            component={RouterLink}
            onClick={handleOpenAddDialog}
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
          >
            Ajouter une catégorie
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => handleOpenEditDialog(category)}
                    disabled={loadingCategory}
                  >
                    <Iconify icon="eva:edit-fill" />
                  </IconButton>
                  <IconButton
                    onClick={() => handleOpenDeleteDialog(category)}
                    disabled={loadingCategory}
                  >
                    <Iconify icon="eva:trash-2-outline" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CategoryDialog
        open={openDialog}
        handleClose={handleCloseDialog}
        category={selectedCategory}
        handleSubmit={handleSubmit}
        mode={dialogMode}
      />

      <DeleteDialog
        open={openDeleteDialog}
        handleClose={handleCloseDeleteDialog}
        handleConfirm={handleDelete}
        title="Confirmer la suppression"
        subtitle="Êtes-vous sûr de vouloir supprimer cette catégorie ?"
      />
    </DashboardContent>
  );
}
