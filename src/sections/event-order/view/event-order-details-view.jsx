import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import { Divider, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import { EventOrderService } from 'src/services/event-order.service';

import { useSettingsContext } from 'src/components/settings';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function EventOrderDetailsView() {
  const { id } = useParams();
  const router = useRouter();
  const settings = useSettingsContext();
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await EventOrderService.getEventOrder(id);
      setCurrentOrder(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading order:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!currentOrder) {
    return <div>Order not found</div>;
  }

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Order Details"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Event Orders', href: paths.dashboard.eventOrder.root },
          { name: `Order ${currentOrder.order_number}` },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <Card>
        <Stack spacing={3} sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between">
            <div>
              <Typography variant="h6">Order Number: {currentOrder.order_number}</Typography>
              <Typography variant="body2">Status: {currentOrder.status}</Typography>
            </div>
            <div>
              <Typography variant="body2">
                Created: {new Date(currentOrder.created_at).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Updated: {new Date(currentOrder.updated_at).toLocaleString()}
              </Typography>
            </div>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Customer Information</Typography>
            <Typography>Name: {currentOrder.customer_name || 'N/A'}</Typography>
            <Typography>Email: {currentOrder.customer_email || 'N/A'}</Typography>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Event Information</Typography>
            <Typography>Title: {currentOrder.event.title}</Typography>
            <Typography>
              Scheduled Date: {new Date(currentOrder.event.scheduled_date).toLocaleString()}
            </Typography>
            <Typography>Price: ${currentOrder.event.price}</Typography>
            <Typography>Event Status: {currentOrder.event.status}</Typography>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Payment Information</Typography>
            <Typography>Total Amount: ${currentOrder.total_price}</Typography>
            <Typography>Session ID: {currentOrder.session_id}</Typography>
          </Stack>

          {currentOrder.qr_code && (
            <>
              <Divider />
              <Stack spacing={2}>
                <Typography variant="h6">QR Code</Typography>
                <img
                  src={`data:image/png;base64,${currentOrder.qr_code}`}
                  alt="QR Code"
                  style={{ width: 200, height: 200 }}
                />
              </Stack>
            </>
          )}
        </Stack>
      </Card>
    </Container>
  );
}
