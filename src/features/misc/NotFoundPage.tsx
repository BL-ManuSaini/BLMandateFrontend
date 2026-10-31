import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import HomeIcon from '@mui/icons-material/Home';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 5,
          maxWidth: 480,
          textAlign: 'center',
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <FindInPageIcon sx={{ fontSize: 72, color: 'primary.main', mb: 2, opacity: 0.8 }} />
        <Typography variant="h4" fontWeight={800} gutterBottom>
          404 - Page Not Found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5, lineHeight: 1.6 }}>
          The page or resource you are looking for does not exist or has been moved.
        </Typography>
        <Button
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ textTransform: 'none', fontWeight: 600, px: 3, py: 1 }}
        >
          Back to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};
