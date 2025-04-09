import React, { useState, useEffect, useRef } from "react";
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
  Snackbar,
  MenuItem,
} from "@mui/material";

// ✅ Secure hashing
const hashPassword = async (password) => {
  const enc = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// ✅ Login/Register Panel
const LoginRegister = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role: "user" });
  const [error, setError] = useState("");

  const users = JSON.parse(localStorage.getItem("users") || "[]");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const { username, password, role } = form;
    if (!username || !password) return setError("All fields are required");

    const hashed = await hashPassword(password);

    if (isRegister) {
      if (users.find((u) => u.username === username)) {
        return setError("Username already taken");
      }
      const newUser = { username, password: hashed, role };
      const updatedUsers = [...users, newUser];
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      setIsRegister(false);
      setForm({ username: "", password: "", role: "user" });
      setError("Registered successfully. Please login.");
    } else {
      const user = users.find(
        (u) => u.username === username && u.password === hashed
      );
      if (!user) return setError("Invalid username or password");
      localStorage.setItem("loggedInUser", JSON.stringify(user));
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
        {isRegister && (
          <TextField
            name="role"
            label="Role"
            select
            value={form.role}
            onChange={handleChange}
            fullWidth
          >
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
        )}
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
  const [toast, setToast] = useState("");
  const idleTimerRef = useRef(null);

  // ✅ Check for session
  useEffect(() => {
    const saved = localStorage.getItem("loggedInUser");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // ✅ Show toast
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // ✅ Handle Login
  const handleLogin = (u) => {
    setUser(u);
    showToast(`Welcome, ${u.username}`);
  };

  // ✅ Logout logic
  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    setUser(null);
    showToast("You have been logged out.");
  };

  // ✅ Auto-logout after idle (5 min)
  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        handleLogout();
        showToast("Session expired due to inactivity.");
      }, 5 * 60 * 1000); // 5 minutes
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      clearTimeout(idleTimerRef.current);
    };
  }, [user]);

  // ✅ Theming
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
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <FormControlLabel
            control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />}
            label={darkMode ? "Dark Mode" : "Light Mode"}
          />
          {user && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle1">
                {user.role === "admin" ? "🛡️ Admin" : "👤 User"}: {user.username}
              </Typography>
              <Button variant="outlined" color="secondary" onClick={handleLogout}>
                Logout
              </Button>
            </Stack>
          )}
        </Stack>

        {user ? <App user={user} /> : <LoginRegister onLogin={handleLogin} />}
        <Snackbar open={!!toast} message={toast} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} />
      </Box>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
