// 📁 client/src/pages/Register.jsx
import React, { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Checkbox,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
  InputAdornment,
  Grid,
  useTheme,
  useMediaQuery,
  Stack,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { PersonAdd as RegisterIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Logo from "../assets/logo.png";
import { showSuccessToast, showErrorToast } from "../components/CustomToast";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [otp, setOtp] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [openDialog, setOpenDialog] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "email") {
      if (!value.includes(".com")) setEmailError("Invalid Gmail");
      else setEmailError("");
    }
    if (name === "password") {
      if (value.length < 4 || value.length > 8)
        setPasswordError("4 to 8 chars required");
      else setPasswordError("");
    }
  };

  const handleSendOtp = async () => {
    if (!form.email || emailError) {
      showErrorToast("Please enter a valid email address");
      return;
    }
    
    try {
      setLoading(true);
      console.log('Current API URL:', axios.defaults.baseURL);
      console.log('Sending OTP to:', form.email);
      
      const response = await axios.post("/api/auth/send-otp", { email: form.email });
      console.log('OTP response:', response.data);
      showSuccessToast("OTP sent to your email. Please check your inbox and spam folder.");
      setEmailSent(true);
    } catch (err) {
      console.error('OTP send error:', err);
      
      // // For development/testing - allow bypass if server is down
      // if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error' || err.response?.status >= 500) {
      //   console.log('Server error detected, enabling development bypass');
      //   showSuccessToast("Development mode: OTP bypass enabled. Use 123456 as OTP.");
      //   setEmailSent(true);
      //   // Store a test OTP for development
      //   window.testOTP = '123456';
      //   return;
      // }
      
      let errorMsg = "Failed to send OTP. Please try again.";
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      showErrorToast(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      showErrorToast("Please enter a valid 6-digit OTP");
      return;
    }
    
    try {
      setLoading(true);
      
      // Check for development bypass
      if (window.testOTP && otp === window.testOTP) {
        console.log('Development bypass: OTP verified');
        showSuccessToast("Email verified successfully! (Development mode)");
        setEmailVerified(true);
        return;
      }
      
      console.log('Verifying OTP:', otp, 'for email:', form.email);
      const response = await axios.post("/api/auth/verify-otp", { email: form.email, otp });
      console.log('OTP verification response:', response.data);
      showSuccessToast("Email verified successfully!");
      setEmailVerified(true);
    } catch (err) {
      console.error('OTP verification error:', err);
      const errorMsg = err.response?.data?.message || "OTP verification failed. Please try again.";
      showErrorToast(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!emailVerified || !agreeTerms || emailError || passwordError) {
      showErrorToast("Fix errors, verify email, and agree to terms");
      return;
    }
    try {
      setLoading(true);
      await axios.post("/api/auth/register", form);
      showSuccessToast("Registered successfully");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Register failed");
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
          <Box textAlign="center" mb={3}>
            
          <img 
              src={Logo} 
              alt="ProFinder Logo" 
              style={{ height: 100, marginRight: 8 }} 
            />
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Create your account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Verify your email to unlock curated leads tailored to you.
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            margin="normal"
            required
            disabled={loading}
            sx={textFieldStyles}
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            margin="normal"
            required
            error={!!emailError}
            helperText={emailError}
            disabled={loading}
            sx={textFieldStyles}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Typography
                    component="span"
                    sx={{
                      color: emailVerified ? "success.main" : "primary.main",
                      fontWeight: emailVerified ? 600 : 500,
                      cursor: emailVerified ? "default" : "pointer",
                      fontSize: "0.85rem",
                    }}
                    onClick={!emailVerified ? handleSendOtp : undefined}
                  >
                    {emailVerified ? "✔ Verified" : emailSent ? "Resend OTP" : "Send OTP"}
                  </Typography>
                </InputAdornment>
              ),
            }}
          />
          {emailSent && !emailVerified && (
            <TextField
              fullWidth
              label="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              sx={textFieldStyles}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button onClick={handleVerifyOtp} size="small" disabled={!otp || loading}>
                      Verify OTP
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          )}
          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            margin="normal"
            required
            error={!!passwordError}
            helperText={passwordError}
            disabled={loading}
            sx={textFieldStyles}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end" size="small">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
            <Checkbox checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} disabled={loading} />
            <Typography variant="body2" color="text.secondary">
              I agree to the{" "}
              <Link component="button" onClick={() => setOpenDialog("terms")} sx={{ textDecoration: "underline" }}>
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link component="button" onClick={() => setOpenDialog("privacy")} sx={{ textDecoration: "underline" }}>
                Privacy Policy
              </Link>
            </Typography>
          </Box>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleSubmit}
            disabled={
              loading ||
              !agreeTerms ||
              !emailVerified ||
              !form.name ||
              !!emailError ||
              !!passwordError ||
              !form.password
            }
            sx={{ mt: 3, py: 1.5, borderRadius: 3 }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Sign Up"}
          </Button>
          <Box textAlign="center" mt={3}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{" "}
              <Link component="button" onClick={() => navigate("/login")} sx={{ fontWeight: 600, color: "primary.main" }}>
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>

      <Dialog open={openDialog === "terms"} onClose={() => setOpenDialog("")} fullWidth maxWidth="sm">
        <DialogTitle>Terms & Conditions</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
            Welcome to ProFinder!\n\nBy registering on our platform, you agree to abide by our terms and conditions...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog("")}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDialog === "privacy"} onClose={() => setOpenDialog("")} fullWidth maxWidth="sm">
        <DialogTitle>Privacy Policy</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
            Privacy Policy for ProFinder\n\nWe value your privacy and ensure your data is protected...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog("")}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Register;
