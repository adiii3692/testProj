import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Settings {
  checkInterval: number;
  alertThreshold: number;
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  enableSMSAlerts: boolean;
  smtpServer: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
}

const Settings = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = React.useState<Settings>({
    checkInterval: 300,
    alertThreshold: 3,
    enableNotifications: true,
    enableEmailAlerts: true,
    enableSMSAlerts: true,
    smtpServer: "",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
  });

  const { isLoading } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await fetch("http://localhost:8080/api/settings");
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      const data = await response.json();
      setSettings(data);
      return data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Settings) => {
      const response = await fetch("http://localhost:8080/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) {
        throw new Error("Failed to update settings");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSettings.mutate(settings);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = event.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Settings
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Monitoring Settings
                </Typography>
                <TextField
                  fullWidth
                  label="Check Interval (seconds)"
                  name="checkInterval"
                  type="number"
                  value={settings.checkInterval}
                  onChange={handleChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Alert Threshold"
                  name="alertThreshold"
                  type="number"
                  value={settings.alertThreshold}
                  onChange={handleChange}
                  margin="normal"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Notification Settings
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableNotifications}
                      onChange={handleChange}
                      name="enableNotifications"
                    />
                  }
                  label="Enable Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableEmailAlerts}
                      onChange={handleChange}
                      name="enableEmailAlerts"
                    />
                  }
                  label="Enable Email Alerts"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableSMSAlerts}
                      onChange={handleChange}
                      name="enableSMSAlerts"
                    />
                  }
                  label="Enable SMS Alerts"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  SMTP Settings
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="SMTP Server"
                      name="smtpServer"
                      value={settings.smtpServer}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="SMTP Port"
                      name="smtpPort"
                      type="number"
                      value={settings.smtpPort}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="SMTP Username"
                      name="smtpUsername"
                      value={settings.smtpUsername}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="SMTP Password"
                      name="smtpPassword"
                      type="password"
                      value={settings.smtpPassword}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button type="submit" variant="contained" color="primary">
            Save Settings
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default Settings; 