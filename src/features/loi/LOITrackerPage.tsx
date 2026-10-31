import React from 'react';
import {
  Box, Button, Typography, Chip, Table, TableBody,
  TableCell, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid, useTheme,
  TablePagination, CircularProgress, Tooltip, InputAdornment, Alert, Avatar
} from '@mui/material';
import { Send, CheckCircle, Delete, Visibility, Search, Refresh } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useSnackbar } from 'notistack';
import {
  useLOIs, useCandidates, useRequirements, useMappings,
  useDiscussionLogs, useAllMappingLineItems,
  useCreateLOI, useSignLOI, useAdvanceMappingStatus, useDeleteLOI
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { PageHeader, SectionCard, StatusChip, DataBox } from '../../components/shared';
import { formatDate, formatDateTime, toTitleCase } from '../../utils';
import { dashboardCardStyle, tableStyles, tableHeaderRowStyles, tableHeaderCellStyles, tableRowStyles, actionIconButtonStyles } from '../../style/tableStyles';
import type { DiscussionLog, DiscussionOutcome, LOI, Mapping, MappingLineItem } from '../../types';
import { ROWS_PER_PAGE } from '../../theme/constants';

const LOI_ELIGIBLE_MAPPING_STATUSES = ['Confirmed by MIS', 'In Discussion', 'LOI Issued'] as const;

function getLatestDiscussionOutcome(
  logs: DiscussionLog[],
  lineItemId: string
): DiscussionOutcome | null {
  const latest = logs
    .filter((log) => log.mappingLineItemId === lineItemId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  return latest?.outcome ?? null;
}

function isLineItemEligibleForLoi(
  lineItem: MappingLineItem,
  discussionLogs: DiscussionLog[],
  mappings: Mapping[],
  lois: LOI[]
): boolean {
  const mapping = mappings.find((m) => m.id === lineItem.mappingId);
  if (!mapping || !LOI_ELIGIBLE_MAPPING_STATUSES.includes(mapping.status as typeof LOI_ELIGIBLE_MAPPING_STATUSES[number])) {
    return false;
  }
  if (getLatestDiscussionOutcome(discussionLogs, lineItem.id) !== 'Interested') {
    return false;
  }
  return !lois.some(
    (loi) =>
      loi.candidateId === lineItem.candidateId &&
      (loi.mappingId === lineItem.mappingId || loi.requirementRecordId === mapping.requirementRecordId)
  );
}

export const LOITrackerPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [open, setOpen] = React.useState(false);
  const [selectedLineItemId, setSelectedLineItemId] = React.useState('');
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  
  // State to show LOI details in a view dialog
  const [viewingLoi, setViewingLoi] = React.useState<LOI | null>(null);
  
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [loiFile, setLoiFile] = React.useState<File | null>(null);
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const { data: lois = [], isLoading, refetch, isFetching, isError, error } = useLOIs();

  React.useEffect(() => {
    if (isError && error) {
      enqueueSnackbar((error as any)?.message || 'Failed to load LOIs', { variant: 'error' });
    }
  }, [isError, error, enqueueSnackbar]);
  const { data: candidates = [] } = useCandidates();
  const { data: requirements = [] } = useRequirements();
  const { data: mappings = [] } = useMappings();
  const { data: discussionLogs = [] } = useDiscussionLogs();
  const { data: lineItems = [] } = useAllMappingLineItems();

  const findCandidate = (val: any) => {
    if (!val) return undefined;
    if (typeof val === 'object' && (val.name || val.email)) return val;
    const id = typeof val === 'string' ? val : val.candidateId || val.id;
    if (!id) return undefined;
    return candidates.find((c: any) =>
      c.id === id ||
      c.candidateId === id ||
      c._id === id ||
      c.externalKey === id
    );
  };

  const { mutateAsync: createLOI, isPending: creating } = useCreateLOI();
  const { mutateAsync: signLOI } = useSignLOI();
  const { mutateAsync: deleteLOI, isPending: deleting } = useDeleteLOI();
  const { mutateAsync: advanceStatus } = useAdvanceMappingStatus();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const filteredLOIs = React.useMemo(() => {
    return lois.filter((loi) => {
      const candidate = findCandidate(loi.candidateId);
      // Only include LOIs where candidate exists and isActive === true
      if (!candidate || (candidate as any).isActive !== true) return false;

      const requirement = requirements.find((r) => r.id === loi.requirementRecordId);

      const candName = candidate ? candidate.name.toLowerCase() : '';
      const reqCode = requirement ? requirement.requirementId.toLowerCase() : '';
      const email = candidate ? candidate.email.toLowerCase() : '';

      const matchesSearch = candName.includes(search.toLowerCase()) ||
                            reqCode.includes(search.toLowerCase()) ||
                            email.includes(search.toLowerCase());
      const matchesStatus = !statusFilter || 
                            loi.status.toLowerCase() === statusFilter.toLowerCase() ||
                            ((statusFilter.toLowerCase() === 'signed' || statusFilter.toLowerCase() === 'loi signed') &&
                             (loi.status.toLowerCase() === 'signed' || loi.status.toLowerCase() === 'loi signed'));

      return matchesSearch && matchesStatus;
    });
  }, [lois, candidates, requirements, search, statusFilter]);

  React.useEffect(() => {
    setPage(0);
  }, [search, statusFilter]);

  const paginatedLOIs = React.useMemo(() =>
    filteredLOIs.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE),
    [filteredLOIs, page]
  );

  React.useEffect(() => {
    if (isError) {
      enqueueSnackbar((error as any)?.message || 'Failed to load LOIs', { variant: 'error' });
    }
  }, [isError, error, enqueueSnackbar]);

  const canIssue = currentUser && can.issueLOI(currentUser.role);
  const canDelete = currentUser && can.deleteLOI(currentUser.role);
  const canAdvanceMapping =
    currentUser && ['MIS_MANAGER', 'COE_LAB_HEAD'].includes(currentUser.role);

  const eligibleLineItems = React.useMemo(
    () =>
      lineItems.filter((lineItem) => {
        const cand = findCandidate(lineItem.candidateId);
        if (!cand) return false;
        if ((cand as any).isDeleted === true) return false;
        // Only eligible if candidate isActive === true
        if ((cand as any).isActive !== true) return false;
        return isLineItemEligibleForLoi(lineItem, discussionLogs, mappings, lois);
      }),
    [lineItems, discussionLogs, mappings, lois, candidates]
  );

  const handleOpenDialog = () => {
    setSelectedLineItemId('');
    setLoiFile(null);
    setOpen(true);
  };

  const handleSendLOI = async () => {
    const lineItem = lineItems.find((li) => li.id === selectedLineItemId);
    if (!lineItem) return;

    const mapping = mappings.find((m) => m.id === lineItem.mappingId);
    if (!mapping) return;

    if (getLatestDiscussionOutcome(discussionLogs, lineItem.id) !== 'Interested') {
      enqueueSnackbar('Only candidates with latest discussion outcome "Interested" can receive an LOI', {
        variant: 'warning',
      });
      return;
    }

    if (!isLineItemEligibleForLoi(lineItem, discussionLogs, mappings, lois)) {
      enqueueSnackbar('This candidate is no longer eligible for LOI', { variant: 'warning' });
      return;
    }

    if (!loiFile) {
      enqueueSnackbar('Please upload the LOI letter file', { variant: 'warning' });
      return;
    }

    try {
      await createLOI({
        candidateId: lineItem.candidateId,
        requirementRecordId: mapping.requirementRecordId,
        mappingId: mapping.id,
        sentAt: new Date().toISOString(),
        status: 'Sent',
        loiLetter: loiFile,
      });

      if (
        canAdvanceMapping &&
        ['Confirmed by MIS', 'In Discussion'].includes(mapping.status)
      ) {
        await advanceStatus({ mappingId: mapping.id, status: 'LOI Issued' });
      }

      enqueueSnackbar('LOI sent successfully', { variant: 'success' });
      setOpen(false);
      setSelectedLineItemId('');
    } catch (err: any) {
      const message = err?.message || err?.error || 'Error sending LOI';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const [markingSignedId, setMarkingSignedId] = React.useState<string | null>(null);

  const handleMarkSigned = async (loiId: string) => {
    const loi = lois.find((l) => l.id === loiId);
    setMarkingSignedId(loiId);
    try {
      await signLOI({ id: loiId, signedAt: new Date().toISOString() });

      if (canAdvanceMapping && loi?.mappingId) {
        const mapping = mappings.find((m) => m.id === loi.mappingId);
        if (mapping && ['LOI Issued', 'In Discussion'].includes(mapping.status)) {
          await advanceStatus({ mappingId: mapping.id, status: 'Signed' });
        }
      }

      enqueueSnackbar('LOI marked as signed', { variant: 'success' });
    } catch (err: any) {
      const message = err?.message || err?.error || 'Error updating LOI';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setMarkingSignedId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteLOI(deletingId);
      enqueueSnackbar('LOI deleted successfully', { variant: 'success' });
      setDeletingId(null);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to delete LOI', { variant: 'error' });
    }
  };

  const stats = React.useMemo(() => {
    // Only count LOIs where candidate isActive === true
    const activeLois = lois.filter((l) => {
      const cand = findCandidate(l.candidateId);
      return cand && (cand as any).isActive === true;
    });
    const total = activeLois.length;
    const signed = activeLois.filter((l) => {
      const s = String(l.status || '').toLowerCase().trim();
      return s === 'signed' || s === 'loi signed' || s === 'loi_signed' || s === 'acknowledged';
    }).length;
    const sent = activeLois.filter((l) => {
      const s = String(l.status || '').toLowerCase().trim();
      return s === 'sent' || s === 'loi sent' || s === 'loi_sent' || s === 'pending';
    }).length;
    const declined = activeLois.filter((l) => {
      const s = String(l.status || '').toLowerCase().trim();
      return s === 'cancelled' || s === 'declined' || s === 'rejected';
    }).length;
    const conversion = total ? Math.round((signed / total) * 100) : 0;
    const reminders = sent > 0 ? sent * 2 : 0;
    return { total, signed, sent, declined, conversion, reminders };
  }, [lois, candidates]);

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="LOI Tracker"
        subtitle="Letter of Intent issuance and signing status"
        action={canIssue && (
          <Button variant="contained" startIcon={<Send />} onClick={handleOpenDialog} sx={{ textTransform: "none", fontWeight: 700 }}>
            Send LOI
          </Button>
        )}
      />

      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <div className="kpi" style={{ height: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#94a3b8' : undefined }}>LOIS GENERATED</div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>{stats.total}</div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#0d9488', fontWeight: 600 }}>Via DocuSign</div>
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <div className="kpi green" style={{ height: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#94a3b8' : undefined }}>SIGNED</div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>{stats.signed}</div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>{stats.conversion}% conversion</div>
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <div className="kpi orange" style={{ height: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#94a3b8' : undefined }}>AWAITING SIGNATURE</div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>{stats.sent}</div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>{stats.reminders} reminders sent</div>
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <div className="kpi purple" style={{ height: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#94a3b8' : undefined }}>DECLINED</div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>{stats.declined}</div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600 }}>Replacement triggered</div>
          </div>
        </Grid>
      </Grid>

      <SectionCard
        title={`${filteredLOIs.length} Issued Letters of Intent`}
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
              sx={{ minWidth: 150, bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="sent">Sent</MenuItem>
              <MenuItem value="signed">Signed</MenuItem>
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
          { label: 'Requirement Id', width: '200px' },
          { label: 'Candidate Name', width: '280px' },
          { label: 'Sent At', width: '150px' },
          { label: 'Signed At', width: '150px' },
          { label: 'Status', width: '110px' },
          { label: 'Actions', width: '160px', align: 'center' },
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
      ) : paginatedLOIs.map((loi) => {
        const lAny = loi as any;
        const candidate = findCandidate(lAny.candidate || loi.candidateId) || (lAny.candidateName ? { name: lAny.candidateName, email: lAny.candidateEmail } : undefined);
        const req = requirements.find((r) => r.id === loi.requirementRecordId);
        const resolvedName = candidate?.name || lAny.candidateName || candidate?.email?.split('@')[0] || (loi.candidateId ? `Candidate #${String(loi.candidateId).slice(0, 6)}` : '—');
        const resolvedEmail = candidate?.email || lAny.candidateEmail || '—';

        return (
          <TableRow key={loi.id} hover sx={tableRowStyles(isDark)}>
            
            {/* 1. Requirement Id */}
            <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              <DataBox text={req?.requirementId || loi.requirementRecordId || '—'} />
            </TableCell>

            {/* 2. Candidate Name */}
            <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', width: '280px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  sx={{ width: 34, height: 34, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'primary.main', color: '#ffffff', flexShrink: 0 }}
                >
                  {(resolvedName || 'C').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <DataBox text={toTitleCase(resolvedName)} />
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', display: 'block', color: 'text.secondary', mt: 0.5, whiteSpace: 'nowrap' }}>
                    {resolvedEmail !== '—' ? resolvedEmail : ''}
                  </Typography>
                </Box>
              </Box>
            </TableCell>

            {/* 3. Sent At */}
            <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              <Typography variant="caption" sx={{ fontSize: '0.875rem' }}>
                {formatDateTime(loi.sentAt)}
              </Typography>
            </TableCell>

            {/* 4. Signed At */}
            <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              <Typography variant="caption" sx={{ fontSize: '0.875rem' }}>
                {loi.signedAt ? formatDateTime(loi.signedAt) : '—'}
              </Typography>
            </TableCell>

            {/* 5. Status */}
            <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              <StatusChip status={loi.status} type="loi" />
            </TableCell>

            {/* 6. Actions (Centered Alignment) */}
            <TableCell align="center" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', width: '160px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.75 }}>
                {canIssue && ((loi.status as string) === 'Sent' || (loi.status as string) === 'LOI Sent' || (loi.status as string) === 'Pending') && (
                  <Tooltip title="Mark as Signed">
                    <span>
                      <IconButton
                        size="small"
                        disabled={markingSignedId === loi.id}
                        onClick={() => handleMarkSigned(loi.id)}
                        sx={actionIconButtonStyles(isDark)}
                      >
                        {markingSignedId === loi.id ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <CheckCircle fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                )}

                {/* Signed status has no action button */}

                <IconButton
                  size="small"
                  onClick={() => setViewingLoi(loi)}
                  sx={actionIconButtonStyles(isDark)}
                  title="View Details"
                >
                  <Visibility fontSize="small" />
                </IconButton>

                {/* Edit button removed — LOI details cannot be edited once issued */}

                {canDelete && (
                  <IconButton
                    size="small"
                    onClick={() => setDeletingId(loi.id)}
                    sx={actionIconButtonStyles(isDark, 'error')}
                    title="Delete"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </TableCell>

          </TableRow>
        );
      })}

      {!isLoading && lois.length === 0 && (
        <TableRow>
          <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
            <Typography variant="body2" color="text.secondary">No LOIs issued yet</Typography>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
</Box>
        <Box sx={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
          <TablePagination
            component="div"
            count={lois.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={ROWS_PER_PAGE}
            rowsPerPageOptions={[]}
          />
        </Box>
      </SectionCard>

      {/* VIEW LOI DETAILS DIALOG (Naya popup) */}
      <Dialog 
        open={!!viewingLoi} 
        onClose={() => setViewingLoi(null)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>LOI Details</DialogTitle>
        <DialogContent dividers>
          {viewingLoi && (() => {
            const viewCandidate = findCandidate(viewingLoi.candidateId);
            const viewReq = requirements.find((r) => r.id === viewingLoi.requirementRecordId);
            
            return (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Candidate Name" value={toTitleCase(viewCandidate?.name || '—')} disabled fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Email" value={viewCandidate?.email || '—'} disabled fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Requirement ID" value={viewReq?.requirementId || viewingLoi.requirementRecordId || '—'} disabled fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Status" value={toTitleCase(viewingLoi.status || '—')} disabled fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Sent At" value={viewingLoi.sentAt ? formatDateTime(viewingLoi.sentAt) : '—'} disabled fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Signed At" value={viewingLoi.signedAt ? formatDateTime(viewingLoi.signedAt) : '—'} disabled fullWidth />
                </Grid>
              
                {/* <Grid item xs={12} sx={{ mt: 1 }}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    onClick={() => window.open(viewingLoi.documentUrl || '#', '_blank')}
                    disabled={!viewingLoi.documentUrl}
                    sx={{ textTransform: 'none', fontWeight: 600, py: 1.5 }}
                  >
                    Open LOI Document in New Tab
                  </Button>
                </Grid> */}
              </Grid>
            )
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setViewingLoi(null)} color="error" sx={{ textTransform: "none", fontWeight: 700 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Send LOI Dialog */}
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
        <DialogTitle>Send Letter of Intent</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} pt={1}>
            <Grid item xs={12}>
              <TextField
                select
                label="Candidate (mapping line item)"
                fullWidth
                value={selectedLineItemId}
                onChange={(e) => setSelectedLineItemId(e.target.value)}
                helperText="Only line items with latest discussion outcome Interested and no existing LOI"
              >
                {eligibleLineItems.length === 0 && (
                  <MenuItem disabled value="">
                    No eligible candidates — log an Interested discussion first
                  </MenuItem>
                )}
                {eligibleLineItems.map((li) => {
                  const candidate = findCandidate(li.candidateId);
                  const mapping = mappings.find((m) => m.id === li.mappingId);
                  const req =
                    mapping?.requirement ??
                    requirements.find((r) => r.id === mapping?.requirementRecordId);
                  const reqLabel =
                    req?.requirementId ?? mapping?.requirementRecordId;
                  return (
                    <MenuItem key={li.id} value={li.id}>
                      {candidate?.name || li.candidateId} — {reqLabel} — {li.proposedTech}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{
                  py: 1.5,
                  textTransform: 'none',
                  borderStyle: 'dashed',
                  borderColor: loiFile ? 'success.main' : 'primary.main',
                  color: loiFile ? 'success.main' : 'text.primary',
                }}
              >
                {loiFile ? `Selected: ${loiFile.name}` : 'Upload LOI Letter (PDF, DOC, DOCX) *'}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setLoiFile(e.target.files?.[0] || null)}
                />
              </Button>
              {loiFile && (
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'success.main' }}>
                  File selected successfully
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color="error" sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <Send />}
            onClick={handleSendLOI}
            disabled={creating || !selectedLineItemId || !loiFile}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {creating ? 'Sending...' : 'Send LOI'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete this LOI? This action cannot be undone.</Typography>
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