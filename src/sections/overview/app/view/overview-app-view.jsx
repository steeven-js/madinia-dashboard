import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { useMetrics } from 'src/hooks/use-metrics';

import { DashboardContent } from 'src/layouts/dashboard';
import { SeoIllustration } from 'src/assets/illustrations';
import {
  selectTotalUsers,
  selectWeeklyData,
  selectTotalEvents,
  selectTotalOrders,
  selectGrowthStats,
  selectMetricsLoading,
} from 'src/store/slices/metricsSlice';

import { AppWidget } from '../app-widget';
import { AppWelcome } from '../app-welcome';
import { AppWidgetSummary } from '../app-widget-summary';
import { AppCurrentDownload } from '../app-current-download';

// ----------------------------------------------------------------------

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          return 100;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 200);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <Box sx={{ width: '300px', textAlign: 'center' }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Chargement des données... {Math.round(progress)}%
        </Typography>
      </Box>
    </Box>
  );
};

const LoadingValue = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 24 }}>
    <CircularProgress size={20} />
  </Box>
);

export function OverviewAppView() {
  const theme = useTheme();

  // Utiliser le hook des métriques
  useMetrics();

  // Récupérer l'utilisateur depuis authSlice
  const auth = useSelector((state) => state.auth);

  // Récupérer les métriques depuis Redux avec les sélecteurs
  const loading = useSelector(selectMetricsLoading);
  const totalUsers = useSelector(selectTotalUsers);
  const totalEvents = useSelector(selectTotalEvents);
  const totalOrders = useSelector(selectTotalOrders);
  const growthStats = useSelector(selectGrowthStats);
  const weeklyData = useSelector(selectWeeklyData);

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const renderValue = (value) => {
    if (loading) return <LoadingValue />;
    return value || 0;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <AppWelcome
            title={`Bonjour 👋 \n ${auth?.user?.displayName || 'Jaydon Frankie'}`}
            // description="Voici un aperçu des statistiques de votre application."
            img={<SeoIllustration hideBackground />}
            // action={
            //   <Button variant="contained" color="primary">
            //     Voir plus
            //   </Button>
            // }
          />
        </Grid>

        <Grid xs={12} md={4}>
          <AppWidget
            title="Total des commandes"
            total={totalOrders || 0}
            icon="solar:user-rounded-bold"
            chart={{
              series: [
                {
                  data: [totalOrders || 0],
                },
              ],
            }}
          />
        </Grid>

        <Grid xs={12} md={4}>
          <AppWidgetSummary
            title="Utilisateurs actifs"
            percent={growthStats.users}
            total={totalUsers || 0}
            chart={{
              type: 'bar',
              categories: weekDays,
              series: [
                {
                  name: 'Utilisateurs',
                  data: weeklyData.users,
                },
              ],
            }}
          />
        </Grid>

        <Grid xs={12} md={4}>
          <AppWidgetSummary
            title="Événements créés"
            percent={growthStats.events}
            total={totalEvents || 0}
            chart={{
              type: 'bar',
              colors: [theme.vars.palette.info.main],
              categories: weekDays,
              series: [
                {
                  name: 'Événements',
                  data: weeklyData.events,
                },
              ],
            }}
          />
        </Grid>

        <Grid xs={12} md={4}>
          <AppWidgetSummary
            title="Commandes"
            percent={growthStats.orders}
            total={totalOrders || 0}
            chart={{
              type: 'bar',
              colors: [theme.vars.palette.error.main],
              categories: weekDays,
              series: [
                {
                  name: 'Commandes',
                  data: weeklyData.orders,
                },
              ],
            }}
          />
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <AppCurrentDownload
            title="Répartition des commandes"
            subheader="Par type d'événement"
            chart={{
              series: [
                {
                  label: 'Gratuit',
                  value: Math.max(0, (totalEvents || 0) - (totalOrders || 0)),
                },
                { label: 'Payant', value: totalOrders || 0 },
              ],
            }}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
