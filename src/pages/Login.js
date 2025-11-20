// 📁 client/src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Alert,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Grid,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Stack,
} from "@mui/material";
import { Login as LoginIcon } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "../api/axios";
import { showSuccessToast, showErrorToast } from "../components/CustomToast";
import logo from "../assets/logo.png"; // Adjust if needed

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [emailError, setEmailError] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/";

  const termsContent = `Welcome to ProFinder!\n\nBy registering on our platform, you agree to abide by our terms and conditions...`;
  const privacyContent = `Privacy Policy for ProFinder\n\nWe value your privacy and ensure your data is protected...`;


  useEffect(() => {
    if (form.email && !form.email.includes(".com")) {
      setEmailError("Email must include @gmail.com");
    } else {
      setEmailError("");
    }
  }, [form.email]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    if (emailError || !agreeTerms) {
      setMessage({ type: "error", text: "Please fix the errors before submitting." });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const res = await axios.post("/api/auth/login", form);
      login(res.data);
      localStorage.setItem("userId", res.data.user._id);
      setMessage({ type: "success", text: "Login successful!" });
      showSuccessToast("Login successful");
      setForm({ email: "", password: "" });

      let redirectPath = from;
      if (res.data.user.role === "superadmin") redirectPath = "/super-admin";
      else if (res.data.user.role === "admin") redirectPath = "/admin-dashboard";

      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1000);
    } catch (err) {
      const errorText = err.response?.data?.message || "Invalid credentials.";
      setMessage({ type: "error", text: errorText });
      showErrorToast(errorText);
    } finally {
      setLoading(false);
    }
  };

  const layoutBackground =
    "radial-gradient(circle at top left, rgba(114, 103, 255, 0.35), transparent 45%), radial-gradient(circle at bottom right, rgba(118, 75, 162, 0.4), transparent 40%), linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #312e81 100%)";

  const formShellStyles = {
    p: { xs: 4, sm: 5 },
    borderRadius: 4,
    boxShadow: "0 30px 60px rgba(15,15,45,0.35)",
    backgroundColor: "rgba(255,255,255,0.97)",
    border: "1px solid rgba(255,255,255,0.4)",
    backdropFilter: "blur(14px)",
  };

  const textFieldStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2.5,
      "& fieldset": { borderColor: "rgba(99,102,241,0.3)" },
      "&:hover fieldset": { borderColor: "rgba(99,102,241,0.6)" },
      "&.Mui-focused fieldset": { borderColor: "primary.main" },
    },
  };

  return (
    <Box sx={{ minHeight: "100vh", background: layoutBackground, display: "flex", alignItems: "center", justifyContent: "center", px: { xs: 2, sm: 4 }, py: { xs: 6, md: 0 } }}>
      <Container maxWidth="sm" sx={{ px: { xs: 0, sm: 2 } }}>
        <Paper elevation={0} sx={formShellStyles}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
           
           
            <img 
              src={logo} 
              alt="ProFinder Logo" 
              style={{ height: 100, marginRight: 8 }} 
            />
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Sign in
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access your projects, chats, and insights instantly.
            </Typography>
          </Box>

          {message.text && <Alert severity={message.type} sx={{ mb: 3 }}>{message.text}</Alert>}

          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={!!emailError}
            helperText={emailError}
            margin="normal"
            required
            disabled={loading}
            sx={textFieldStyles}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            margin="normal"
            required
            disabled={loading}
            sx={textFieldStyles}
          />

          <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
            <Checkbox checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} name="agreeTerms" color="primary" disabled={loading} sx={{ p: 0, mr: 1.5 }} />
            <Box sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
              I agree to the&nbsp;
              <Link component="button" onClick={() => setOpenDialog("terms")} sx={{ fontSize: "inherit", textDecoration: "underline" }}>Terms & Conditions</Link>
              &nbsp;and&nbsp;
              <Link component="button" onClick={() => setOpenDialog("privacy")} sx={{ fontSize: "inherit", textDecoration: "underline" }}>Privacy Policy</Link>
            </Box>
          </Box>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            onClick={handleLogin}
            disabled={loading || !form.email || !form.password || !agreeTerms || emailError}
            sx={{ mt: 3, py: 1.5, borderRadius: 3 }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Sign In"}
          </Button>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <Link component="button" onClick={() => navigate("/forgot-password")} sx={{ textDecoration: "none" }}>
                Forgot your password?
              </Link>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Don’t have an account?{" "}
              <Link component="button" onClick={() => navigate("/register")} sx={{ fontWeight: 600, textDecoration: "none", color: "primary.main", "&:hover": { textDecoration: "underline" } }}>
                Register
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>

      <Dialog open={openDialog === "terms"} onClose={() => setOpenDialog("")} fullWidth maxWidth="sm">
        <DialogTitle>Terms & Conditions</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>{termsContent}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog("")}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDialog === "privacy"} onClose={() => setOpenDialog("")} fullWidth maxWidth="sm">
        <DialogTitle>Privacy Policy</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>{privacyContent}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog("")}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Login;
