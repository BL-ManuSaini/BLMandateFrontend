import React, { useRef, useEffect } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Grid, Typography, Chip, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow, InputAdornment,
  Autocomplete, useTheme, TablePagination, CircularProgress, Alert
} from '@mui/material';
import { Add, Search, Edit, Visibility, Delete, Refresh } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  useRequirements, useMandates, useClients, useCOEs,
  useCreateRequirement, useUpdateRequirement, useDeleteRequirement,
  useTechStacks, useInfiniteLocations
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { StatusChip, CapacityBar, PageHeader, SectionCard, DataBox, capitalizeStatus } from '../../components/shared';
import { formatDate, generateRequirementId, TECH_STACKS, INTAKE_TYPES, EXP_LEVELS, toTitleCase } from '../../utils';
import dayjs from 'dayjs';
import { dashboardCardStyle, tableStyles, tableHeaderRowStyles, tableHeaderCellStyles, tableRowStyles, actionIconButtonStyles, tableBodyCellPrimaryStyles, tableBodyCellSecondaryStyles,  } from '../../style/tableStyles';
import { ROWS_PER_PAGE } from '../../theme/constants';

const schema = z.object({
  mandateId: z.string().min(1, 'Required'),
  techStack: z.string().min(1, 'Required'),
  intakeType: z.string().min(1, 'Required'),
  expLevel: z.string().min(1, 'Required'),
  location: z.string().min(1, 'Required'),
  onboardingDate: z.string().min(1, 'Required'),
  openPositions: z.coerce.number().min(1, 'Min 1'),
  targetCoeIds: z.array(z.string()).optional(),
});
type FormValues = z.infer<typeof schema>;

const getString = (val: any, fallback = ''): string => {
  let raw = '';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') raw = val;
  else if (val && typeof val === 'object') raw = val.label || val.name || val.id || fallback;
  else raw = fallback;

  if (!raw || raw === fallback) return fallback;
  return toTitleCase(raw);
};

export const RequirementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(0);
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [editing, setEditing] = React.useState<any>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isViewOnly, setIsViewOnly] = React.useState(false);

  const { data: requirements = [], isLoading, refetch, isFetching, isError, error } = useRequirements();
  console.log("requirement data ", requirements)
  const { data: mandates = [] } = useMandates();
  const { data: clients = [] } = useClients();
 const { data: coes = [], isLoading: coesLoading, isError: coesError, error: coesErr } = useCOEs();
  
  const { mutateAsync: createReq, isPending } = useCreateRequirement();
  const { mutateAsync: updateReq, isPending: isUpdating } = useUpdateRequirement();
  const { mutateAsync: deleteReq, isPending: isDeleting } = useDeleteRequirement();
  
  const canDelete = currentUser && can.deleteRequirement(currentUser.role);
  const createRequirement = currentUser && can.createRequirement(currentUser.role);
   const updateRequiremt = currentUser && can.updateRequirement(currentUser.role)
  
  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mandateId: '', techStack: '', intakeType: 'Fresher ISA', expLevel: 'Fresher', location: '', onboardingDate: '', openPositions: 0, targetCoeIds: [] },
  });

  const [techQuery, setTechQuery] = React.useState('');
  const [locQuery, setLocQuery] = React.useState('');

  const { data: techOptions = [] } = useTechStacks(techQuery);
  const { data: locationsData, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteLocations(locQuery);
  const locationOptions = locationsData ? locationsData.pages.flatMap((page) => page.items) : [];

  const handleClose = () => {
    setOpen(false);
    setIsViewOnly(false);
    setEditing(null);
    setTechQuery('');
    setLocQuery('');
    reset({
      mandateId: '',
      techStack: '',
      intakeType: '',
      expLevel: '',
      location: '',
      onboardingDate: '',
      openPositions: '' as any,
      targetCoeIds: [],
    });
  };

  const getSafeDropdownValue = (val: any, options: string[]) => {
    if (!val) return '';
    const stringVal = typeof val === 'string' ? val : (val.label || val.name || val.id || '');
    if (!stringVal) return '';
    if (options.includes(stringVal)) return stringVal;
    const match = options.find(opt => stringVal.toLowerCase().includes(opt.toLowerCase()));
    return match || '';
  };

  React.useEffect(() => {
    if (isError && error) {
      enqueueSnackbar((error as any)?.message || 'Failed to load requirements', { variant: 'error' });
    }
  }, [isError, error, enqueueSnackbar]);

  const handleOpen = (req?: any, viewMode = false) => {
    setIsViewOnly(viewMode);
    if (req) {
      setEditing(req);
      
      const tVal = getString(getSafeDropdownValue(req.techStack, TECH_STACKS) || req.techStack, '');
      const lVal = getString(req.location, '');
      setTechQuery(tVal);
      setLocQuery(lVal);

      // Robust Date formatting checking all possible key aliases
      const rawDate = req.onboardingDate || req.onboardingTargetDate || req.targetOnboardingDate || req.onboarding_date || req.onboarding_target_date;
      let formattedDate = '';
      if (rawDate) {
        try {
          formattedDate = new Date(rawDate).toISOString().split('T')[0];
        } catch (error) {
          formattedDate = String(rawDate).split('T')[0];
        }
      }

      reset({
        mandateId: req.mandateId || '',
        techStack: tVal,
        intakeType: getString(req.intakeType, ''),
        expLevel: getString(req.expLevel, ''),
        location: lVal,
        onboardingDate: formattedDate,
        openPositions: req.openPositions || 0,
        targetCoeIds: req.targetCoeIds || [],
      });
    } else {
      setEditing(null);
      setTechQuery('');
      setLocQuery('');
      reset({
        mandateId: '',
        techStack: '',
        intakeType: '',
        expLevel: '',
        location: '',
        onboardingDate: '',
        openPositions: '' as any,
        targetCoeIds: [],
      });
    }
    setOpen(true);
  };

  const watchedMandate = watch('mandateId');
  const watchedTech = watch('techStack');
  const watchedIntake = watch('intakeType');
  const watchedDate = watch('onboardingDate');

  const selectedMandate = mandates.find((m) => m.id === watchedMandate);
  const selectedClient = clients.find((c) => c.id === selectedMandate?.clientId);

  const seqRef = useRef<number>(Math.floor(Math.random() * 900 + 100));

  useEffect(() => {
    seqRef.current = Math.floor(Math.random() * 900 + 100);
  }, [watchedMandate, watchedTech, watchedIntake, watchedDate]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        mandateId: data.mandateId,
        techStack: getString(data.techStack),
        intakeType: getString(data.intakeType),
        expLevel: getString(data.expLevel),
        location: getString(data.location),
        onboardingDate: data.onboardingDate,
        openPositions: data.openPositions,
        targetCoeIds: data.targetCoeIds || [],
        status: editing?.status || 'active',
      };

      if (editing) {
        await updateReq({
          id: editing.id,
          ...payload,
        });
        enqueueSnackbar('Requirement updated', { variant: 'success' });
      } else {
        await createReq(payload);
        enqueueSnackbar('Requirement created', { variant: 'success' });
      }
      handleClose();
      reset();
    } catch (err: any) {
      const message = err?.message || err?.error || 'Error saving requirement';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteReq(deletingId);
      enqueueSnackbar('Requirement deleted successfully', { variant: 'success' });
      setDeletingId(null);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to delete requirement', { variant: 'error' });
    }
  };

  const filtered = requirements.filter((r) => {
    const matchesSearch = (r.requirementId || '').toLowerCase().includes(search.toLowerCase()) ||
                          getString(r.techStack).toLowerCase().includes(search.toLowerCase()) ||
                          (r.clientName || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || (r.status || 'Active').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  React.useEffect(() => {
    setPage(0);
  }, [search, statusFilter]);

  const paginatedRequirements = React.useMemo(() =>
    filtered.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE),
    [filtered, page]
  );

  const getCoeNames = (ids: string[]) => {
    if (!ids || ids.length === 0) return '—';
    return coes.filter(c => ids.includes(c.id)).map(c => c.name).join(', ');
  };

  const styles = {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
    pageBg: isDark ? "#0f111a" : "#f8fafc",
    cardBg: isDark ? "#151724" : "#ffffff",
    cardBorder: isDark ? "1px solid #222538" : "1px solid #e2e8f0",
    headerText: isDark ? "#f8fafc" : "#0f172a",
    subText: isDark ? "#94a3b8" : "#64748b",
    mainText: isDark ? "#cbd5e1" : "#334155",
    previewBoxBg: isDark ? "#142544" : "#112a52",
    tableHeaderBg: isDark ? "#16213e" : "#f1f5f9",
    tableHeaderColor: isDark ? "#94a3b8" : "#64748b",
    tableRowBorder: isDark ? "1px solid #222538" : "1px solid #f1f5f9",
    primaryColor: "#112a52",
  };

  return (
    <Box sx={{ width: '100%', fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif' }}>
      <PageHeader
        title="Requirements"
        subtitle={`${requirements.length} total requirements`}
        action={createRequirement && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} sx={{ textTransform: "none", fontWeight: 700 }}>
            Add Requirement
          </Button>
        )}
      />
      

      <SectionCard
        title={`${filtered.length} Total Requirements`}
        isTableCard
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
              sx={{ minWidth: 120, bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="on_hold">On Hold</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
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
       <Box sx={{ overflowX: 'auto', flex: 1, overflowY: 'auto' }}>
  <Table sx={{ minWidth: 1000, width: '100%' }}>
    <TableHead>
      <TableRow sx={tableHeaderRowStyles(isDark)}>
        {[
          { label: 'Requirement ID', minWidth: '320px' },
          { label: 'Client Name', minWidth: '180px' },
          { label: 'Tech Stack', minWidth: '140px' },
          { label: 'Intake Type', minWidth: '120px' },
          { label: 'Location', minWidth: '120px' },
          { label: 'Capacity', minWidth: '150px' },
          { label: 'Status', minWidth: '110px' },
          { label: 'Actions', minWidth: '140px', align: 'center' },
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
              minWidth: col.minWidth,
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
          <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </TableCell>
        </TableRow>
      ) : paginatedRequirements.length > 0 ? (
        paginatedRequirements.map((r) => {
          const reqIdStr = getString(r.requirementId);
          const reqIdCount = reqIdStr.split(',').map((s) => s.trim()).filter(Boolean).length;

          return (
            <TableRow key={r.id} hover sx={tableRowStyles(isDark)}>
              
              {/* 1. Requirement ID */}
              <TableCell align="left" sx={{ ...tableBodyCellPrimaryStyles(isDark), py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap', minWidth: 320 }}>
                <DataBox text={reqIdStr} showTooltip={reqIdCount > 1} />
              </TableCell>

            {/* 2. Client Name */}
            <TableCell align="left" sx={{ ...tableBodyCellSecondaryStyles(isDark), py: 1.25, px: 2, verticalAlign: 'middle' }}>
              <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {getString(r.clientName, '—')}
              </Typography>
            </TableCell>

            {/* 3. Tech Stack (Single Line Badge) */}
            {/* 3. Tech Stack */}
            <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              <Chip 
                label={toTitleCase(getString(r.techStack || '—'))} 
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
            </TableCell>

            {/* 4. Intake Type */}
            <TableCell align="left" sx={{ ...tableBodyCellSecondaryStyles(isDark), py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {getString(r.intakeType, '—')}
              </Typography>
            </TableCell>

            {/* 5. Location */}
            <TableCell align="left" sx={{ ...tableBodyCellSecondaryStyles(isDark), py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              <Chip 
                label={toTitleCase(getString(r.location || '—'))} 
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
            </TableCell>

            {/* 6. Capacity */}
            <TableCell align="left" sx={{ minWidth: 150, py: 1.25, px: 2, verticalAlign: 'middle' }}>
              <CapacityBar filled={r.filledPositions} open={r.openPositions} />
            </TableCell>

            {/* 7. Status */}
            <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              <StatusChip status={r.status} type="mandate" />
            </TableCell>

            {/* 8. Actions (Centered & Perfectly Spaced) */}
            <TableCell align="center" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', width: '140px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.75 }}>
                <IconButton size="small" onClick={() => handleOpen(r, true)} sx={actionIconButtonStyles(isDark)} title="View">
                  <Visibility fontSize="small" />
                </IconButton>
                   
                   {
                  updateRequiremt && (
                      <IconButton size="small" onClick={() => handleOpen(r)} sx={actionIconButtonStyles(isDark)} title="Edit">
                      <Edit fontSize="small" />
                    </IconButton>

                  )
                }
                {canDelete && (
                  <>
                  
                    <IconButton 
                      size="small" 
                      onClick={() => setDeletingId(r.id)} 
                      disabled={isDeleting && deletingId === r.id}
                      sx={actionIconButtonStyles(isDark, 'error')} 
                      title="Delete"
                    >
                      {isDeleting && deletingId === r.id 
                        ? <CircularProgress size={14} color="inherit" />
                        : <Delete fontSize="small" />
                      }
                    </IconButton>
                  </>
                )}

                
              </Box>
            </TableCell>

          </TableRow>
          );
        })
      ) : (
        <TableRow>
          <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
            <Typography variant="body2" color="text.secondary">No requirements found</Typography>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
</Box>
        <Box sx={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={ROWS_PER_PAGE}
            rowsPerPageOptions={[]}
          />
        </Box>
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
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isViewOnly ? 'Requirement Details' : (editing ? 'Edit Requirement' : 'Create New Requirement')}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
              <Grid container spacing={2} pt={1}>
                <Grid item xs={12}>
                  <Controller
                    name="mandateId"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        options={mandates}
                        getOptionLabel={(o) => toTitleCase(o.clientName || '')}
                        value={mandates.find((m) => m.id === field.value) || null}
                        onChange={(_, val) => field.onChange(val ? val.id : '')}
                        disabled={isViewOnly}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Mandate *"
                            error={!!errors.mandateId}
                            helperText={errors.mandateId?.message}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="techStack"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        freeSolo
                        options={techOptions}
                        getOptionLabel={(o) => toTitleCase(typeof o === 'string' ? o : '')}
                        value={field.value || ''}
                        inputValue={techQuery}
                        disabled={isViewOnly}
                        onInputChange={(_, val) => {
                          setTechQuery(val);
                          field.onChange(val);
                        }}
                        onChange={(_, val) => {
                          field.onChange(val || '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Tech Stack *"
                            error={!!errors.techStack}
                            helperText={errors.techStack?.message}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="intakeType" control={control} render={({ field }) => {
                    const intakeOptions = Array.from(new Set([...INTAKE_TYPES, ...(field.value ? [field.value] : [])]));
                    return (
                      <TextField {...field} label="Intake Type *" select fullWidth error={!!errors.intakeType} helperText={errors.intakeType?.message} disabled={isViewOnly}>
                        {intakeOptions.map((t) => <MenuItem key={t} value={t}>{toTitleCase(t)}</MenuItem>)}
                      </TextField>
                    );
                  }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="expLevel" control={control} render={({ field }) => (
                    <TextField {...field} label="Experience Level *" select fullWidth error={!!errors.expLevel} helperText={errors.expLevel?.message} disabled={isViewOnly}>
                      {EXP_LEVELS.map((t) => <MenuItem key={t} value={t}>{toTitleCase(t) } </MenuItem>)}
                    </TextField>
                  )} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="openPositions" control={control} render={({ field }) => (
                    <TextField {...field} label="Open Positions *" type="number" fullWidth error={!!errors.openPositions} helperText={errors.openPositions?.message} disabled={isViewOnly} />
                  )} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        freeSolo
                        options={locationOptions}
                        value={field.value || ''}
                        inputValue={locQuery}
                        disabled={isViewOnly}
                        onInputChange={(_, val) => {
                          setLocQuery(val);
                          field.onChange(val);
                        }}
                        onChange={(_, val) => {
                          field.onChange(val || '');
                        }}
                        ListboxProps={{
                          onScroll: (event: React.SyntheticEvent) => {
                            const listboxNode = event.currentTarget;
                            if (listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 1) {
                              if (hasNextPage && !isFetchingNextPage) {
                                fetchNextPage();
                              }
                            }
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Location *"
                            error={!!errors.location}
                            helperText={errors.location?.message}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="onboardingDate" control={control} render={({ field }) => (
                    <TextField 
                      {...field} 
                      label="Onboarding Target Date *" 
                      type="date" 
                      inputProps={{ min: dayjs().format('YYYY-MM-DD') }} 
                      fullWidth 
                      InputLabelProps={{ shrink: true }} 
                      error={!!errors.onboardingDate} 
                      helperText={errors.onboardingDate?.message} 
                      disabled={isViewOnly} 
                      sx={{
                        '& .MuiInputBase-input.Mui-disabled': {
                          WebkitTextFillColor: isDark ? '#f1f5f9' : '#0f172a',
                          fontWeight: 600,
                          opacity: 1,
                        },
                      }}
                    />
                  )} />
                </Grid>
                <Grid item xs={12}>
                  <Controller name="targetCoeIds" control={control} render={({ field }) => (
                    <Autocomplete
                      multiple
                      options={coes}
                      getOptionLabel={(o) => toTitleCase(o.name)}
                      value={coes.filter((c) => (field.value || []).includes(c.id))}
                      onChange={(_, val) => field.onChange(val.map((v) => v.id))}
                      disabled={isViewOnly}
                      sx={{
                        '& .MuiInputBase-input.Mui-disabled': {
                          WebkitTextFillColor: isDark ? '#f1f5f9' : '#0f172a',
                          fontWeight: 500,
                        },
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Target COEs (optional)"
                          sx={{
                            '& .MuiInputBase-input.Mui-disabled': {
                              WebkitTextFillColor: isDark ? '#f1f5f9' : '#0f172a',
                              fontWeight: 500,
                            },
                          }}
                        />
                      )}
                      renderTags={(val, getTagProps) =>
                        val.map((option, i) => (
                          <Chip
                            label={toTitleCase(option.name)}
                            {...getTagProps({ index: i })}
                            size="small"
                            key={option.id}
                            sx={{
                              color: isDark ? '#f1f5f9' : '#0f172a',
                              fontWeight: 600,
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                              border: '1px solid',
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
                              '&.Mui-disabled': {
                                opacity: 1,
                                color: isDark ? '#f1f5f9' : '#0f172a',
                                WebkitTextFillColor: isDark ? '#f1f5f9' : '#0f172a',
                              },
                            }}
                          />
                        ))
                      }
                    />
                  )} />
                </Grid>

                {/* {isViewOnly && editing && (
                  <Grid item xs={12} mt={1}>
                    <Box 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#eff6ff', 
                        border: '1px solid', 
                        borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe' 
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#60a5fa' : '#1d4ed8', mb: 1 }}>
                        📅 Onboarding Target Details & Status
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary" display="block">Onboarding Target Date</Typography>
                          <DataBox text={(editing.onboardingDate || editing.onboardingTargetDate || editing.targetOnboardingDate) ? formatDate(editing.onboardingDate || editing.onboardingTargetDate || editing.targetOnboardingDate) : 'Not Set'} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary" display="block">Open Positions Target</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>{editing.openPositions || 0} Positions</Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary" display="block">Requirement Status</Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <StatusChip status={editing.status || 'Active'} type="requirement" />
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                )} */}
              </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} color="error" sx={{ textTransform: "none", fontWeight: 700 }}  >
              {isViewOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isViewOnly && (
              <Button 
                type="submit" 
                variant="contained" 
                disabled={isPending || isUpdating} 
                sx={{ 
                  textTransform: "none", 
                  fontWeight: 700,
                  minWidth: 120 
                }}
              >
                {(isPending || isUpdating) ? (
                  <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                ) : null}
                {(isPending || isUpdating) 
                  ? (editing ? 'Updating...' : 'Creating...') 
                  : `${editing ? 'Update' : 'Create'} Requirement`}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete this requirement? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeletingId(null)} color="error" sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
          <Button 
            color="error" 
            variant="contained" 
            onClick={handleDelete} 
            disabled={isDeleting} 
            startIcon={isDeleting ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};