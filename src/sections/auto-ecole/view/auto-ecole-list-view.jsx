import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';
import { deleteAutoEcole } from 'src/hooks/use-auto-ecole';

import { varAlpha } from 'src/theme/styles';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { AutoEcoleTableRow } from '../auto-ecole-table-row';
import { AutoEcoleTableToolbar } from '../auto-ecole-table-toolbar';
import { AutoEcoleTableFiltersResult } from '../auto-ecole-table-filters-result';

// ----------------------------------------------------------------------

export const AUTO_ECOLE_STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'banned', label: 'Banned' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...AUTO_ECOLE_STATUS];

const TABLE_HEAD = [
  { id: 'name', label: 'Name' },
  { id: 'phoneNumber', label: 'Phone number', width: 180 },
  { id: 'company', label: 'Company', width: 220 },
  { id: 'status', label: 'Status', width: 100 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

const ROLE_OPTIONS = ['User', 'Admin', 'Editor', 'Manager', 'Developer'];

// ----------------------------------------------------------------------

export function AutoEcoleListView({ data, loading, error }) {
  const table = useTable();
  const router = useRouter();
  const confirm = useBoolean();
  const [_tableData, setTableData] = useState([]);
  const filters = useSetState({ name: '', status: 'all' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const dataFiltered = applyFilter({
    inputData: data,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);
  const canReset = !!filters.state.name || filters.state.status !== 'all';
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        setDeleteLoading(true);
        await deleteAutoEcole(id);
        toast.success('Auto-école supprimée avec succès');

        const newDataLength = dataInPage.length - 1;
        if (newDataLength === 0 && table.page > 0) {
          table.setPage(table.page - 1);
        }
      } catch (_error) {
        console.error('Erreur lors de la suppression:', _error);
        toast.error('Erreur lors de la suppression');
      } finally {
        setDeleteLoading(false);
      }
    },
    [dataInPage.length, table]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      setDeleteLoading(true);
      const selectedIds = table.selected;
      await Promise.all(selectedIds.map((id) => deleteAutoEcole(id)));
      toast.success(`${selectedIds.length} auto-écoles supprimées avec succès`);
      table.onSelectAllRows(false);
      const remainingRows = dataInPage.length - selectedIds.length;
      if (remainingRows === 0 && table.page > 0) {
        table.setPage(table.page - 1);
      }
    } catch (_error) {
      console.error('Erreur lors de la suppression multiple:', _error);
      toast.error('Erreur lors de la suppression multiple');
    } finally {
      setDeleteLoading(false);
    }
  }, [table, dataInPage.length]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.autoEcole.edit(id));
    },
    [router]
  );

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      filters.setState({ status: newValue });
    },
    [filters, table]
  );

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
    return (
      <EmptyContent
        title="Erreur"
        description={error.message || 'Une erreur est survenue lors du chargement des données'}
      />
    );
  }

  return (
    <DashboardContent>
        <CustomBreadcrumbs
          heading="List"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Auto Ecoles', href: paths.dashboard.user.cards },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.autoEcole.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Créer une auto-école
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={filters.state.status}
            onChange={handleFilterStatus}
            sx={{
              px: 2.5,
              boxShadow: (theme) =>
                `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }}
          >
            {STATUS_OPTIONS.map((tab) => (
              <Tab
                key={tab.value}
                iconPosition="end"
                value={tab.value}
                label={tab.label}
                icon={
                  <Label
                    variant={
                      tab.value === 'all' || tab.value === filters.state.status ? 'filled' : 'soft'
                    }
                    color={
                      (tab.value === 'active' && 'success') ||
                      (tab.value === 'pending' && 'warning') ||
                      (tab.value === 'banned' && 'error') ||
                      'default'
                    }
                  >
                    {['active', 'pending', 'banned', 'rejected'].includes(tab.value)
                      ? data.filter((user) => user.status === tab.value).length
                      : data.length}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <AutoEcoleTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ roles: ROLE_OPTIONS }}
          />

          {canReset && (
            <AutoEcoleTableFiltersResult
              filters={filters}
              totalResults={dataFiltered.length}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                )
              }
              action={
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={confirm.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {dataInPage.map((row) => (
                    <AutoEcoleTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                      onEditRow={() => handleEditRow(row.id)}
                    />
                  ))}

                  <TableEmptyRows
                    height={56}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                  />
                  <TableNoData notFound={notFound} isFiltered={canReset} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            count={dataFiltered.length}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>

        <ConfirmDialog
          open={confirm.value}
          onClose={confirm.onFalse}
          title="Delete"
          content={
            <>
              Are you sure you want to delete <strong>{table.selected.length}</strong> items?
            </>
          }
          action={
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                confirm.onFalse();
                handleDeleteRows();
              }}
            >
              Delete
            </Button>
          }
        />
      </DashboardContent>
  );
}

function applyFilter({ inputData, comparator, filters }) {
  const { name, status } = filters;
  let dataFiltered = [...inputData];

  if (name) {
    dataFiltered = dataFiltered.filter((user) =>
      user.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  if (status !== 'all') {
    dataFiltered = dataFiltered.filter((user) => user.status === status);
  }

  dataFiltered = dataFiltered.sort(comparator);
  return dataFiltered;
}
