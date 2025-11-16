import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Input,
  FormHelperText,
  Avatar,
  Chip,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CloudUpload, AddCircle } from "@mui/icons-material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import axios from "../api/axios";

const validationSchema = Yup.object().shape({
  profession: Yup.string().required("Profession is required"),
  experience: Yup.string().required("Experience is required"),
  city: Yup.string().required("City is required"),
  pincode: Yup.string()
    .matches(/^[0-9]{6}$/, "Pincode must be 6 digits")
    .required("Pincode is required"),
  gender: Yup.string().required("Gender is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  village: Yup.string().required("Village is required"),
  taluka: Yup.string().required("Taluka is required"),
  district: Yup.string().required("District is required"),
  skills: Yup.array().of(Yup.string().required("Skill cannot be empty")),
  specializations: Yup.array().of(
    Yup.string().required("Specialization cannot be empty")
  ),
  priceRange: Yup.string().required("Price range is required"),
});

const initialValues = {
  profession: "",
  experience: "",
  city: "",
  pincode: "",
  mobile: "",
  gender: "",
  email: "",
  profilePhoto: null,
  aadharCard: null,
  voterId: null,
  latitude: "",
  longitude: "",
  village: "",
  taluka: "",
  district: "",
  amount: "5",
  skills: [],
  specializations: [],
  priceRange: "",
};

// Google Maps reverse geocode (optional)
const GOOGLE_MAPS_API_KEY = "AIzaSyCCRDdzC4-8aMliCT4at-LTN0bB12GwkA0";

const fetchAddressFromCoords = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.status === "OK") {
      const addressComponents = data.results[0].address_components;
      let village = "",
        taluka = "",
        district = "";
      addressComponents.forEach((comp) => {
        if (comp.types.includes("sublocality_level_1"))
          village = comp.long_name;
        if (comp.types.includes("administrative_area_level_2"))
          district = comp.long_name;
        if (comp.types.includes("locality")) taluka = comp.long_name;
      });
      return { village, taluka, district };
    }
  } catch (err) {
    toast.error("Failed to fetch address from location");
  }
  return {};
};

const AdminForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [skillInput, setSkillInput] = useState("");
  const [specializationInput, setSpecializationInput] = useState("");

  const handleFileChange = (e, setFieldValue, field) => {
    const file = e.currentTarget.files[0] || null;
    setFieldValue(field, file);
    if (field === "profilePhoto" && file) {
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleAddSkill = (setFieldValue, values) => {
    if (skillInput.trim() !== "") {
      setFieldValue("skills", [...values.skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (index, setFieldValue, values) => {
    const newSkills = [...values.skills];
    newSkills.splice(index, 1);
    setFieldValue("skills", newSkills);
  };

  const handleAddSpecialization = (setFieldValue, values) => {
    if (specializationInput.trim() !== "") {
      setFieldValue("specializations", [
        ...values.specializations,
        specializationInput.trim(),
      ]);
      setSpecializationInput("");
    }
  };

  const handleRemoveSpecialization = (index, setFieldValue, values) => {
    const newSpecs = [...values.specializations];
    newSpecs.splice(index, 1);
    setFieldValue("specializations", newSpecs);
  };

  const fetchAddressFromCoords = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();

      // Inspect what OpenStreetMap returns
      console.log("Fetched location data:", data);

      // Extract values safely
      return {
        village:
          data.address.village ||
          data.address.suburb ||
          data.address.hamlet ||
          data.address.town ||
          "",
        taluka:
          data.address.county ||
          data.address.state_district ||
          data.address.city_district ||
          "",
        district:
          data.address.state ||
          data.address.region ||
          data.address.district ||
          "",
      };
    } catch (error) {
      console.error("Error fetching address:", error);
      return {};
    }
  };

  const handleFetchLocation = async (setFieldValue) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFieldValue("latitude", latitude);
        setFieldValue("longitude", longitude);

        const address = await fetchAddressFromCoords(latitude, longitude);

        // Safely handle missing data
        if (address.village) setFieldValue("village", address.village);
        if (address.taluka) setFieldValue("taluka", address.taluka);
        if (address.district) setFieldValue("district", address.district);

        toast.success("Location fetched successfully!");
        console.log(
          `📍 Location fetched:\nVillage: ${address.village}\nTaluka: ${address.taluka}\nDistrict: ${address.district}`
        );
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Unable to retrieve your location");
      }
    );
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    console.log("✅ Form submitted with values:", values);
    setLoading(true);

    if (!values.aadharCard && !values.voterId) {
      toast.error("Upload at least one identity document (Aadhar or Voter ID)");
      setLoading(false);
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          if (Array.isArray(val)) {
            val.forEach((item) => formData.append(`${key}[]`, item));
          } else if (
            key !== "profilePhoto" &&
            key !== "aadharCard" &&
            key !== "voterId"
          ) {
            formData.append(key, val);
          }
        }
      });

      if (values.profilePhoto)
        formData.append("profilePhoto", values.profilePhoto);
      if (values.aadharCard) formData.append("aadharCard", values.aadharCard);
      if (values.voterId) formData.append("voterId", values.voterId);

      const response = await axios.post("/api/admin/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(response.data.message || "Form submitted successfully!");
      resetForm();
      setProfilePreview(null);
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit form");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          Admin Verification Request
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          Submit your professional details and identity documents for admin
          verification.
        </Typography>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, isSubmitting }) => (
            <Form encType="multipart/form-data">
              {/* PERSONAL INFO */}
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Personal & Professional Details
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Category</InputLabel>
                <Field as={Select} name="profession" required>
                  <MenuItem value="Doctor">Doctor</MenuItem>
                  <MenuItem value="Lawyer">Lawyer</MenuItem>
                  <MenuItem value="Engineer">Engineer</MenuItem>
                  <MenuItem value="Teacher">Teacher</MenuItem>
                  <MenuItem value="Accountant">Accountant</MenuItem>
                  <MenuItem value="Architect">Architect</MenuItem>
                  <MenuItem value="Consultant">Consultant</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Field>
                {touched.profession && errors.profession && (
                  <FormHelperText error>{errors.profession}</FormHelperText>
                )}
              </FormControl>

              <Field
                as={TextField}
                fullWidth
                label="Years of Experience"
                name="experience"
                margin="normal"
                required
                placeholder="e.g., 5 years"
                error={touched.experience && !!errors.experience}
                helperText={touched.experience && errors.experience}
              />

              <Field
                as={TextField}
                fullWidth
                label="City"
                name="city"
                margin="normal"
                required
                error={touched.city && !!errors.city}
                helperText={touched.city && errors.city}
              />

              <Field
                as={TextField}
                fullWidth
                label="Pincode"
                name="pincode"
                margin="normal"
                required
                inputProps={{ maxLength: 6 }}
                error={touched.pincode && !!errors.pincode}
                helperText={touched.pincode && errors.pincode}
              />

              <Field
                as={TextField}
                fullWidth
                label="Mobile Number"
                name="mobile"
                margin="normal"
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Gender</InputLabel>
                <Field as={Select} name="gender" required>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Field>
                {touched.gender && errors.gender && (
                  <FormHelperText error>{errors.gender}</FormHelperText>
                )}
              </FormControl>

              <Field
                as={TextField}
                fullWidth
                label="Email"
                name="email"
                margin="normal"
                required
                error={touched.email && !!errors.email}
                helperText={touched.email && errors.email}
              />

              {/* SKILLS */}
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Skills
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Enter a skill"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                />
                <IconButton
                  color="primary"
                  onClick={() => handleAddSkill(setFieldValue, values)}
                >
                  <AddCircle />
                </IconButton>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {values.skills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    onDelete={() =>
                      handleRemoveSkill(index, setFieldValue, values)
                    }
                    color="primary"
                  />
                ))}
              </Box>

              {/* SPECIALIZATIONS */}
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Specializations
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Enter a specialization"
                  value={specializationInput}
                  onChange={(e) => setSpecializationInput(e.target.value)}
                />
                <IconButton
                  color="primary"
                  onClick={() => handleAddSpecialization(setFieldValue, values)}
                >
                  <AddCircle />
                </IconButton>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {values.specializations.map((spec, index) => (
                  <Chip
                    key={index}
                    label={spec}
                    onDelete={() =>
                      handleRemoveSpecialization(index, setFieldValue, values)
                    }
                    color="secondary"
                  />
                ))}
              </Box>

              {/* PRICE RANGE */}
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Service Price Range
              </Typography>
              <Field
                as={TextField}
                fullWidth
                label="Enter a price range (e.g., 500-1000)"
                name="priceRange"
                margin="normal"
                required
                placeholder="500-1000"
                error={touched.priceRange && !!errors.priceRange}
                helperText={touched.priceRange && errors.priceRange}
              />

              {/* LOCATION */}
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Address Details
              </Typography>

              <Button
                variant="outlined"
                sx={{ mb: 2 }}
                onClick={() => handleFetchLocation(setFieldValue)}
              >
                Fetch My Location
              </Button>

              <Field
                as={TextField}
                fullWidth
                label="Village"
                name="village"
                margin="normal"
                required
                error={touched.village && !!errors.village}
                helperText={touched.village && errors.village}
              />
              <Field
                as={TextField}
                fullWidth
                label="Taluka"
                name="taluka"
                margin="normal"
                required
                error={touched.taluka && !!errors.taluka}
                helperText={touched.taluka && errors.taluka}
              />
              <Field
                as={TextField}
                fullWidth
                label="District"
                name="district"
                margin="normal"
                required
                error={touched.district && !!errors.district}
                helperText={touched.district && errors.district}
              />

              {/* DOCUMENT UPLOADS */}
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Identity Documents
              </Typography>

              <Box
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}
              >
                <Avatar src={profilePreview} sx={{ width: 70, height: 70 }}>
                  {values?.email ? values.email[0].toUpperCase() : "P"}
                </Avatar>
                <label htmlFor="profile-photo-upload">
                  <Input
                    type="file"
                    id="profile-photo-upload"
                    style={{ display: "none" }}
                    inputProps={{ accept: "image/*" }}
                    onChange={(e) =>
                      handleFileChange(e, setFieldValue, "profilePhoto")
                    }
                  />
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                  >
                    {values.profilePhoto
                      ? `${values.profilePhoto.name.substring(0, 6)}...${values.profilePhoto.name.slice(-4)}`
                      : "Upload Profile Photo"}
                  </Button>
                </label>
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <Input
                  type="file"
                  id="aadhar-card-upload"
                  inputProps={{ accept: "image/*,.pdf" }}
                  style={{ display: "none" }}
                  onChange={(e) =>
                    handleFileChange(e, setFieldValue, "aadharCard")
                  }
                />
                <label htmlFor="aadhar-card-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{ py: 2 }}
                  >
                    {values.aadharCard
                      ? values.aadharCard.name
                      : "Upload Aadhar Card"}
                  </Button>
                </label>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <Input
                  type="file"
                  id="voter-id-upload"
                  inputProps={{ accept: "image/*,.pdf" }}
                  style={{ display: "none" }}
                  onChange={(e) =>
                    handleFileChange(e, setFieldValue, "voterId")
                  }
                />
                <label htmlFor="voter-id-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{ py: 2 }}
                  >
                    {values.voterId ? values.voterId.name : "Upload Voter ID"}
                  </Button>
                </label>
              </FormControl>

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3 }}
                disabled={loading || isSubmitting}
              >
                {loading || isSubmitting
                  ? "Submitting..."
                  : "Submit for Verification"}
              </Button>
            </Form>
          )}
        </Formik>
      </Paper>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </Container>
  );
};

export default AdminForm;
