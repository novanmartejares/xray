import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Switch,
  FormControlLabel,
  Box,
  TextField,
  Button,
  Typography,
  Stack,
} from "@mui/material";

const LoginRegister = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    const { username, password } = form;
    if (!username || !password) return setError("All fields are required");

    if (isRegister) {
      if (users.find((u) => u.username === username)) {
        return setError("Username already taken");
      }
      setUsers([...users, { username, password }]);
      setIsRegister(false);
      setForm({ username: "", password: "" });
      setError("Registered successfully. Please login.");
    } else {
      const user = users.find((u) => u.username === username && u.password === password);
      if (!user) return setError("Invalid username or password");
      onLogin(user);
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={10} p={3} borderRadius={2} boxShadow={3}>
      <Typography variant="h5" mb={2}>
        {isRegister ? "Register" : "Login"}
      </Typography>
      <Stack spacing={2}>
        <TextField
          name="username"
          label="Username"
          value={form.username}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          name="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={handleChange}
          fullWidth
        />
        {error && <Typography color="error">{error}</Typography>}
        <Button variant="contained" onClick={handleSubmit}>
          {isRegister ? "Register" : "Login"}
        </Button>
        <Button onClick={() => { setIsRegister(!isRegister); setError(""); }}>
          {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
        </Button>
      </Stack>
    </Box>
  );
};

const Root = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: { main: darkMode ? "#90caf9" : "#1976d2" },
      secondary: { main: darkMode ? "#f48fb1" : "#9c27b0" },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 2 }}>
        <FormControlLabel
          control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />}
          label={darkMode ? "Dark Mode" : "Light Mode"}
        />
        {user ? (
          <App />
        ) : (
          <LoginRegister onLogin={(u) => setUser(u)} />
        )}
      </Box>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
