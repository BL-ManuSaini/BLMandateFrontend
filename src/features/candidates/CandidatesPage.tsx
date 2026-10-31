import React from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TablePagination,
  TextField, MenuItem, Grid, Typography, Chip, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow, Avatar, useTheme, CircularProgress,
  InputAdornment, Alert
} from '@mui/material';
import { Add, Edit, Delete, Upload, Download, Search, Visibility, Refresh } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
// import { ROWS_PER_PAGE } from '../../theme/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import {
  useCandidates, useCOEs, useCreateCandidate, useUpdateCandidate, useImportCandidates, useDeleteCandidate,
} from '../../api/hooks';
import type { CandidateApiStatus } from '../../api/types/candidate';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { StatusChip, PageHeader, SectionCard, DataBox, DebouncedSearch } from '../../components/shared';
import { parseCandidateImportCSV, downloadCandidateImportTemplate, STREAMS, toTitleCase } from '../../utils';
import { CandidateStatus } from '../../types';
import type { Candidate } from '../../types';
import { 
  dashboardCardStyle, tableStyles, tableHeaderRowStyles, tableHeaderCellStyles, 
  tableRowStyles, actionIconButtonStyles, tableBodyCellSecondaryStyles 
} from '../../style/tableStyles';
import { ROWS_PER_PAGE } from '../../theme/constants';

const schema = z.object({
  name: z.string().min(2, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Invalid phone'),
  coeId: z.string().min(1, 'Required'),
  graduationYear: z.coerce.number().min(2020, 'Required').max(2030, 'Required'),
  stream: z.string().min(1, 'Required'),
  skills: z.string().min(1, 'Required'),
  cgpa: z.coerce.number().min(0, 'Required').max(10, 'Required'),
  rollNumber: z.string().optional(),
  coeName: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const API_STATUS_VALUES: CandidateApiStatus[] = [
  CandidateStatus.SELECTED,
  CandidateStatus.PROPOSED,
  CandidateStatus.MAPPED,
  CandidateStatus.DISCUSSED,
  CandidateStatus.LOI_SENT,
  CandidateStatus.LOI_SIGNED,
  CandidateStatus.CFP_STARTED,
  CandidateStatus.DROPPED,
];

export const CandidatesPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Candidate | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isViewOnly, setIsViewOnly] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [coeFilter, setCoeFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<CandidateStatus | ''>(''); // Fixed: Declared missing statusFilter state
  const [page, setPage] = React.useState(0);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const listParams = React.useMemo(() => {
    const params: { search?: string; coeId?: string; status?: CandidateApiStatus } = {};
    if (search) params.search = search;
    if (coeFilter) params.coeId = coeFilter;
    if (statusFilter) {
      params.status = statusFilter as CandidateApiStatus;
    }
    return Object.keys(params).length ? params : undefined;
  }, [search, statusFilter, coeFilter]);

  const { data: candidates = [], isLoading, refetch, isFetching, isError, error } = useCandidates(listParams);
  const { data: coes = [] } = useCOEs();


  console.log("coe dadata", coes)
  const { mutateAsync: createCandidate, isPending: creating } = useCreateCandidate();
  const { mutateAsync: updateCandidate, isPending: updating } = useUpdateCandidate();
  const { mutateAsync: importCandidates, isPending: importing } = useImportCandidates();
  const { mutateAsync: deleteCandidate, isPending: deleting } = useDeleteCandidate();

  const canDelete = currentUser && can.deleteCandidate(currentUser.role);
  const creteCondidate = currentUser && can.createCandidates(currentUser.role)
  const viewCondidate = currentUser && can.viewCandidate(currentUser.role)

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', coeId: '', graduationYear: 0, stream: '', skills: '', cgpa: 0.0, rollNumber: '', coeName: '' },
  });

  const watchedCoeId = watch('coeId');
  React.useEffect(() => {
    if (watchedCoeId) {
      const coeObj = coes.find((c) => c.id === watchedCoeId);
      if (coeObj) {
        setValue('coeName', coeObj.name);
      }
    }
  }, [watchedCoeId, coes, setValue]);

  // Filter out data scoped down by role permissions
  const scopedCandidates = React.useMemo(() => {
    if (currentUser && can.isCOEScoped(currentUser.role) && currentUser.coeScopeIds.length) {
      return candidates.filter((c) => currentUser.coeScopeIds.includes(c.coeId));
    }
    return candidates;
  }, [candidates, currentUser]);

  // Handle local memory filtering
  const filteredCandidates = React.useMemo(() => {
    return scopedCandidates.filter((c) => {
      if (statusFilter === 'Discussed') return c.status === 'Discussed';
      if (statusFilter) return c.status === statusFilter;
      return true;
    });
  }, [scopedCandidates, statusFilter]);

  // Reset page position if filters remove row counts drastically
  React.useEffect(() => {
    setPage(0);
  }, [search, coeFilter, statusFilter]);

  React.useEffect(() => {
    if (isError && error) {
      enqueueSnackbar((error as any)?.message || 'Failed to load candidates', { variant: 'error' });
    }
  }, [isError, error, enqueueSnackbar]);

  // Slice list for local pagination display
  const paginatedCandidates = React.useMemo(() => {
    return filteredCandidates.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE);
  }, [filteredCandidates, page]);

  const handleClose = () => {
    setOpen(false);
    setIsViewOnly(false);
    setEditing(null);
  };

  const handleOpen = (candidate?: Candidate, viewMode = false) => {
    setIsViewOnly(viewMode);
    if (candidate) {
      setEditing(candidate);
      reset({
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        coeId: candidate.coeId,
        graduationYear: candidate.graduationYear,
        stream: candidate.stream,
        skills: candidate.skills.join(', '),
        cgpa: candidate.cgpa,
        rollNumber: (candidate as any).rollNumber || '',
        coeName: (candidate as any).coeName || '',
      });
    } else {
      setEditing(null);
      reset({ name: '', email: '', phone: '', coeId: '', graduationYear: 2025, stream: '', skills: '', cgpa: 7.5, rollNumber: '', coeName: '' });
    }
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteCandidate(deletingId);
      enqueueSnackbar('Candidate deleted successfully', { variant: 'success' });
      setDeletingId(null);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to delete candidate', { variant: 'error' });
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        coeId: data.coeId,
        graduationYear: data.graduationYear,
        stream: toTitleCase(data.stream),
        skills: data.skills.split(',').map((s) => s.trim()).filter(Boolean),
        cgpa: data.cgpa,
        status: (editing?.status || CandidateStatus.SELECTED) as CandidateStatus,
        resumeLink: editing?.resumeLink || '',
        rollNumber: data.rollNumber || '',
        coeName: data.coeName || '',
      };

      if (editing) {
        await updateCandidate({ id: editing.id, ...payload });
        enqueueSnackbar('Candidate updated', { variant: 'success' });
      } else {
        await createCandidate(payload);
        enqueueSnackbar('Candidate added', { variant: 'success' });
      }
      handleClose();
    } catch (err: any) {
      const message = err?.message || err?.error || (err instanceof Error ? err.message : 'Error saving candidate');
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleDownloadTemplate = () => {
    const sampleCoeName =
      coes.find((c) => /^COE\s+/i.test(c.name))?.name ?? 'COE Hyderabad';
    downloadCandidateImportTemplate({ sampleCoeName });
    enqueueSnackbar('Template downloaded — fill rows and use Import CSV', { variant: 'info' });
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const rows = await parseCandidateImportCSV(file);
      const result = await importCandidates(rows);
      const variant = result.failed > 0 ? 'warning' : 'success';
      enqueueSnackbar(
        `Import complete: ${result.success} succeeded, ${result.failed} failed`,
        { variant }
      );
      if (result.errors.length) {
        enqueueSnackbar(result.errors.slice(0, 3).join('; '), { variant: 'warning' });
      }
    } catch (err: any) {
      const message = err?.message || err?.error || (err instanceof Error ? err.message : 'Import failed');
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={handleImportFile}
      />


{
  creteCondidate&& (
    <PageHeader
        title="Candidates"
        subtitle={`${filteredCandidates.length} of ${candidates.length} candidates`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {currentUser  && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  size="small"
                  onClick={handleDownloadTemplate}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Download Template
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  size="small"
                  disabled={importing}
                  onClick={handleImportClick}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  {importing ? 'Importing...' : 'Import CSV'}
                </Button>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} sx={{ textTransform: "none", fontWeight: 700 }}>
                  Add Candidate
                </Button>
              </>
            )}
          </Box>
        }
      />

  )
}
      

      <SectionCard
        title={`${filteredCandidates.length} Total Candidates`}
        isTableCard
        action={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <DebouncedSearch
              value={search}
              onChange={(val) => setSearch(val)}
              placeholder="Search..."
            />
            <TextField
              select
              size="small"
              label="COE"
              value={coeFilter}
              onChange={(e) => setCoeFilter(e.target.value)}
              sx={{ minWidth: 100, bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            >
              <MenuItem value="">All COEs</MenuItem>
              {coes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CandidateStatus | '')}
              sx={{ minWidth: 110, bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            >
              <MenuItem value="">All Status</MenuItem>
              {API_STATUS_VALUES.map((status) => (
                <MenuItem key={status} value={status}>
                  {toTitleCase(status)}
                </MenuItem>
              ))}
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
  <Table sx={{ ...tableStyles, minWidth: 950 }}>
    <TableHead>
      <TableRow sx={tableHeaderRowStyles(isDark)}>
        {[
          { label: 'Candidate Name', width: '280px' },
          { label: 'COE', width: '12%' },
          { label: 'Stream', width: '12%' },
          { label: 'Skills', width: '22%' },
          { label: 'CGPA', width: '90px' },
          { label: 'Status', width: '110px' },
          { label: 'Actions', width: '140px', align: 'center' },
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
          <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </TableCell>
        </TableRow>
      ) : paginatedCandidates.map((c) => {
        const matchingCoe = coes.find((coeItem) => coeItem.id === c.coeId);
        console.log("ccccc", c.name)

        return (
          <TableRow key={c.id} hover sx={tableRowStyles(isDark)}>
            
            {/* 1. Candidate Name */}
            <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', width: '280px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  sx={{ width: 34, height: 34, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'primary.main', color: '#ffffff', flexShrink: 0 }}
                >
                  {(c.name || c.email || '-').split(' ').map((w: string) => w[0]).join('').slice(0).toUpperCase() }
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <DataBox text={toTitleCase(c?.name)} />
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', display: 'block', color: 'text.secondary', mt: 0.5, whiteSpace: 'nowrap' }}>
                    {c.email}
                  </Typography>
                </Box>
              </Box>
            </TableCell>
            {/* 2. Coe */}
            <TableCell align="left" sx={{ ...tableBodyCellSecondaryStyles(isDark), py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {toTitleCase(matchingCoe ? matchingCoe.name : "-")}
              </Typography>
            </TableCell>

            {/* 3. Stream */}
            <TableCell align="left" sx={{ ...tableBodyCellSecondaryStyles(isDark), py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {toTitleCase(c.stream)}
              </Typography>
            </TableCell>

            {/* 4. Skills */}
            <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle' }}>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', maxWidth: 250 }}>
                {c.skills.slice(0, 3).map((s: string) => (
                  <Chip
                    key={s}
                    label={toTitleCase(s)}
                    size="small"
                    sx={{
                      fontSize: '0.7rem',
                      height: 22,
                      borderRadius: 1,
                      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                      color: isDark ? '#94a3b8' : '#64748b',
                      border: '1px solid',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      whiteSpace: 'nowrap',
                    }}
                  />
                ))}
                {c.skills.length > 3 && (
                  <Chip
                    label={`+${c.skills.length - 3}`}
                    size="small"
                    sx={{
                      fontSize: '0.7rem',
                      height: 22,
                      borderRadius: 1,
                      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                      color: isDark ? '#94a3b8' : '#64748b',
                      border: '1px solid',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                    }}
                  />
                )}
              </Box>
            </TableCell>

            {/* 5. CGPA */}
            <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle' }}>
              <Chip
                label={c.cgpa.toFixed(1)}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  height: 22,
                  borderRadius: 1,
                  backgroundColor:
                    c.cgpa >= 8 ? (isDark ? '#065f3c' : '#dcfce7') :
                    c.cgpa >= 6 ? (isDark ? '#854d0e' : '#fef9c3') :
                    (isDark ? '#991b1b' : '#fee2e2'),
                  color:
                    c.cgpa >= 8 ? (isDark ? '#86efac' : '#15803d') :
                    c.cgpa >= 6 ? (isDark ? '#fde047' : '#ca8a04') :
                    (isDark ? '#fca5a5' : '#dc2626'),
                }}
              />
            </TableCell>

            {/* 6. Status */}
            <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              <StatusChip status={c.status} type="candidate" />
            </TableCell>

            {/* 7. Actions (Centered Alignment) */}
            <TableCell align="center" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', width: '140px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.75 }}>
                {
                  viewCondidate&&(
                     <IconButton size="small" onClick={() => handleOpen(c, true)} sx={actionIconButtonStyles(isDark)} title="View">
                  <Visibility fontSize="small" />
                </IconButton>

                  )
                }
               
               {
                creteCondidate&&(
                  <IconButton size="small" onClick={() => handleOpen(c)} sx={actionIconButtonStyles(isDark)} title="Edit">
                  <Edit fontSize="small" />
                </IconButton>

                )
               }
                
                {
                  canDelete && (
                     <IconButton size="small" onClick={() => setDeletingId(c.id)} sx={actionIconButtonStyles(isDark, 'error')} title="Delete">
                  <Delete fontSize="small" />
                </IconButton>
                  )
                }
               
              </Box>
            </TableCell>

          </TableRow>
        );
      })}

      {!isLoading && filteredCandidates.length === 0 && (
        <TableRow>
          <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
            <Typography variant="body2" color="text.secondary">No candidates found</Typography>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
</Box>
        {/* Fixed: Moved out of Table wrapper context to render valid HTML structure */}
        <TablePagination
          component="div"
          count={filteredCandidates.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={ROWS_PER_PAGE}
          rowsPerPageOptions={[]}
        />
      </SectionCard>

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
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {isViewOnly ? 'Candidate Details' : (editing ? 'Edit Candidate Details' : 'Add New Candidate')}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} pt={1}>
              <Grid item xs={12} sm={6}>
                <Controller name="rollNumber" control={control} render={({ field }) => (
                  <TextField {...field} required label="Roll Number" fullWidth error={!!errors.rollNumber} helperText={errors.rollNumber?.message} disabled={isViewOnly} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="name" control={control} render={({ field }) => (
                  <TextField {...field} value={isViewOnly ? toTitleCase(field.value) : field.value} required label="Full Name" fullWidth error={!!errors.name} helperText={errors.name?.message} disabled={isViewOnly} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="email" control={control} render={({ field }) => (
                  <TextField {...field} required label="Email" fullWidth error={!!errors.email} helperText={errors.email?.message} disabled={isViewOnly} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="phone" control={control} render={({ field }) => (
                  <TextField {...field} required label="Phone" fullWidth error={!!errors.phone} helperText={errors.phone?.message} disabled={isViewOnly} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="coeId" control={control} render={({ field }) => (
                  <TextField {...field} required label="COE" select fullWidth error={!!errors.coeId} helperText={errors.coeId?.message} disabled={isViewOnly}>
                    {coes.map((c) => <MenuItem key={c.id} value={c.id}>{toTitleCase(c.name)}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="graduationYear" control={control} render={({ field }) => (
                  <TextField {...field} required label="Graduation Year" type="number" fullWidth error={!!errors.graduationYear} helperText={errors.graduationYear?.message} disabled={isViewOnly} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="stream" control={control} render={({ field }) => {
                  const streamOptions = Array.from(new Set([...STREAMS, ...(field.value ? [field.value] : [])]));
                  return (
                    <TextField {...field} required label="Stream" select fullWidth error={!!errors.stream} helperText={errors.stream?.message} disabled={isViewOnly}>
                      {streamOptions.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                  );
                }} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="skills" control={control} render={({ field }) => (
                  <TextField {...field} value={isViewOnly ? toTitleCase(field.value) : field.value} required label="Skills (comma separated)" fullWidth error={!!errors.skills} helperText={errors.skills?.message || 'e.g. Java, Spring Boot, MySQL'} disabled={isViewOnly} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="cgpa" control={control} render={({ field }) => (
                  <TextField {...field} required label="CGPA (0-10)" type="number" inputProps={{ step: 0.1 }} fullWidth error={!!errors.cgpa} helperText={errors.cgpa?.message} disabled={isViewOnly} />
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
                {(creating || updating) ? (
                  <>
                    <span className="spinner-border" style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', marginRight: 6 }} />
                    Saving...
                  </>
                ) : (
                  editing ? 'Update Candidate' : 'Add Candidate'
                )}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete this candidate? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeletingId(null)} color="error" sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting} sx={{ textTransform: "none", fontWeight: 700 }}>
            {deleting ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};