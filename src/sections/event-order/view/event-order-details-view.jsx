import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { EventOrderService } from 'src/services/event-order.service';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';

import { EventOrderDetailsInfo } from '../event-order-details-info';
import { EventOrderDetailsItems } from '../event-order-details-items';
import { EventOrderDetailsToolbar } from '../event-order-details-toolbar';
import { EventOrderDetailsHistory } from '../event-order-details-history';

// ----------------------------------------------------------------------

const ORDER_STATUS_OPTIONS = [
  { value: 'paid', label: 'Payé' },
  { value: 'unpaid', label: 'Non payé' },
  { value: 'refunded', label: 'Remboursé' },
];

// ----------------------------------------------------------------------

export function EventOrderDetailsView() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await EventOrderService.getEventOrder(id);
      setOrder(response.data);
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Erreur lors du chargement de la commande');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleChangeStatus = useCallback(async (newValue) => {
    try {
      await EventOrderService.updateEventOrder(id, { status: newValue });
      loadOrder(); // Recharger la commande pour avoir les données à jour
      toast.success('Statut mis à jour avec succès');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  }, [id, loadOrder]);

  if (loading) {
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ height: '100vh' }}>
          <CircularProgress />
        </Stack>
      </DashboardContent>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <DashboardContent>
      <EventOrderDetailsToolbar
        backLink={paths.dashboard.eventOrder.root}
        orderNumber={order.order_number}
        createdAt={order.created_at}
        status={order.status}
        onChangeStatus={handleChangeStatus}
        statusOptions={ORDER_STATUS_OPTIONS}
      />

      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Stack spacing={3} direction={{ xs: 'column-reverse', md: 'column' }}>
            <EventOrderDetailsItems
              event={order.event}
              totalAmount={order.total_price}
            />

            <EventOrderDetailsHistory
              createdAt={order.created_at}
              updatedAt={order.updated_at}
              status={order.status}
            />
          </Stack>
        </Grid>

        <Grid xs={12} md={4}>
          <EventOrderDetailsInfo
            customerName={order.customer_name}
            customerEmail={order.customer_email}
            sessionId={order.session_id}
            qrCode={order.qr_code_url}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
