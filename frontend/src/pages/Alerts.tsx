import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { getAlerts, resolveAlert, verifyAlert, type Alert } from '../api';

export default function Alerts() {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  });

  const resolveMutation = useMutation({
    mutationFn: resolveAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: verifyAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  const activeAlerts = alerts?.filter((alert) => alert.status === 'active') || [];
  const resolvedAlerts = alerts?.filter((alert) => alert.status === 'resolved') || [];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Active Alerts
      </Typography>

      <Grid container spacing={3}>
        {activeAlerts.map((alert) => (
          <Grid item xs={12} key={alert.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6">{alert.service_name}</Typography>
                    <Box display="flex" gap={1} mt={1}>
                      <Chip
                        label={alert.status}
                        color="error"
                        size="small"
                      />
                      <Chip
                        label={alert.verification_status}
                        color="warning"
                        size="small"
                      />
                    </Box>
                    <Typography color="textSecondary" sx={{ mt: 1 }}>
                      Started: {format(new Date(alert.started_at), 'PPpp')}
                    </Typography>
                  </Box>
                  <Box>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => resolveMutation.mutate(alert.id)}
                      sx={{ mr: 1 }}
                    >
                      Resolve
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => verifyMutation.mutate(alert.id)}
                    >
                      Verify
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" sx={{ mt: 4 }} gutterBottom>
        Resolved Alerts
      </Typography>

      <Grid container spacing={3}>
        {resolvedAlerts.map((alert) => (
          <Grid item xs={12} key={alert.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6">{alert.service_name}</Typography>
                    <Box display="flex" gap={1} mt={1}>
                      <Chip
                        label={alert.status}
                        color="success"
                        size="small"
                      />
                      <Chip
                        label={alert.verification_status}
                        color="success"
                        size="small"
                      />
                    </Box>
                    <Typography color="textSecondary" sx={{ mt: 1 }}>
                      Started: {format(new Date(alert.started_at), 'PPpp')}
                    </Typography>
                    {alert.resolved_at && (
                      <Typography color="textSecondary">
                        Resolved: {format(new Date(alert.resolved_at), 'PPpp')}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
} 