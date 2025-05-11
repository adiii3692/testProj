import React from "react";
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
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

const Users = () => {
  const [open, setOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("http://localhost:8080/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });

  const createUser = useMutation({
    mutationFn: async (user: Omit<User, "id" | "createdAt">) => {
      const response = await fetch("http://localhost:8080/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
      if (!response.ok) {
        throw new Error("Failed to create user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
    },
  });

  const updateUser = useMutation({
    mutationFn: async (user: User) => {
      const response = await fetch(`http://localhost:8080/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
      if (!response.ok) {
        throw new Error("Failed to update user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      setEditingUser(null);
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const userData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      role: formData.get("role") as string,
    };

    if (editingUser) {
      updateUser.mutate({ ...userData, id: editingUser.id, createdAt: editingUser.createdAt });
    } else {
      createUser.mutate(userData);
    }
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Users</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingUser(null);
            setOpen(true);
          }}
        >
          Add User
        </Button>
      </Box>

      <Grid container spacing={3}>
        {users?.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{user.name}</Typography>
                <Typography color="textSecondary">{user.email}</Typography>
                <Typography color="textSecondary">{user.phone}</Typography>
                <Typography color="textSecondary">Role: {user.role}</Typography>
                <Typography color="textSecondary">
                  Created: {format(new Date(user.createdAt), "PPp")}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditingUser(user);
                      setOpen(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => deleteUser.mutate(user.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
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
              defaultValue={editingUser?.name}
            />
            <TextField
              margin="dense"
              name="email"
              label="Email"
              type="email"
              fullWidth
              required
              defaultValue={editingUser?.email}
            />
            <TextField
              margin="dense"
              name="phone"
              label="Phone"
              type="tel"
              fullWidth
              required
              defaultValue={editingUser?.phone}
            />
            <TextField
              margin="dense"
              name="role"
              label="Role"
              type="text"
              fullWidth
              required
              defaultValue={editingUser?.role}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingUser ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Users; 