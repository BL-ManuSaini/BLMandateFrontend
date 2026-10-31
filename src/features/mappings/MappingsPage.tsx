

import React from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Grid, Typography, Chip, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow, InputAdornment,
  Alert, useTheme, TablePagination, CircularProgress, Autocomplete, Tooltip
} from '@mui/material';
import { Add, Search, Visibility, ArrowForward, Delete, Edit, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  useMappings, useRequirements, useCandidates, useCOEs,
  useCreateMapping, useCreateMappingLineItem,
  useSubmitMappingForReview, useApproveMapping, useUpdateCandidate, useDeleteMapping
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { StatusChip, PageHeader, SectionCard, DataBox, DebouncedSearch } from '../../components/shared';
import { formatDate } from '../../utils';
import { CandidateStatus, type Mapping } from '../../types';
import { 
  dashboardCardStyle, 
  tableRowStyles, 
  actionIconButtonStyles,
  tableHeaderRowStyles
} from '../../style/tableStyles';
import { ROWS_PER_PAGE } from '../../theme/constants';

export const MappingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(0);
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const [newOpen, setNewOpen] = React.useState(false);
  const [selectedReqIds, setSelectedReqIds] = React.useState<string[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState('');
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const { data: mappings = [], isLoading, refetch, isFetching, isError, error } = useMappings();

  console.log("mapping data ", mappings)
  const { data: requirements = [] } = useRequirements();
  const { data: candidates = [] } = useCandidates();
  console.log("mapping candidate ", candidates)
  const { data: coes = [], isLoading: coesLoading, isError: coesError, error: coesErr } = useCOEs();
  const { mutateAsync: createMapping, isPending: creatingMapping } = useCreateMapping();
  const { mutateAsync: createLineItem, isPending: creatingLineItem } = useCreateMappingLineItem();
  const { mutateAsync: submitForReview } = useSubmitMappingForReview();
  const { mutateAsync: approveMapping } = useApproveMapping();
  const { mutateAsync: updateCandidate, isPending: updatingCandidate } = useUpdateCandidate();
  const { mutateAsync: deleteMapping, isPending: deleting } = useDeleteMapping();
  
  const isSaving = creatingMapping || creatingLineItem || updatingCandidate;
  const canDelete = currentUser && can.deleteMapping(currentUser.role);
  const canEdit = currentUser && can.deleteMapping(currentUser.role); // Preserved existing logic
  
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const requirement = requirements.find((r) => r.id === selectedReqIds[0]);
  const remainingCap = requirement ? requirement.openPositions - requirement.filledPositions : 0;

  const eligibleCandidates = React.useMemo(() => {
    return candidates.filter((c) => {
      if (!c.status) return false;
      const st = c.status.toLowerCase().trim().replace(/_/g, ' ');
      return st === CandidateStatus.SELECTED.toLowerCase();
    });
  }, [candidates]);

 const filtered = mappings.filter((m) => {
  const q = search.toLowerCase().trim();

  // 1. Requirement list calculate karna
  const reqList: Array<{ requirementId?: string; clientName?: string; id?: string }> =
    (m.requirements && m.requirements.length > 0)
      ? m.requirements
      : (m.requirement
          ? [m.requirement]
          : (m.requirementRecordIds && m.requirementRecordIds.length > 0
              ? m.requirementRecordIds.map((id) => requirements.find((r) => r.id === id)).filter(Boolean) as Array<{ requirementId?: string; clientName?: string; id?: string }>
              : (m.requirementRecordId
                  ? [requirements.find((r) => r.id === m.requirementRecordId)].filter(Boolean) as Array<{ requirementId?: string; clientName?: string; id?: string }>
                  : []
                )
            )
        );

  const firstReq = reqList[0];

  // 🛑 REQUIREMENT ID CHECK: 
 
  const hasRequirementId = Boolean(
    firstReq?.requirementId || firstReq?.id || m.requirementRecordId
  );

  if (!hasRequirementId) {
    return false; // 
  }

  // 2. Search filter logic
  const matchesSearch =
    !q ||
    (m.status?.toLowerCase() ?? '').includes(q) ||
    (m.notes?.toLowerCase() ?? '').includes(q) ||
    reqList.some((r) =>
      (r?.requirementId?.toLowerCase() ?? '').includes(q) ||
      (r?.clientName?.toLowerCase() ?? '').includes(q)
    );

  // 3. Status filter logic
  const matchesStatus = !statusFilter || (m.status?.toLowerCase() ?? '') === statusFilter.toLowerCase();
  
  return matchesSearch && matchesStatus;
});

  React.useEffect(() => {
    setPage(0);
  }, [search, statusFilter]);

  const paginatedMappings = React.useMemo(() =>
    filtered.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE),
    [filtered, page]
  );
  React.useEffect(() => {
    if (isError && error) {
      enqueueSnackbar((error as any)?.message || 'Failed to load mappings', { variant: 'error' });
    }
  }, [isError, error, enqueueSnackbar]);


   console.log("selected candidate", selectedCandidateIds)
  const handleSubmitMapping = async () => {
    if (selectedReqIds.length === 0 || selectedCandidateIds.length === 0) {
      enqueueSnackbar('Select at least one requirement and one candidate', { variant: 'warning' });
      return;
    }
    const validCandidateIds = selectedCandidateIds.filter((id): id is string => Boolean(id))
   
    if (validCandidateIds.length === 0) {
      enqueueSnackbar('Selected candidates are missing IDs — refresh and try again', { variant: 'error' });
      return;
    }
    if (!currentUser) return;

    try {
      const response = await createMapping({
        requirementRecordIds: selectedReqIds,
        status: 'Draft',
        createdBy: currentUser.id,
        currentOwnerRole: currentUser.role,
        notes,
      });

      const createdMappings = Array.isArray(response) ? response : [response];

      for (const mapping of createdMappings) {
        const req = requirements.find(r => r.id === mapping.requirementRecordId);
        
        let techStr = '';
        if (typeof req?.techStack === 'string') {
          techStr = req.techStack;
        } else if (req?.techStack && typeof req.techStack === 'object') {
          techStr = (req.techStack as any).label || (req.techStack as any).name || (req.techStack as any).id || '';
        }

        for (const candidateId of validCandidateIds) {
          await createLineItem({
            mappingId: mapping.id,
            candidateId,
            proposedTech: techStr,
            allocationType: 'Primary',
          });
          
          await updateCandidate({
            id: candidateId,
            status: 'Proposed',
          });
        }
      }

      enqueueSnackbar(`Mappings created as Draft for ${selectedReqIds.length} requirement(s)`, { variant: 'success' });
      setNewOpen(false);
      setSelectedReqIds([]);
      setSelectedCandidateIds([]);
      setNotes('');
    } catch (err: any) {
      const message = err?.message || err?.error || 'Error creating mapping';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleAdvanceStatus = async (mapping: Mapping) => {
    if (!currentUser) return;
    const actor = { role: currentUser.role, id: currentUser.id };
    try {
      if (mapping.status === 'Draft') {
        await submitForReview({ mappingId: mapping.id, actor });
        enqueueSnackbar('Status → Pending HOE Review', { variant: 'success' });
        return;
      }
      if (mapping.status === 'Engineering Review') {
        await approveMapping({ mappingId: mapping.id, actor, nextStatus: 'Approved by Eng' });
        enqueueSnackbar('Status → Approved by HOE', { variant: 'success' });
        return;
      }
      if (mapping.status === 'Approved by Eng') {
        await approveMapping({ mappingId: mapping.id, actor, nextStatus: 'Confirmed by MIS' });
        // Set isActive: true for all mapped candidates
        const lineItems = (mapping as any).lineItems ?? [];
        for (const li of lineItems) {
          if (li.candidateId) {
            await updateCandidate({ id: li.candidateId, isActive: true }).catch(() => {/* ignore individual failures */});
          }
        }
        enqueueSnackbar('Status → Confirmed by MIS', { variant: 'success' });
      }
    } catch (err: any) {
      const message = err?.message || err?.error || 'Error updating mapping status';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const canCreate = currentUser && can.createMapping(currentUser.role);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMapping(deletingId);
      enqueueSnackbar('Mapping deleted successfully', { variant: 'success' });
      setDeletingId(null);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to delete mapping', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Mappings"
        subtitle={`${mappings.length} total mapping records`}
        action={canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setNewOpen(true)} sx={{ textTransform: "none", fontWeight: 700 }}>
            New Mapping
          </Button>
        )}
      />

      <SectionCard
        title={`${filtered.length} Total Mappings`}
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
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150, bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="engineering review">Pending HOE Review</MenuItem>
              <MenuItem value="approved by eng">Approved by HOE</MenuItem>
              <MenuItem value="confirmed by mis">Confirmed by MIS</MenuItem>
              <MenuItem value="in discussion">In Discussion</MenuItem>
              <MenuItem value="loi issued">LOI Issued</MenuItem>
              <MenuItem value="signed">Signed</MenuItem>
              <MenuItem value="cfp started">CFP Started</MenuItem>
            </TextField>
            <IconButton 
              size="small" 
              onClick={() => refetch()} 
              disabled={isFetching}
              sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', p: 1 }}
            >
              {isFetching ? <CircularProgress size={18} color="inherit" /> : <Refresh fontSize="small" />}
            </IconButton>
          </Box>
        }
        sx={dashboardCardStyle(theme)}
      >
        
        {/* =====================================================================
             IMPROVED TABLE UI (Perfect Alignment, Dynamic Widths, Hover Notes)
            ===================================================================== */}
      <Box sx={{ overflowX: 'auto', width: '100%' }}>
  <Table sx={{ minWidth: 1050, width: '100%', tableLayout: 'auto' }}>
    <TableHead>
      <TableRow sx={tableHeaderRowStyles(isDark)}>
        {[
          { label: 'Requirement Id', minWidth: '380px', align: 'left' },
          { label: 'Status', minWidth: '180px', align: 'left' },
          { label: 'Created', minWidth: '140px', align: 'left' },
          { label: 'Notes', minWidth: '200px', align: 'left' },
          { label: 'Actions', minWidth: '120px', align: 'center' },
        ].map((col) => (
          <TableCell
            key={col.label}
            align={col.align as any}
            sx={{
              fontWeight: 700,
              fontSize: "0.82rem",
              py: 1.5, 
              px: 2.5, 
              whiteSpace: 'nowrap',
              borderBottom: 'none',
              backgroundColor: isDark ? '#0f3066' : '#0a3066',
              color: '#ffffff',
              minWidth: col.minWidth,
              boxSizing: 'border-box'
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
      ) : (
        paginatedMappings.map((m) => {
          const reqList: Array<{ requirementId?: string; clientName?: string; id?: string }> =
            (m.requirements && m.requirements.length > 0)
              ? m.requirements
              : (m.requirement
                  ? [m.requirement]
                  : (m.requirementRecordIds && m.requirementRecordIds.length > 0
                      ? m.requirementRecordIds.map((id) => requirements.find((r) => r.id === id)).filter(Boolean) as Array<{ requirementId?: string; clientName?: string; id?: string }>
                      : (m.requirementRecordId
                          ? [requirements.find((r) => r.id === m.requirementRecordId)].filter(Boolean) as Array<{ requirementId?: string; clientName?: string; id?: string }>
                          : []
                        )
                    )
                );

          const firstReq = reqList[0];
          const firstReqCode =
            firstReq?.requirementId ??
            (firstReq?.id ?? m.requirementRecordId) ??
            '—';
          const fullReqLabel = `${firstReqCode}`;
          const remainingCount = Math.max(0, reqList.length - 1);

          const remainingTooltipText = reqList
            .slice(1)
            .map((r) => (r?.requirementId ? `${r.requirementId}` : ''))
            .filter(Boolean)
            .join(', ');

          return (
            <TableRow key={m.id} hover sx={tableRowStyles(isDark)}>
              
              <TableCell align="left" sx={{ py: 2, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap', minWidth: 360, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                  <DataBox text={fullReqLabel} />

                  {remainingCount > 0 && (
                    <Tooltip 
                      title={
                        <Box 
                          sx={{ 
                            maxHeight: '200px', 
                            overflowY: 'auto',  
                            p: 0.5,
                            '&::-webkit-scrollbar': { width: '5px' },
                            '&::-webkit-scrollbar-track': { background: 'transparent' },
                            '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '4px' },
                            '&::-webkit-scrollbar-thumb:hover': { backgroundColor: 'rgba(255,255,255,0.5)' }
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, color: '#93c5fd' }}>
                            Other Requirements ({remainingCount}):
                          </Typography>
                          <Typography variant="caption" sx={{ whiteSpace: 'pre-line', display: 'block', lineHeight: 1.5, fontSize: '0.75rem', wordBreak: 'break-word' }}>
                            {remainingTooltipText}
                          </Typography>
                        </Box>
                      } 
                      arrow 
                      placement="top"
                      componentsProps={{
                        tooltip: {
                          sx: {
                            maxWidth: 350, 
                            bgcolor: isDark ? '#1e293b' : '#0f172a', 
                            color: '#f8fafc',
                            p: 1.5,
                            borderRadius: 1.5,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                          },
                        },
                        arrow: {
                          sx: {
                            color: isDark ? '#1e293b' : '#0f172a',
                          }
                        }
                      }}
                    >
                      <Chip
                        label={`+${remainingCount}`}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          borderRadius: '16px',
                          bgcolor: 'transparent',
                          border: '1px solid',
                          borderColor: '#a78bfa', 
                          color: '#6d28d9',
                          flexShrink: 0,
                          mt: 0.5
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
              </TableCell>

              {/* 2. Status */}
              <TableCell align="left" sx={{ py: 2, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap', borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                <StatusChip status={m.status} type="mapping" />
              </TableCell>

              {/* 3. Created Date */}
              <TableCell align="left" sx={{ py: 2, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap', borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.primary', fontWeight: 500 }}>
                  {formatDate(m.createdAt)}
                </Typography>
              </TableCell>

              {/* 4. Notes */}
              <TableCell align="left" sx={{ py: 2, px: 2.5, verticalAlign: 'middle', borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                {m.notes ? (
                  <Tooltip 
                    title={
                      <Box 
                        sx={{ 
                          maxHeight: '200px', 
                          overflowY: 'auto',  
                          p: 0.5,
                          whiteSpace: 'pre-wrap', 
                          wordBreak: 'break-word', 
                          '&::-webkit-scrollbar': { width: '5px' },
                          '&::-webkit-scrollbar-track': { background: 'transparent' },
                          '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '4px' },
                          '&::-webkit-scrollbar-thumb:hover': { backgroundColor: 'rgba(255,255,255,0.5)' }
                        }}
                      >
                        {m.notes}
                      </Box>
                    } 
                    arrow 
                    placement="top"
                    componentsProps={{
                      tooltip: {
                        sx: {
                          maxWidth: 350, 
                          bgcolor: isDark ? '#1e293b' : '#0f172a',
                          color: '#f8fafc',
                          p: 1.5, 
                          borderRadius: 1.5,
                          fontSize: '0.8rem',
                          lineHeight: 1.6,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                        },
                      },
                      arrow: {
                        sx: {
                          color: isDark ? '#1e293b' : '#0f172a',
                        }
                      }
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.primary" 
                      noWrap 
                      sx={{ 
                        maxWidth: '100%', 
                        display: 'block', 
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      {m.notes}
                    </Typography>
                  </Tooltip>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    —
                  </Typography>
                )}
              </TableCell>

              {/* 5. Actions */}
              <TableCell align="center" sx={{ py: 2, px: 2.5, verticalAlign: 'middle', borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                  <IconButton 
                    size="small" 
                    onClick={() => navigate(`/mappings/${m.id}`)} 
                    sx={{ ...actionIconButtonStyles(isDark), border: '1px solid', borderColor: 'divider', borderRadius: '8px' }} 
                    title="View"
                  >
                    <Visibility fontSize="small" sx={{ color: 'text.secondary' }} />
                  </IconButton>

                  {canDelete && (
                    <IconButton 
                      size="small" 
                      onClick={() => setDeletingId(m.id)} 
                      sx={{ ...actionIconButtonStyles(isDark, 'error'), border: '1, 1px solid', borderColor: 'divider', borderRadius: '8px' }} 
                      title="Delete"
                    >
                      <Delete fontSize="small" color="error" />
                    </IconButton>
                  )}
                </Box>
              </TableCell>

            </TableRow>
          );
        })
      )}

      {filtered.length === 0 && !isLoading && (
        <TableRow>
          <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
            <Typography variant="body2" color="text.secondary">No mappings found</Typography>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
</Box>
        {/* ======================= END IMPROVED TABLE ======================= */}

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

      {/* New Mapping Dialog */}
      <Dialog 
        open={newOpen} 
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            setNewOpen(false);
          }
        }} 
        disableEscapeKeyDown
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Create Mapping Proposal</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} pt={1}>
            <Grid item xs={12}>
             <Autocomplete
  multiple
  limitTags={2}
  options={requirements.filter((r) => r.status === 'active')}
  getOptionLabel={(r) => `${r.requirementId} (${r.clientName || 'No Client'}) — ${r.openPositions - r.filledPositions} open`}
  value={requirements.filter(r => selectedReqIds.includes(r.id))}
  onChange={(e: any, newValues, reason, details) => {
    if (reason === 'removeOption' && details?.option) {
      const target = e?.target as HTMLElement | null;
      const isDropdownClick = target?.closest('.MuiAutocomplete-option') || target?.closest('[role="option"]');
      if (isDropdownClick) {
        return;
      }
    }
    const uniqueIds = Array.from(new Set(newValues.map(v => v.id)));
    setSelectedReqIds(uniqueIds);
  }}
  sx={{
    '& .MuiChip-root': {
      maxWidth: 'calc(100% - 8px)',
      margin: '2px', 
    },
    '& .MuiChip-label': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }
  }}
  renderInput={(params) => (
    <TextField 
      {...params} 
      label="Select Requirements" 
      placeholder="Search requirements..." 
      fullWidth 
    />
  )}
/>
              {selectedReqIds.length > 0 && (
                <Alert severity="info" sx={{ mt: 1.5 }}>
                  Creating mappings for {selectedReqIds.length} requirement(s)
                </Alert>
              )}
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Select Candidates ({selectedCandidateIds.length} selected)
                </Typography>
                {eligibleCandidates.length > 0 && (
                  <Button
                    size="small"
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                    onClick={() => {
                      if (selectedCandidateIds.length === eligibleCandidates.length) {
                        setSelectedCandidateIds([]);
                      } else {
                        setSelectedCandidateIds(eligibleCandidates.map((c) => c.id));
                      }
                    }}
                  >
                    {selectedCandidateIds.length === eligibleCandidates.length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </Box>
              <Box sx={{ maxHeight: 280, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={tableHeaderRowStyles(isDark)}>
                      <TableCell 
                        padding="checkbox" 
                        sx={{ 
                          fontWeight: 700, 
                          fontSize: "0.82rem", 
                          py: 1.5, 
                          borderBottom: 'none', 
                          backgroundColor: isDark ? '#0f3066' : '#0a3066', 
                          color: '#ffffff',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          if (eligibleCandidates.length > 0 && selectedCandidateIds.length === eligibleCandidates.length) {
                            setSelectedCandidateIds([]);
                          } else {
                            setSelectedCandidateIds(eligibleCandidates.map((c) => c.id));
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          style={{ cursor: 'pointer' }}
                          checked={eligibleCandidates.length > 0 && selectedCandidateIds.length === eligibleCandidates.length}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedCandidateIds(eligibleCandidates.map((c) => c.id));
                            } else {
                              setSelectedCandidateIds([]);
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem", py: 1.5, borderBottom: 'none', backgroundColor: isDark ? '#0f3066' : '#0a3066', color: '#ffffff' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem", py: 1.5, borderBottom: 'none', backgroundColor: isDark ? '#0f3066' : '#0a3066', color: '#ffffff' }}>COE</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem", py: 1.5, borderBottom: 'none', backgroundColor: isDark ? '#0f3066' : '#0a3066', color: '#ffffff' }}>Skills</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem", py: 1.5, borderBottom: 'none', backgroundColor: isDark ? '#0f3066' : '#0a3066', color: '#ffffff' }}>Score</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem", py: 1.5, borderBottom: 'none', backgroundColor: isDark ? '#0f3066' : '#0a3066', color: '#ffffff' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {eligibleCandidates.map((c) => {
                      const coe = coes.find((co) => co.id === c.coeId);
                      const checked = selectedCandidateIds.includes(c.id);
                      return (
                        <TableRow 
                          key={c.id} 
                          hover
                          onClick={() => setSelectedCandidateIds((prev) =>
                            checked ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                          )}
                          sx={{ cursor: 'pointer', bgcolor: checked ? 'action.selected' : 'inherit' }}
                        >
                          <TableCell padding="checkbox">
                            <input 
                              type="checkbox" 
                              checked={checked} 
                              onChange={() => {}} 
                              style={{ cursor: 'pointer' }} 
                            />
                          </TableCell>
                          <TableCell><Typography variant="body2" fontWeight={600}>{c.name}</Typography></TableCell>
                          <TableCell><Typography variant="caption">{coe?.name}</Typography></TableCell>
                          <TableCell>
                            {c.skills.slice(0, 2).map((s) => (
                              <Chip key={s} label={s} size="small" sx={{ mr: 0.5, fontSize: '0.65rem', height: 18 }} />
                            ))}
                          </TableCell>
                          <TableCell><Typography variant="body2" fontWeight={700}>{c.cgpa.toFixed(1)}</Typography></TableCell>
                          <TableCell><StatusChip status={c.status} type="candidate" /></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField 
                label="Notes" 
                fullWidth 
                multiline 
                rows={3} 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setNewOpen(false)} color="error" sx={{ textTransform: "none", fontWeight: 700 }} >Cancel</Button>
          <Button variant="contained" onClick={handleSubmitMapping} disabled={isSaving} sx={{ textTransform: "none", fontWeight: 700 }}>
            {isSaving ? (
              <>
                <span className="spinner-border" style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', marginRight: 6 }} />
                Saving...
              </>
            ) : (
              'Save Draft'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete this mapping? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeletingId(null)} color="error" sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting} sx={{ textTransform: "none", fontWeight: 700 }}>
            {deleting ? (
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
    </Box>
  );
};