import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Stack,
  Container,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as UpIcon,
  Error as DownIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { getServices, createService, updateService, deleteService, type Service } from '../api';
import { format, isValid } from 'date-fns';

export default function Services() {
  const [open, setOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const is600px = useMediaQuery('(max-width:600px)');

  const { data: services, isLoading, error } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: getServices,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const createMutation = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, service }: { id: number; service: Partial<Service> }) =>
      updateService(id, service),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setOpen(false);
      setEditingService(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const service = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      url: formData.get('url') as string,
      config: formData.get('config') as string,
      status: 'up' as const, // Default status for new services
    };

    if (editingService) {
      updateMutation.mutate({ id: editingService.id, service });
    } else {
      createMutation.mutate(service);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Error loading services. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Container 
      maxWidth={false} 
      sx={{ 
        py: 4,
        px: { xs: 2, sm: 3, md: 4 },
        maxWidth: '1600px',
      }}
    >
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={2}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontWeight: 500,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            <StorageIcon /> Services
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            sx={{ 
              minWidth: { xs: '100%', sm: 'auto' },
              height: { xs: '40px', sm: '36px' },
            }}
          >
            Add Service
          </Button>
        </Stack>
      </Paper>

      <Grid 
        container 
        spacing={{ xs: 2, sm: 3 }}
        sx={{
          width: '100%',
          margin: 0,
        }}
      >
        {services?.map((service) => {
          const lastCheckDate = service.updated_at ? new Date(service.updated_at) : null;
          const formattedDate = lastCheckDate && isValid(lastCheckDate) 
            ? format(lastCheckDate, 'MMM d, HH:mm')
            : 'Never';

          return (
            <Grid 
              item 
              xs={12} 
              sm={6} 
              md={4} 
              lg={3}
              key={service.id}
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
              }}
            >
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => theme.shadows[4],
                  },
                }}
              >
                <CardContent sx={{ 
                  p: { xs: 2, sm: 3 }, 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  '&:last-child': { pb: { xs: 2, sm: 3 } }
                }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box flex={1} minWidth={0}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography 
                          variant="h6" 
                          noWrap 
                          sx={{ 
                            fontWeight: 500,
                            maxWidth: { xs: '120px', sm: '180px', md: '200px', lg: '250px' },
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                          }}
                        >
                          {service.name}
                        </Typography>
                        <Chip
                          icon={service.status === 'up' ? <UpIcon /> : <DownIcon />}
                          label={service.status}
                          color={service.status === 'up' ? 'success' : 'error'}
                          size="small"
                          sx={{ 
                            ml: 'auto',
                            height: { xs: '24px', sm: '32px' },
                            '& .MuiChip-label': {
                              px: { xs: 1, sm: 1.5 },
                            }
                          }}
                        />
                      </Box>
                      <Typography 
                        color="textSecondary" 
                        sx={{ 
                          mb: 1,
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                        }}
                      >
                        {service.type}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      wordBreak: 'break-all',
                      mb: 2,
                      flex: 1,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    {service.url}
                  </Typography>

                  <Stack 
                    direction="row" 
                    spacing={1} 
                    flexWrap="wrap" 
                    useFlexGap
                    sx={{ mt: 'auto' }}
                  >
                    <Tooltip title="Last Check">
                      <Chip
                        icon={<TimeIcon />}
                        label={formattedDate}
                        size="small"
                        variant="outlined"
                        sx={{
                          height: { xs: '24px', sm: '32px' },
                          '& .MuiChip-label': {
                            px: { xs: 1, sm: 1.5 },
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          }
                        }}
                      />
                    </Tooltip>
                    {service.config && (
                      <Tooltip title="Configuration">
                        <Chip
                          icon={<SpeedIcon />}
                          label="Configured"
                          size="small"
                          variant="outlined"
                          sx={{
                            height: { xs: '24px', sm: '32px' },
                            '& .MuiChip-label': {
                              px: { xs: 1, sm: 1.5 },
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            }
                          }}
                        />
                      </Tooltip>
                    )}
                  </Stack>

                  <Box 
                    sx={{ 
                      mt: 2,
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 1,
                    }}
                  >
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingService(service);
                          setOpen(true);
                        }}
                        sx={{ 
                          width: { xs: '32px', sm: '36px' },
                          height: { xs: '32px', sm: '36px' },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => deleteMutation.mutate(service.id)}
                        sx={{ 
                          width: { xs: '32px', sm: '36px' },
                          height: { xs: '32px', sm: '36px' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog 
        open={open} 
        onClose={() => {
          setOpen(false);
          setEditingService(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {editingService ? 'Edit Service' : 'Add Service'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pb: 2 }}>
            <Stack spacing={3}>
              <TextField
                autoFocus
                name="name"
                label="Name"
                type="text"
                fullWidth
                required
                defaultValue={editingService?.name}
                helperText="A descriptive name for the service"
              />
              <TextField
                name="type"
                label="Type"
                type="text"
                fullWidth
                required
                defaultValue={editingService?.type}
                helperText="The type of service (e.g., HTTP, TCP, ICMP)"
              />
              <TextField
                name="url"
                label="URL"
                type="text"
                fullWidth
                required
                defaultValue={editingService?.url}
                helperText="The endpoint to monitor"
              />
              <TextField
                name="config"
                label="Config"
                type="text"
                fullWidth
                required
                multiline
                rows={4}
                defaultValue={editingService?.config}
                helperText="Additional configuration in JSON format"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={() => {
                setOpen(false);
                setEditingService(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <CircularProgress size={24} />
              ) : editingService ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
} 