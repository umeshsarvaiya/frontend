import React from 'react'
import { Box, useMediaQuery, useTheme } from '@mui/material';
import AdminList from '../components/AdminList'
import Footer from '../components/Footer';


const HomePage = () => {
  return (
    <Box>
      <AdminList />
      <Footer />
    </Box>
  )
}

export default HomePage