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

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { deleteEvent } from 'src/hooks/use-event';
import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { varAlpha } from 'src/theme/styles';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { EventTableToolbar } from '../event-table-toolbar';
import { EventTableRow, sortEventsByDate } from '../event-table-row';
import { EventTableFiltersResult } from '../event-table-filters-result';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'current', label: 'En cours' },
  { value: 'pending', label: 'Programmé' },
  { value: 'past', label: 'Passés' },
  { value: 'cancelled', label: 'Annulés' },
  { value: 'draft', label: 'Brouillon' },
];

const TABLE_HEAD = [
  { id: 'title', label: 'Événement' },
  { id: 'date', label: 'Date', width: 180 },
  { id: 'location', label: 'Lieu', width: 180 },
  { id: 'participants', label: 'Participants', width: 140 },
  { id: 'price', label: 'Prix', width: 120 },
  { id: 'status', label: 'Statut', width: 100 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function EventListView({ events }) {
  const table = useTable();
  const router = useRouter();
  const confirm = useBoolean();
  const [tableData, setTableData] = useState(sortEventsByDate(events));
  const filters = useSetState({ title: '', status: 'all' });

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: (a, b) => {
      if (!table.orderBy || table.orderBy === 'date') {
        const dateA = new Date(a.scheduledDate || a.date).getTime();
        const dateB = new Date(b.scheduledDate || b.date).getTime();
        return table.order === 'desc' ? dateB - dateA : dateA - dateB;
      }

      const order = table.order === 'desc' ? 1 : -1;
      return order * extendedDescendingComparator(a, b, table.orderBy);
    },
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);
  const canReset = !!filters.state.title || filters.state.status !== 'all';
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await deleteEvent(id);

        const deleteRow = tableData.filter((_row) => _row.id !== id);
        setTableData(deleteRow);
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (error) {
        console.error(error);
      }
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(
        table.selected.map(async (id) => {
          await deleteEvent(id);
        })
      );

      const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));
      setTableData(deleteRows);
      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });
    } catch (error) {
      console.error(error);
    }
  }, [dataFiltered.length, dataInPage.length, table, tableData]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.event.edit(id));
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

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Événements"
          links={[
            { name: 'Tableau de bord', href: paths.dashboard.root },
            { name: 'Événements', href: paths.dashboard.event.root },
            { name: 'Liste' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.event.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Nouvel événement
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
                value={tab.value}
                label={tab.label}
                icon={
                  <Label
                    variant={
                      ((tab.value === 'all' || tab.value === filters.state.status) && 'filled') ||
                      'soft'
                    }
                    color={
                      (tab.value === 'pending' && 'warning') ||
                      (tab.value === 'current' && 'success') ||
                      (tab.value === 'past' && 'warning') ||
                      (tab.value === 'cancelled' && 'error') ||
                      (tab.value === 'draft' && 'default') ||
                      'default'
                    }
                  >
                    {tab.value === 'all'
                      ? tableData.length
                      : tableData.filter((event) => event.status === tab.value).length}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <EventTableToolbar filters={filters} onResetPage={table.onResetPage} />

          {canReset && (
            <EventTableFiltersResult
              filters={filters}
              onResetPage={table.onResetPage}
              totalResults={dataFiltered.length}
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
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <EventTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onEditRow={() => handleEditRow(row.id)}
                      />
                    ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 56 + 20}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                  />

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={dataFiltered.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Supprimer"
        content={
          <>
            Êtes-vous sûr de vouloir supprimer <strong> {table.selected.length} </strong> événements
            ?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Supprimer
          </Button>
        }
      />
    </>
  );
}

// Extension de la fonction de tri existante
function extendedDescendingComparator(a, b, orderBy) {
  // Gestion spéciale des propriétés imbriquées
  if (orderBy === 'participants') {
    return (b.participants?.current || 0) - (a.participants?.current || 0);
  }

  // Gestion spéciale des dates
  if (orderBy === 'date') {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  }

  // Gestion spéciale des prix
  if (orderBy === 'price') {
    const priceA = typeof a.price === 'number' ? a.price : 0;
    const priceB = typeof b.price === 'number' ? b.price : 0;
    return priceB - priceA;
  }

  // Gestion spéciale des statuts
  if (orderBy === 'status') {
    const statusOrder = {
      current: 1,
      pending: 2,
      draft: 3,
      past: 4,
      cancelled: 5,
    };
    return (statusOrder[b.status] || 999) - (statusOrder[a.status] || 999);
  }

  // Gestion des valeurs null ou undefined
  const valueA = a[orderBy] == null ? '' : a[orderBy];
  const valueB = b[orderBy] == null ? '' : b[orderBy];

  // Comparaison de chaînes pour les autres champs
  if (typeof valueA === 'string' && typeof valueB === 'string') {
    return valueB.localeCompare(valueA, undefined, { numeric: true, sensitivity: 'base' });
  }

  // Par défaut pour les autres types
  if (valueB < valueA) return -1;
  if (valueB > valueA) return 1;
  return 0;
}

function applyFilter({ inputData, comparator, filters }) {
  const { title, status } = filters;
  let filteredData = [...inputData];

  if (title) {
    filteredData = filteredData.filter(
      (event) => event.title.toLowerCase().indexOf(title.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    filteredData = filteredData.filter((event) => event.status === status);
  }

  const stabilizedThis = filteredData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  return stabilizedThis.map((el) => el[0]);
}
