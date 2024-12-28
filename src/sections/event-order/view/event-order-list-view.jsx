import dayjs from 'dayjs';
import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import { TableRow, TableCell } from '@mui/material';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { varAlpha } from 'src/theme/styles';
import { DashboardContent } from 'src/layouts/dashboard';
import { EventOrderService } from 'src/services/event-order.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { EventOrderTableRow } from '../event-order-table-row';
import { EventOrderTableToolbar } from '../event-order-table-toolbar';
import { EventOrderTableFiltersResult } from '../event-order-table-filters-result';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
];

const TABLE_HEAD = [
  { id: 'orderNumber', label: 'Order', width: 88 },
  { id: 'customerName', label: 'Customer' },
  { id: 'eventTitle', label: 'Event' },
  { id: 'createdAt', label: 'Date', width: 140 },
  { id: 'totalAmount', label: 'Price', width: 140 },
  { id: 'status', label: 'Status', width: 110 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function EventOrderListView() {
  const table = useTable({
    defaultOrderBy: 'orderNumber',
    defaultOrder: 'desc',
  });
  const router = useRouter();
  const confirm = useBoolean();

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);

  const filters = useSetState({
    name: '',
    status: 'all',
    startDate: null,
    endDate: null,
  });

  const dateError =
    filters.state.startDate && filters.state.endDate
      ? filters.state.startDate.isAfter(filters.state.endDate)
      : false;

  // useEffect(() => {
  //   if (filters.state.startDate || filters.state.endDate) {
  //     console.log('Date filters updated:', {
  //       startDate: filters.state.startDate?.format('YYYY-MM-DD'),
  //       endDate: filters.state.endDate?.format('YYYY-MM-DD'),
  //       dateError,
  //     });
  //   }
  // }, [filters.state.startDate, filters.state.endDate, dateError]);

  // useEffect(() => {
  //   console.log('Filters changed:', filters.state);
  // }, [filters.state]);

  useEffect(() => {
    const fetchEventOrders = async () => {
      try {
        setLoading(true);
        const response = await EventOrderService.getEventOrders();
        const orders = response.data || [];

        const formattedOrders = orders.map((order) => ({
          id: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name || 'N/A',
          customerEmail: order.customer_email,
          eventTitle: order.event?.title || 'N/A',
          createdAt: order.created_at,
          status: order.status,
          totalAmount: parseFloat(order.total_price),
          event: order.event,
          qrCode: order.qr_code,
          sessionId: order.session_id,
        }));

        setTableData(formattedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchEventOrders();
  }, []);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
    dateError,
  });

  const dataInPage = dataFiltered.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const canReset =
    !!filters.state.name ||
    filters.state.status !== 'all' ||
    (!!filters.state.startDate && !!filters.state.endDate);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    (id) => {
      const deleteRow = tableData.filter((row) => row.id !== id);
      setTableData(deleteRow);
      table.onUpdatePageDeleteRow(dataInPage.length);
      toast.success('Delete success!');
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));
    setTableData(deleteRows);
    table.onUpdatePageDeleteRows({
      totalRowsInPage: dataInPage.length,
      totalRowsFiltered: dataFiltered.length,
    });
    toast.success('Delete success!');
  }, [dataFiltered.length, dataInPage.length, table, tableData]);

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.eventOrder.details(id));
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

  const adaptedData = tableData.map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name || 'N/A',
    customerEmail: order.customer_email,
    eventTitle: order.event?.title || 'N/A',
    createdAt: dayjs(order.created_at).format('YYYY-MM-DD'),
    updatedAt: dayjs(order.updated_at).format('YYYY-MM-DD'),
    status: order.status,
    totalAmount: parseFloat(order.total_price),
    event: order.event,
    qrCode: order.qr_code,
    sessionId: order.session_id,
  }));

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Event Orders"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Event Orders', href: paths.dashboard.eventOrder.root },
            { name: 'List' },
          ]}
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
                      ((tab.value === 'all' || tab.value === filters.state.status) && 'filled') ||
                      'soft'
                    }
                    color={
                      (tab.value === 'paid' && 'success') ||
                      (tab.value === 'unpaid' && 'warning') ||
                      'default'
                    }
                  >
                    {tab.value === 'all'
                      ? tableData.length
                      : tableData.filter((order) => order.status === tab.value).length}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <EventOrderTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            dateError={dateError}
          />

          {canReset && (
            <EventOrderTableFiltersResult
              filters={filters}
              totalResults={dataFiltered.length}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={TABLE_HEAD.length} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {dataInPage.map((row) => (
                        <EventOrderTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(row.id)}
                          onSelectRow={() => table.onSelectRow(row.id)}
                          onDeleteRow={() => handleDeleteRow(row.id)}
                          onViewRow={() => handleViewRow(row.id)}
                        />
                      ))}

                      <TableEmptyRows
                        height={table.dense ? 52 : 72}
                        emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                      />

                      {notFound && <TableNoData notFound={notFound} />}
                    </>
                  )}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePaginationCustom
            count={dataFiltered.length}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
            dense={table.dense}
            onChangeDense={table.onChangeDense}
          />
        </Card>
      </DashboardContent>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.length} </strong> items?
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
            Delete
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters, dateError }) {
  const { name, status, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (order) =>
        order.orderNumber.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        (order.customerName &&
          order.customerName.toLowerCase().indexOf(name.toLowerCase()) !== -1) ||
        (order.customerEmail &&
          order.customerEmail.toLowerCase().indexOf(name.toLowerCase()) !== -1)
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((order) => order.status === status);
  }

  if (!dateError) {
    if (startDate && endDate) {
      // console.log(
      //   'Filtering dates between:',
      //   startDate.format('YYYY-MM-DD'),
      //   'and',
      //   endDate.format('YYYY-MM-DD')
      // );

      inputData = inputData.filter((order) => {
        try {
          const orderDate = dayjs(order.createdAt);
          const start = startDate.startOf('day');
          const end = endDate.endOf('day');

          // console.log('Comparing:', {
          //   orderDate: orderDate.format('YYYY-MM-DD'),
          //   start: start.format('YYYY-MM-DD'),
          //   end: end.format('YYYY-MM-DD'),
          //   isInRange: orderDate.isBetween(start, end, 'day', '[]'),
          // });

          return orderDate.isBetween(start, end, 'day', '[]');
        } catch (error) {
          console.error('Date filtering error for order:', order.createdAt, error);
          return false;
        }
      });
    }
  }

  return inputData;
}
