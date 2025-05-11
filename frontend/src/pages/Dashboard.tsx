import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as UpIcon,
  Error as DownIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { getServices, getAlerts, type Service, type Alert } from '../api';

export default function Dashboard() {
  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: getServices,
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  });

  if (servicesLoading || alertsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const upServices = services?.filter((s: Service) => s.status === 'up') || [];
  const downServices = services?.filter((s: Service) => s.status === 'down') || [];
  const activeAlerts = alerts?.filter((a: Alert) => a.status === 'active') || [];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <UpIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Services Up</Typography>
            </Box>
            <Typography variant="h3">{upServices.length}</Typography>
            <Typography color="textSecondary">
              out of {services?.length || 0} total services
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <DownIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">Services Down</Typography>
            </Box>
            <Typography variant="h3">{downServices.length}</Typography>
            <Typography color="textSecondary">
              {((downServices.length / (services?.length || 1)) * 100).toFixed(1)}% of services
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <WarningIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Active Alerts</Typography>
            </Box>
            <Typography variant="h3">{activeAlerts.length}</Typography>
            <Typography color="textSecondary">
              requiring attention
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Alerts
            </Typography>
            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert) => (
                <Box key={alert.id} mb={2}>
                  <Typography variant="subtitle1">
                    {alert.service_name} - {alert.status}
                  </Typography>
                  <Typography color="textSecondary">
                    Started: {new Date(alert.started_at).toLocaleString()}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography color="textSecondary">No active alerts</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
} 