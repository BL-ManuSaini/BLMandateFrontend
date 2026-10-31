import React from "react";
import { Card, Typography, useTheme } from "@mui/material";

interface CustomStatCardProps {
  label: string;
  value: string | number;
  sub: string;
  subColor: string;
  borderColor: string;
}

const CustomStatCard: React.FC<CustomStatCardProps> = ({
  label,
  value,
  sub,
  subColor,
  borderColor,
}) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        // 1. Ensures sharp, perfect rectangle edges
        borderRadius: 0, 
        
        // 2. Responsive height handling to prevent layout breaking on smaller laptops
        minHeight: 150,
        height: "100%", 
        
        // Optional: uncommented this as a sharp top border fits a sharp rectangular theme perfectly
        borderTop: `4px solid ${borderColor}`, 
        
        bgcolor: theme.palette.background.paper,
        px: 3.2,
        py: 2.8,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxSizing: "border-box",
        width: "100%", // Let the parent layout container control the width fluidly
      }}
    >
      <Typography
        sx={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#94A3B8",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          lineHeight: 1,
          mb: 2,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          // Fluid typography: sharp look on big screens, slightly scales down on small laptops
          fontSize: { xs: "36px", md: "46px" }, 
          fontWeight: 700,
          color: theme.palette.text.primary,
          lineHeight: 1,
          mb: 1.2,
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>

      <Typography
        sx={{
          fontSize: "14px",
          fontWeight: 500,
          color: subColor,
          lineHeight: 1.2, // Slightly adjusted for better text wrapping if sub-text is long
        }}
      >
        {sub}
      </Typography>
    </Card>
  );
};

export default CustomStatCard;
