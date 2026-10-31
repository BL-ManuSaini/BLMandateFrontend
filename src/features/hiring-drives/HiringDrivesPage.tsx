import React from 'react';
import {
  Box, Button, Typography, Table, TableBody, TableCell,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Grid, Chip, IconButton,
  useTheme, Autocomplete, TablePagination, CircularProgress, InputAdornment
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Search, Refresh } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import { ROWS_PER_PAGE } from '../../theme/constants'; // Standard app constant
import {
  useHiringDrives, useCOEs, useCreateHiringDrive, useUpdateHiringDrive, useRequirements, useDeleteHiringDrive
} from '../../api/hooks';
import { toFormDate } from '../../api/mappers/hiring-drive.mapper';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { PageHeader, SectionCard, StatusChip, DataBox } from '../../components/shared';
import dayjs from 'dayjs';
import { formatDate, toTitleCase } from '../../utils';
import type { DriveStatus, HiringDrive } from '../../types';
import { 
  dashboardCardStyle, tableStyles, tableHeaderRowStyles, tableHeaderCellStyles,  
  tableRowStyles, actionIconButtonStyles 
} from '../../style/tableStyles';

const DRIVE_STATUSES: DriveStatus[] = ['planned',  'completed', 'cancelled'];

const schema = z.object({
  coeId: z.string().min(1, 'COE is required'),
  driveName: z.string().min(1, 'Drive name is required'),
  date: z.string().min(1, 'Drive date is required'),
  venue: z.string().min(1, 'Venue is required'),
  techCovered: z.string().min(1, 'Tech covered is required'),
  // requirementId: z.string().min(1, 'Requirement ID is required'), // Removed from UI
  requirementId: z.string().optional(), // kept optional for backward compat with existing data
  notes: z.string().optional(),
  status: z.enum(['planned', 'completed', 'cancelled']).optional(),
});
type FormValues = z.infer<typeof schema>;

export const HiringDrivesPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<HiringDrive | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isViewOnly, setIsViewOnly] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(0);

  const { data: drives = [], isLoading, refetch, isFetching, isError, error } = useHiringDrives();

  React.useEffect(() => {
    if (isError && error) {
      enqueueSnackbar((error as any)?.message || 'Failed to load hiring drives', { variant: 'error' });
    }
  }, [isError, error, enqueueSnackbar]);
  
  const { data: coes = [] } = useCOEs();
  const { mutateAsync: createDrive, isPending: creating } = useCreateHiringDrive();
  const { mutateAsync: updateDrive, isPending: updating } = useUpdateHiringDrive();
  const { mutateAsync: deleteDrive, isPending: deleting } = useDeleteHiringDrive();
  const { data: requirement = [] } = useRequirements();
  
  const canDelete = currentUser && can.deleteHiringDrive(currentUser.role);
  const viewHiringDrive = currentUser && can.viewHiringDrive(currentUser.role);
  
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      coeId: '', driveName: '', date: '', venue: '', techCovered: '', /* requirementId removed from UI */ notes: '', status: 'planned',
    },
  });

  const scopedDrives = React.useMemo(() => {
    return currentUser && can.isCOEScoped(currentUser.role) && currentUser.coeScopeIds.length
      ? drives.filter((d) => currentUser.coeScopeIds.includes(d.coeId))
      : drives;
  }, [drives, currentUser]);

  const filteredDrives = React.useMemo(() => {
    let list = scopedDrives;
    if (statusFilter) {
      list = list.filter((d) => (d.status || 'planned').toLowerCase() === statusFilter.toLowerCase());
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase().trim();
    return list.filter((d) => {
      const coeName = coes.find((c) => c.id === d.coeId)?.name.toLowerCase() || '';
      return d.driveName.toLowerCase().includes(q) ||
             d.venue.toLowerCase().includes(q) ||
             d.techCovered.join(' ').toLowerCase().includes(q) ||
             coeName.includes(q);
    });
  }, [scopedDrives, search, statusFilter, coes]);

  React.useEffect(() => {
    setPage(0);
  }, [search, statusFilter]);

  // Derived slice of records to showcase on the current page view
  const paginatedDrives = React.useMemo(() => {
    return filteredDrives.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE);
  }, [filteredDrives, page]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleClose = () => {
    setOpen(false);
    setIsViewOnly(false);
    setEditing(null);
  };

  const handleOpen = (drive?: HiringDrive, viewMode = false) => {
    setIsViewOnly(viewMode);
    if (drive) {
      setEditing(drive);
      reset({
        coeId: drive.coeId,
        driveName: drive.driveName,
        date: toFormDate(drive.date),
        venue: drive.venue,
        techCovered: drive.techCovered.join(', '),
        // requirementId removed from UI — kept in data but not shown
        notes: drive.notes,
        status: drive.status,
      });
    } else {
      setEditing(null);
      reset({
        coeId: '', driveName: '', date: '', venue: '', techCovered: '', /* requirementId not shown in form */ notes: '', status: 'planned',
      });
    }
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteDrive(deletingId);
      enqueueSnackbar('Hiring Drive deleted successfully', { variant: 'success' });
      setDeletingId(null);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to delete hiring drive', { variant: 'error' });
    }
  };

  const onSubmit = async (data: FormValues) => {
    const techCovered = data.techCovered.split(',').map((t) => t.trim()).filter(Boolean);
    try {
      if (editing) {
        await updateDrive({
          id: editing.id,
          driveName: data.driveName,
          date: data.date,
          venue: data.venue,
          techCovered,
          notes: data.notes ?? '',
          status: data.status ?? editing.status,
          // requirementId is not shown in UI — preserve existing value from the drive
          ...((editing as any).requirementId ? { requirementId: (editing as any).requirementId } : {}),
        });
        enqueueSnackbar('Hiring drive updated', { variant: 'success' });
      } else {
        await createDrive({
          coeId: data.coeId,
          driveName: data.driveName,
          date: data.date,
          venue: data.venue,
          techCovered,
          notes: data.notes ?? '',
          coordinatorId: currentUser?.id ?? '',
          status: 'planned',
          // requirementId is not shown in the form UI
        });
        enqueueSnackbar('Hiring drive created', { variant: 'success' });
      }
      handleClose();
    } catch (err: any) {
      const message = err?.message || err?.error || (editing ? 'Error updating drive' : 'Error creating drive');
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const canManage = currentUser && can.createHiringDrive(currentUser.role);
  const isPending = creating || updating;
  
  // New variable to easily check if the Actions column should render at all
  const showActionsColumn = canManage || viewHiringDrive || canDelete;

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Hiring Drives"
        subtitle={`${scopedDrives.length} drives`}
        action={canManage && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} sx={{ textTransform: "none", fontWeight: 700 }}>
            New Drive
          </Button>
        )}
      />

      <SectionCard 
        isTableCard 
        title={`${filteredDrives.length} Total Drives`}
        action={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search..."
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
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150, bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="planned">Planned</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
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
  <Table sx={{ ...tableStyles, minWidth: 900 }}>
    <TableHead>
      <TableRow sx={tableHeaderRowStyles(isDark)}>
        {[
          { label: 'Drive Name', width: '25%' },
          { label: 'Date', width: '130px' },
          { label: 'Venue', width: '20%' },
          { label: 'Tech Covered', width: '25%' },
          { label: 'Status', width: '110px' },
          ...(showActionsColumn ? [{ label: 'Actions', width: '140px', align: 'center' }] : []),
        ].map((col) => (
          <TableCell 
            key={col.label}
            align={(col.align as any) || "left"}
            sx={{ 
              fontWeight: 700, 
              fontSize: "0.82rem", 
              py: 1.25, 
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
          <TableCell colSpan={showActionsColumn ? 6 : 5} align="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </TableCell>
        </TableRow>
      ) : scopedDrives.length === 0 ? (
        <TableRow>
          <TableCell colSpan={showActionsColumn ? 6 : 5} align="center" sx={{ py: 6 }}>
            <Typography variant="body2" color="text.secondary">No drives found</Typography>
          </TableCell>
        </TableRow>
      ) : (
        paginatedDrives.map((d) => (
          <TableRow key={d.id} hover sx={tableRowStyles(isDark)}>
            
            {/* 1. Drive Name */}
            <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle' }}>
              <DataBox text={toTitleCase(d.driveName)} />
            </TableCell>

            {/* 2. Date */}
            <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {formatDate(d.date)}
              </Typography>
            </TableCell>

            {/* 3. Venue */}
            <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle' }}>
              <Typography variant="caption" sx={{ fontSize: '0.875rem' }}>
                {toTitleCase(d.venue)}
              </Typography>
            </TableCell>

            {/* 4. Tech Covered */}
            <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle' }}>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                {Array.isArray(d.techCovered) && d.techCovered.map((t) => (
                  <Chip 
                    key={t} 
                    label={toTitleCase(t)} 
                    size="small" 
                    sx={{ 
                      fontSize: '0.7rem', 
                      height: 22,
                      borderRadius: 1,
                      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                      color: isDark ? '#94a3b8' : '#64748b',
                      border: '1px solid',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      whiteSpace: 'nowrap'
                    }} 
                  />
                ))}
              </Box>
            </TableCell>

            {/* 5. Status */}
            <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              <StatusChip status={d.status} type="drive" />
            </TableCell>

            {/* 6. Actions (Centered & Perfectly Spaced) */}
            {showActionsColumn && (
              <TableCell align="center" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', width: '140px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.75 }}>
                  
                  {(viewHiringDrive || canManage) && (
                    <IconButton size="small" onClick={() => handleOpen(d, true)} sx={actionIconButtonStyles(isDark)} title="View">
                      <Visibility fontSize="small" />
                    </IconButton>
                  )}
                  
                  {canManage && (
                    <IconButton size="small" onClick={() => handleOpen(d)} sx={actionIconButtonStyles(isDark)} title="Edit">
                      <Edit fontSize="small" />
                    </IconButton>
                  )}
                  
                  {canDelete && (
                    <IconButton size="small" onClick={() => setDeletingId(d.id)} sx={actionIconButtonStyles(isDark, 'error')} title="Delete">
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </TableCell>
            )}

          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</Box>

        <Box sx={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
          <TablePagination
            component="div"
            count={scopedDrives.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={ROWS_PER_PAGE}
            rowsPerPageOptions={[]}
          />
        </Box>
      </SectionCard>

      {/* Dialog remains identical */}
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
          {isViewOnly ? 'Hiring Drive Details' : (editing ? 'Edit Hiring Drive' : 'Create Hiring Drive')}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2} pt={1}>
              <Grid item xs={12}>
                <Controller name="driveName" control={control} render={({ field }) => (
                  <TextField {...field} value={isViewOnly ? toTitleCase(field.value) : field.value} required label="Drive Name" fullWidth error={!!errors.driveName} helperText={errors.driveName?.message} disabled={isViewOnly} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="coeId" control={control} render={({ field }) => (
                  <TextField
                    {...field}
                    required
                    label="COE"
                    select
                    fullWidth
                    disabled={!!editing || isViewOnly}
                    error={!!errors.coeId}
                    helperText={errors.coeId?.message}
                  >
                    {coes.map((c) => <MenuItem key={c.id} value={c.id}>{toTitleCase(c.name)}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="date" control={control} render={({ field }) => (
                  <TextField {...field} required label="Drive Date" type="date" inputProps={{ min: dayjs().format('YYYY-MM-DD') }} fullWidth InputLabelProps={{ shrink: true }} error={!!errors.date} helperText={errors.date?.message} disabled={isViewOnly} />
                )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="venue" control={control} render={({ field }) => (
                  <TextField {...field} value={isViewOnly ? toTitleCase(field.value) : field.value} required label="Venue" fullWidth error={!!errors.venue} helperText={errors.venue?.message} disabled={isViewOnly} />
                )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="techCovered" control={control} render={({ field }) => (
                  <TextField {...field} value={isViewOnly ? toTitleCase(field.value) : field.value} required label="Tech Covered (comma separated)" fullWidth error={!!errors.techCovered} helperText={errors.techCovered?.message || 'e.g. Java, DotNet'} disabled={isViewOnly} />
                )} />
              </Grid>
              {/* Requirement ID field removed from UI per requirements */}
              {/* Previously showed an Autocomplete to pick a requirement ID */}
              {(editing || isViewOnly) && (
                <Grid item xs={12} sm={6}>
                  <Controller name="status" control={control} render={({ field }) => (
                    <TextField {...field} label="Status" select fullWidth disabled={isViewOnly}>
                      {DRIVE_STATUSES.map((s) => (
                        <MenuItem key={s} value={s}>{toTitleCase(s)}</MenuItem>
                      ))}
                    </TextField>
                  )} />
                </Grid>
              )}
              <Grid item xs={12}>
                <Controller name="notes" control={control} render={({ field }) => (
                  <TextField {...field} label="Notes" fullWidth multiline rows={2} disabled={isViewOnly} />
                )} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} color="error" sx={{ textTransform: "none", fontWeight: 700 }}>
              {isViewOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isViewOnly && (
              <Button type="submit" variant="contained" disabled={creating || updating} sx={{ textTransform: "none", fontWeight: 700 }}>
                {(creating || updating) ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
                {(creating || updating) ? 'Saving...' : (editing ? 'Save Changes' : 'Create Drive')}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete this hiring drive? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeletingId(null)} color="error" disabled={deleting} sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting} sx={{ textTransform: "none", fontWeight: 700 }}>
            {deleting ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};