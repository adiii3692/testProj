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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { getServices, createService, updateService, deleteService, type Service } from '../api';

export default function Services() {
  const [open, setOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: getServices,
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
    };

    if (editingService) {
      updateMutation.mutate({ id: editingService.id, service });
    } else {
      createMutation.mutate(service);
    }
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Services</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Add Service
        </Button>
      </Box>

      <Grid container spacing={3}>
        {services?.map((service) => (
          <Grid item xs={12} md={6} lg={4} key={service.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6">{service.name}</Typography>
                    <Typography color="textSecondary">{service.type}</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {service.url}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingService(service);
                        setOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => deleteMutation.mutate(service.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => {
        setOpen(false);
        setEditingService(null);
      }}>
        <DialogTitle>
          {editingService ? 'Edit Service' : 'Add Service'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Name"
              type="text"
              fullWidth
              required
              defaultValue={editingService?.name}
            />
            <TextField
              margin="dense"
              name="type"
              label="Type"
              type="text"
              fullWidth
              required
              defaultValue={editingService?.type}
            />
            <TextField
              margin="dense"
              name="url"
              label="URL"
              type="text"
              fullWidth
              required
              defaultValue={editingService?.url}
            />
            <TextField
              margin="dense"
              name="config"
              label="Config"
              type="text"
              fullWidth
              required
              multiline
              rows={4}
              defaultValue={editingService?.config}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpen(false);
              setEditingService(null);
            }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              {editingService ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
} 