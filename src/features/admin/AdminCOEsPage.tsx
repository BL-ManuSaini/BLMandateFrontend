import React from 'react';
import {
  Box, Table, TableBody, TableCell, TablePagination,
  TableHead, TableRow, useTheme, CircularProgress, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Typography, InputAdornment, Chip
} from '@mui/material';
import { Add, Edit, Delete, Search, Visibility, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useCOEs, useCreateCOE, useUpdateCOE, useDeleteCOE } from '../../api/hooks';
import { PageHeader, SectionCard, DataBox } from '../../components/shared';
import { ROWS_PER_PAGE } from '../../theme/constants';
import { dashboardCardStyle, tableHeaderRowStyles, tableRowStyles, actionIconButtonStyles, tableBodyCellPrimaryStyles, tableBodyCellSecondaryStyles } from '../../style/tableStyles';
import type { COE } from '../../types';
import { toTitleCase } from '../../utils';

export const AdminCOEsPage: React.FC = () => {
  const { data: coes = [], isLoading, refetch, isFetching } = useCOEs();
  const createCOEMutation = useCreateCOE();
  const updateCOEMutation = useUpdateCOE();
  const deleteCOEMutation = useDeleteCOE();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [page, setPage] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [editCoeId, setEditCoeId] = React.useState<string | null>(null);
  const [deletingCoeId, setDeletingCoeId] = React.useState<string | null>(null);
  const [isViewOnly, setIsViewOnly] = React.useState(false);

  // Form states
  const [name, setName] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [spoc, setSpoc] = React.useState('');
  // Kept as string to smoothly handle clearing/typing without forcing initial 0
  const [studentsCount, setStudentsCount] = React.useState<string>('');

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const filteredCOEs = React.useMemo(() => {
    return coes.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase()) ||
      c.spoc.toLowerCase().includes(search.toLowerCase())
    );
  }, [coes, search]);

  React.useEffect(() => {
    setPage(0);
  }, [search]);

  const paginatedCOEs = React.useMemo(() => 
    filteredCOEs.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE), 
    [filteredCOEs, page]
  );

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditCoeId(null);
    setIsViewOnly(false);
    setName('');
    setLocation('');
    setSpoc('');
    setStudentsCount('');
  };

  const handleViewClick = (coe: COE) => {
    setIsViewOnly(true);
    setName(coe.name);
    setLocation(coe.location);
    setSpoc(coe.spoc);
    setStudentsCount(String(coe.studentsCount || 0));
    setOpen(true);
  };

  const handleEditClick = (coe: COE) => {
    setEditCoeId(coe.id);
    setName(coe.name);
    setLocation(coe.location);
    setSpoc(coe.spoc);
    setStudentsCount(String(coe.studentsCount || 0));
    setOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingCoeId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCoeId) return;
    try {
      await deleteCOEMutation.mutateAsync(deletingCoeId);
      enqueueSnackbar('COE deleted successfully', { variant: 'success' });
      setDeletingCoeId(null);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to delete COE', { variant: 'error' });
    }
  };

  // Custom handler to ensure clean numerical typing experience without increments
  const handleStudentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allows empty string (for backspace) or strictly positive integers (no letters, dots, hyphens)
    if (val === '' || /^[0-9\b]+$/.test(val)) {
      setStudentsCount(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericCount = parseInt(studentsCount, 10) || 0;

    if (!name.trim() || !location.trim() || !spoc.trim() || numericCount <= 0) {
      enqueueSnackbar('Please fill all fields with valid data. Capacity must be greater than 0.', { variant: 'warning' });
      return;
    }

    try {
      if (editCoeId) {
        await updateCOEMutation.mutateAsync({
          id: editCoeId,
          name,
          location,
          spoc,
          studentsCount: numericCount,
        });
        enqueueSnackbar('COE updated successfully', { variant: 'success' });
      } else {
        await createCOEMutation.mutateAsync({
          name,
          location,
          spoc,
          studentsCount: numericCount,
        });
        enqueueSnackbar('COE created successfully', { variant: 'success' });
      }
      handleClose();
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to save COE details', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      <PageHeader
        title="COE Management"
        subtitle="All Center of Excellence entities "
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpen}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Create New COE
          </Button>
        }
      />

      <SectionCard
        title={`${filteredCOEs.length} COEs`}
        isTableCard
        action={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search COEs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary', fontSize: 16 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: 200,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '50px',
                  height: 38,
                  fontSize: '0.875rem',
                  backgroundColor: 'background.paper',
                  transition: 'all 0.2s ease-in-out',
                  '& fieldset': {
                    borderColor: 'rgba(99, 102, 241, 0.4)',
                    borderWidth: '1.5px',
                  },
                  '&:hover fieldset': {
                    borderColor: '#6366f1',
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)',
                    '& fieldset': {
                      borderColor: '#6366f1',
                      borderWidth: '1.5px',
                    },
                  },
                },
              }}
            />
            <IconButton 
              size="small" 
              onClick={() => refetch()} 
              disabled={isFetching}
              sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', p: 1 }}
            >
              {isFetching ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Refresh fontSize="small" />
              )}
            </IconButton>
          </Box>
        }
        sx={dashboardCardStyle(theme)}
      >
     <Box sx={{ overflowX: 'auto', width: '100%' }}>
  <Table sx={{ minWidth: 850, width: '100%' }}>
    <TableHead>
      <TableRow sx={tableHeaderRowStyles(isDark)}>
        {[
          { label: 'COE Name', width: '28%' },
          { label: 'Location', width: '22%' },
          { label: 'SPOC', width: '22%' },
          { label: 'Students Capacity', width: '160px' },
          { label: 'Actions', width: '140px', align: 'center' },
        ].map((col) => (
          <TableCell
            key={col.label}
            align={(col.align as any) || "left"}
            sx={{
              fontWeight: 700,
              fontSize: "0.82rem",
              py: 1.25, // Compact vertical padding for a sleek header
              px: 2,
              whiteSpace: 'nowrap',
              borderBottom: 'none',
              backgroundColor: isDark ? '#0f3066' : '#0a3066',
              color: '#ffffff',
              width: col.width,
            }}
          >
            {col.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>

    <TableBody>
      {isLoading ? (
        <TableRow>
          <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </TableCell>
        </TableRow>
      ) : paginatedCOEs.map((coe) => (
        <TableRow key={coe.id} hover sx={tableRowStyles(isDark)}>
          
          {/* 1. COE Name */}
          <TableCell align="left" sx={{ ...tableBodyCellPrimaryStyles(isDark), py: 1.25, px: 2, verticalAlign: 'middle' }}>
            <DataBox text={toTitleCase(coe.name)} />
          </TableCell>

          {/* 2. Location */}
          <TableCell align="left" sx={{ ...tableBodyCellSecondaryStyles(isDark), py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
            <Chip label={toTitleCase(coe.location) || '—'} size="small" sx={{ fontSize: '0.75rem', height: 22 }} />
          </TableCell>

          {/* 3. SPOC */}
          <TableCell align="left" sx={{ ...tableBodyCellSecondaryStyles(isDark), py: 1.25, px: 2, verticalAlign: 'middle' }}>
            {toTitleCase(coe.spoc) || '—'}
          </TableCell>

          {/* 4. Students Capacity */}
          <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
            <Chip 
              label={`${coe.studentsCount || 0} Students`} 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ fontWeight: 700, height: 22, fontSize: '0.75rem', borderRadius: 1 }}
            />
          </TableCell>

          {/* 5. Actions (Centered Alignment) */}
          <TableCell align="center" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', width: '140px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.75 }}>
              <IconButton size="small" onClick={() => handleViewClick(coe)} sx={actionIconButtonStyles(isDark)} title="View">
                <Visibility fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleEditClick(coe)} sx={actionIconButtonStyles(isDark)} title="Edit">
                <Edit fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleDeleteClick(coe.id)} sx={actionIconButtonStyles(isDark, 'error')} title="Delete">
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          </TableCell>

        </TableRow>
      ))}

      {filteredCOEs.length === 0 && !isLoading && (
        <TableRow>
          <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
            <Typography variant="body2" color="text.secondary">No Center of Excellence found</Typography>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>

  <TablePagination
    component="div"
    count={filteredCOEs.length}
    page={page}
    onPageChange={handleChangePage}
    rowsPerPage={ROWS_PER_PAGE}
    rowsPerPageOptions={[]}
  />
</Box>
      </SectionCard>

      {/* Delete COE Confirmation Dialog */}
      <Dialog open={!!deletingCoeId} onClose={() => setDeletingCoeId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete COE</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Are you sure you want to delete this COE? All associated records will be affected.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeletingCoeId(null)} color="error">Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained" 
            sx={{ fontWeight: 700 }}
            disabled={deleteCOEMutation.isPending}
          >
            {deleteCOEMutation.isPending ? (
              <>
                <span className="spinner-border" style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', marginRight: 6 }} />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create / Edit / View COE Dialog */}
      <Dialog 
        open={open} 
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
          }
        }} 
        disableEscapeKeyDown
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isViewOnly ? 'COE Details' : (editCoeId ? 'Edit COE Details' : 'Create New COE')}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="COE Name"
              value={isViewOnly ? toTitleCase(name) : name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              variant="outlined"
              disabled={isViewOnly}
            />
            <TextField
              label="Location"
              value={isViewOnly ? toTitleCase(location) : location}
              onChange={(e) => setLocation(e.target.value)}
              required
              fullWidth
              variant="outlined"
              disabled={isViewOnly}
            />
            <TextField
              label="SPOC (Single Point of Contact)"
              value={isViewOnly ? toTitleCase(spoc) : spoc}
              onChange={(e) => setSpoc(e.target.value)}
              required
              fullWidth
              variant="outlined"
              disabled={isViewOnly}
            />
            <TextField
              label="Students Capacity"
              value={studentsCount}
              onChange={handleStudentsChange}
              required
              fullWidth
              variant="outlined"
              disabled={isViewOnly}
              placeholder="Enter capacity (must be greater than 0)"
              inputProps={{ 
                inputMode: 'numeric', 
                pattern: '[0-9]*' 
              }}
              // Hidden native UI spinners for premium custom keyboard control experience
              sx={{
                '& input[type=number]': {
                  '-moz-appearance': 'textfield',
                },
                '& input[type=number]::-webkit-outer-spin-button': {
                  '-webkit-appearance': 'none',
                  margin: 0,
                },
                '& input[type=number]::-webkit-inner-spin-button': {
                  '-webkit-appearance': 'none',
                  margin: 0,
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} color="error">
              {isViewOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isViewOnly && (
              <Button
                type="submit"
                variant="contained"
                disabled={createCOEMutation.isPending || updateCOEMutation.isPending}
                sx={{ fontWeight: 700 }}
              >
                {(createCOEMutation.isPending || updateCOEMutation.isPending) ? (
                  <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                ) : null}
                {(createCOEMutation.isPending || updateCOEMutation.isPending)
                  ? 'Saving...'
                  : (editCoeId ? 'Save Changes' : 'Create COE')}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingCoeId} onClose={() => setDeletingCoeId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete this COE? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeletingCoeId(null)} color="error" disabled={deleteCOEMutation.isPending} sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm} disabled={deleteCOEMutation.isPending} sx={{ textTransform: "none", fontWeight: 700 }}>
            {deleteCOEMutation.isPending ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
            {deleteCOEMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};