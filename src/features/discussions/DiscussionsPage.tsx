import React from 'react';
import {
  Box, Button, Typography, Chip, TextField, MenuItem, TablePagination,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, useTheme,
  CircularProgress, InputAdornment, Alert, Avatar
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Search, Refresh } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { ROWS_PER_PAGE } from '../../theme/constants';
import {
  useDiscussionLogs, useAllMappingLineItems,
  useCandidates, useMappings, useRequirements, useLOIs,
  useCreateDiscussionLog, useUpdateDiscussionLog, useDeleteDiscussionLog, useAdvanceMappingStatus,
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { PageHeader, SectionCard, DataBox } from '../../components/shared';
import dayjs from 'dayjs';
import { CandidateStatus, type DiscussionOutcome, type DiscussionLog } from '../../types';
import { formatDate, formatDateTime, DISCUSSION_OUTCOMES, toTitleCase } from '../../utils';
import { 
  dashboardCardStyle, tableStyles, tableHeaderRowStyles, tableHeaderCellStyles, 
  tableRowStyles, actionIconButtonStyles
} from '../../style/tableStyles';

export const DiscussionsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  
  const [open, setOpen] = React.useState(false);
  const [editingLog, setEditingLog] = React.useState<DiscussionLog | null>(null);
  const [viewingLog, setViewingLog] = React.useState<DiscussionLog | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isViewOnly, setIsViewOnly] = React.useState(false);
  
  const [selectedLineItemId, setSelectedLineItemId] = React.useState('');
  const [outcome, setOutcome] = React.useState<DiscussionOutcome>('Interested');
  const [notes, setNotes] = React.useState('');
  const [followUpDate, setFollowUpDate] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(0);

  const { data: discussionLogs = [], isLoading, refetch, isFetching, isError, error } = useDiscussionLogs();
  const { data: lineItems = [] } = useAllMappingLineItems();
  const { data: candidates = [] } = useCandidates();
  const { data: lois = [] } = useLOIs();

  console.log("discussion candidate ", candidates)
  const { data: mappings = [] } = useMappings();
  const { data: requirements = [] } = useRequirements();

  const findCandidate = (id?: string) => {
    if (!id) return undefined;
    return candidates.find((c: any) =>
      c.id === id ||
      c.candidateId === id ||
      c._id === id ||
      c.externalKey === id
    );
  };
  
  const { mutateAsync: createLog, isPending: creating } = useCreateDiscussionLog();
  const { mutateAsync: updateLog, isPending: updating } = useUpdateDiscussionLog();
  const { mutateAsync: deleteLog, isPending: deleting } = useDeleteDiscussionLog();
  const { mutateAsync: advanceStatus } = useAdvanceMappingStatus();
  
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isPending = creating || updating;

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const filteredLogs = React.useMemo(() => {
    return discussionLogs.filter((log) => {
      const lineItem = lineItems.find((li) => li.id === log.mappingLineItemId);
      const candidate = findCandidate(lineItem?.candidateId);
      if (!candidate || candidate.isDeleted === true) return false;

      const mapping = mappings.find((m) => m.id === lineItem?.mappingId);
      const requirement = requirements.find((r) => r.id === mapping?.requirementRecordId);

      const candName = candidate ? candidate?.name.toLowerCase() : '';
      const reqCode = requirement ? requirement.requirementId.toLowerCase() : '';
      const notes = log.notes ? log.notes.toLowerCase() : '';

      const matchesSearch = candName.includes(search.toLowerCase()) ||
                            reqCode.includes(search.toLowerCase()) ||
                            notes.includes(search.toLowerCase());
      const matchesStatus = !statusFilter || log.outcome.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [discussionLogs, lineItems, candidates, mappings, requirements, search, statusFilter]);

  React.useEffect(() => {
    setPage(0);
  }, [search, statusFilter]);

  React.useEffect(() => {
    if (isError && error) {
      enqueueSnackbar((error as any)?.message || 'Failed to load discussions', { variant: 'error' });
    }
  }, [isError, error, enqueueSnackbar]);

  const paginatedLogs = React.useMemo(() => {
    return filteredLogs.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE);
  }, [filteredLogs, page]);

  const canUpdate = currentUser && can.updateDiscussion(currentUser.role);
  const canDelete = currentUser && can.deleteDiscussion(currentUser.role);
  const canAdvanceMapping = currentUser?.role === 'MIS_MANAGER';

  const eligibleMappings = React.useMemo(() => {
    return mappings.filter((m) => ['Confirmed by MIS', 'In Discussion', 'LOI Issued'].includes(m.status));
  }, [mappings]);

  const eligibleLineItems = React.useMemo(() => {
    return lineItems.filter((li) => {
      // 1. Must belong to an eligible mapping
      const belongsToEligibleMapping = eligibleMappings.some((m) => m.id === li.mappingId);
      if (!belongsToEligibleMapping) return false;

      const cand = findCandidate(li.candidateId);
      if (cand?.isDeleted === true) return false;
      
      // 2. Candidate / Line item status MUST be 'Mapped' or 'Discussed' only!
      const candStatus = (cand?.status || (li as any).status || '').toLowerCase().trim().replace(/_/g, ' ');
      const isMappedOrDiscussed = candStatus === CandidateStatus.MAPPED.toLowerCase() || candStatus === CandidateStatus.DISCUSSED.toLowerCase();
      if (!isMappedOrDiscussed) {
        return false;
      }

      // 3. Exclude candidate if an LOI record exists for this candidate with status Sent or Signed
      const hasSentOrSignedLoi = lois.some((l: any) => {
        const isCandMatch =
          l.candidateId === cand?.id ||
          l.candidateId === (cand as any)?.candidateId ||
          l.candidateId === li.candidateId;
        
        if (!isCandMatch) return false;

        const loiStat = (l.status || '').toLowerCase().replace(/_/g, ' ');
        return (
          loiStat.includes('sent') ||
          loiStat.includes('signed') ||
          loiStat.includes('loi sent') ||
          loiStat.includes('loi signed')
        );
      });

      if (hasSentOrSignedLoi) return false;

      return true;
    });
  }, [lineItems, eligibleMappings, candidates, lois]);

  const handleOpenForm = (log?: DiscussionLog) => {
    setIsViewOnly(false);
    if (log) {
      setEditingLog(log);
      setSelectedLineItemId(log.mappingLineItemId);
      setOutcome(log.outcome as DiscussionOutcome);
      setNotes(log.notes || '');
      setFollowUpDate(log.followUpDate ? log.followUpDate.split('T')[0] : '');
    } else {
      setEditingLog(null);
      setSelectedLineItemId('');
      setOutcome('Interested');
      setNotes('');
      setFollowUpDate('');
    }
    setOpen(true);
  };

  const handleViewClick = (log: DiscussionLog) => {
    setIsViewOnly(true);
    setEditingLog(log);
    setSelectedLineItemId(log.mappingLineItemId);
    setOutcome(log.outcome as DiscussionOutcome);
    setNotes(log.notes || '');
    setFollowUpDate(log.followUpDate ? log.followUpDate.split('T')[0] : '');
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedLineItemId || !currentUser) return;
    try {
      if (editingLog) {
        await updateLog({
          id: editingLog.id,
          outcome,
          notes,
          followUpDate: followUpDate || null,
        });
        enqueueSnackbar('Discussion log updated', { variant: 'success' });
      } else {
        await createLog({
          mappingLineItemId: selectedLineItemId,
          coordinatorId: currentUser.id,
          outcome,
          notes,
          followUpDate: followUpDate || null,
        });
        
        const lineItem = lineItems.find((li) => li.id === selectedLineItemId);
        const mapping = mappings.find((m) => m.id === lineItem?.mappingId);
        if (canAdvanceMapping && mapping?.status === 'Confirmed by MIS') {
          await advanceStatus({ mappingId: mapping.id, status: 'In Discussion' });
        }
        enqueueSnackbar('Discussion log saved', { variant: 'success' });
      }
      setOpen(false);
    } catch (err: any) {
      const message = err?.message || err?.error || 'Error saving discussion log';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteLog(deletingId);
      enqueueSnackbar('Discussion log deleted', { variant: 'success' });
      setDeletingId(null);
    } catch (err: any) {
      enqueueSnackbar('Failed to delete discussion log', { variant: 'error' });
    }
  };


  console.log("selectedLineItemId in discussion page ", selectedLineItemId)
  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Discussions"
        subtitle="candidate discussion logs"
        action={canUpdate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenForm()} sx={{ textTransform: "none", fontWeight: 700 }}>
            Log Discussion
          </Button>
        )}
      />

      <SectionCard 
        isTableCard 
        title={`${filteredLogs.length} Total Discussions`}
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
              label="Outcome"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150, bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            >
              <MenuItem value="">All Outcomes</MenuItem>
              {DISCUSSION_OUTCOMES.map((outcome) => (
                <MenuItem key={outcome} value={outcome}>
                  {outcome}
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
   <Table sx={{ minWidth: 950, width: '100%' }}>
    <TableHead>
      <TableRow sx={tableHeaderRowStyles(isDark)}>
        {[
          { label: 'Requirement Id', width: '200px' },
          { label: 'Candidate Name', width: '280px' },
          { label: 'Outcome', width: '130px' },
          { label: 'Notes', width: '22%' },
          { label: 'Follow-up', width: '140px' },
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
          <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </TableCell>
        </TableRow>
      ) : paginatedLogs.length === 0 ? (
        <TableRow>
          <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
            <Typography variant="body2" color="text.secondary">No discussion logs yet</Typography>
          </TableCell>
        </TableRow>
      ) : (
        paginatedLogs.map((log) => {
          const lineItem = lineItems.find((li) => li.id === log.mappingLineItemId);
          const candidate = findCandidate(lineItem?.candidateId);
          const mapping = mappings.find((m) => m.id === lineItem?.mappingId);
          const req = requirements.find((r) => r.id === mapping?.requirementRecordId);

          return (
            <TableRow 
              key={log.id} 
              hover 
              sx={tableRowStyles(isDark)} 
            >
              
              {/* 1. Requirement Id */}
              <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                <DataBox text={req?.requirementId || '—'} />
              </TableCell>

              {/* 2. Candidate Name */}
              <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', width: '280px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{ width: 34, height: 34, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'primary.main', color: '#ffffff', flexShrink: 0 }}
                  >
                    {(candidate?.name || candidate?.email || 'C').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <DataBox text={toTitleCase(candidate?.name || candidate?.email?.split('@')[0] || "—")} />
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', display: 'block', color: 'text.secondary', mt: 0.5, whiteSpace: 'nowrap' }}>
                      {candidate?.email}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>

              {/* 3. Outcome */}
              <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                <Chip
                  label={toTitleCase(log.outcome)}
                  size="small"
                  sx={{ 
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    textTransform: 'capitalize',
                    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                    color: isDark ? '#94a3b8' : '#64748b',
                    border: '1px solid',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    height: 22,
                    borderRadius: 1
                  }}
                />
              </TableCell>

              {/* 4. Notes */}
              <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle' }}>
                <Typography variant="caption" noWrap sx={{ maxWidth: 220, display: 'block', fontSize: '0.85rem' }}>
                  {log.notes || '—'}
                </Typography>
              </TableCell>

              {/* 5. Follow-up Date */}
              <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                <Typography variant="caption" sx={{ fontSize: '0.875rem' }}>
                  {log.followUpDate ? formatDate(log.followUpDate) : '—'}
                </Typography>
              </TableCell>

              {/* 6. Actions (Centered Alignment) */}
              <TableCell align="center" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', width: '140px' }} onClick={(e) => e.stopPropagation()}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.75 }}>
                  <IconButton size="small" onClick={() => handleViewClick(log)} sx={actionIconButtonStyles(isDark)} title="View Details">
                    <Visibility fontSize="small" />
                  </IconButton>
                  {/* {canUpdate && (
                    <IconButton size="small" onClick={() => handleOpenForm(log)} sx={actionIconButtonStyles(isDark)} title="Edit">
                      <Edit fontSize="small" />
                    </IconButton>
                  )} */}
                  {canDelete && (
                    <IconButton size="small" onClick={() => setDeletingId(log.id)} sx={actionIconButtonStyles(isDark, 'error')} title="Delete">
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </TableCell>

            </TableRow>
          );
        })
      )}
    </TableBody>
  </Table>
</Box>
        
        <Box sx={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
          <TablePagination
            component="div"
            count={discussionLogs.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={ROWS_PER_PAGE}
            rowsPerPageOptions={[]}
          />
        </Box>
      </SectionCard>

      {/* Log Form Dialog */}
      <Dialog 
        open={open} 
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            setOpen(false);
          }
        }} 
        disableEscapeKeyDown
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>{isViewOnly ? 'Discussion Details' : (editingLog ? 'Edit Discussion Outcome' : 'Log Discussion Outcome')}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} pt={1}>
            <Grid item xs={12}>
              <TextField
                select label="Candidate (Line Item)" fullWidth value={selectedLineItemId}
                onChange={(e) => setSelectedLineItemId(e.target.value)}
                disabled={isViewOnly || !!editingLog}
              >
                {editingLog && !eligibleLineItems.find(li => li.id === selectedLineItemId) ? (
                   <MenuItem value={selectedLineItemId}>
                     {findCandidate(lineItems.find(li => li.id === selectedLineItemId)?.candidateId)?.name || 'Missing Candidate Name'}
                   </MenuItem>
                ) : null}
                {eligibleLineItems.map((li) => {
                  const c = findCandidate(li.candidateId);
                  return (
                    <MenuItem key={li.id} value={li.id}>
                      {toTitleCase(c?.name || li.candidateId)} — {toTitleCase(li.proposedTech)}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select label="Outcome" fullWidth value={outcome}
                onChange={(e) => setOutcome(e.target.value as DiscussionOutcome)}
                disabled={isViewOnly}
              >
                {DISCUSSION_OUTCOMES.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Follow-up Date" type="date" inputProps={{ max: dayjs().format('YYYY-MM-DD') }} fullWidth value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={isViewOnly}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes" fullWidth multiline rows={3} value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isViewOnly}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color={isViewOnly ? "primary" : "error"} sx={{ textTransform: "none", fontWeight: 700 }}>
            {isViewOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isViewOnly && (
            <Button variant="contained" onClick={handleSubmit} disabled={isPending} sx={{ textTransform: "none", fontWeight: 700 }}>
              {isPending ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
              {isPending ? (editingLog ? 'Updating...' : 'Saving...') : (editingLog ? 'Update Log' : 'Save Log')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete this discussion log? This action cannot be undone.</Typography>
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