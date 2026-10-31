import React from 'react';
import {
  Box, Button, Typography, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, useTheme, CircularProgress, Grid
} from '@mui/material';
import { CheckCircle, Undo, OpenInNew, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  useRequirements, useApproveMapping, useRejectMapping, useMappings, useUpdateCandidate,
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { PageHeader, DataBox, capitalizeStatus } from '../../components/shared';
import { MappingDetailContent } from '../mappings/MappingDetailPage';
import type { MappingStatus, Mapping } from '../../types';

interface ApprovalQueueProps {
  queueType: 'engineering' | 'mis';
}

export const ApprovalQueuePage: React.FC<ApprovalQueueProps> = ({ queueType }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [comment, setComment] = React.useState('');
  const [selectedMapping, setSelectedMapping] = React.useState<string | null>(null);
  const [actionType, setActionType] = React.useState<'approve' | 'reject' | null>(null);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const filterStatus: MappingStatus = queueType === 'engineering' ? 'Engineering Review' : 'Approved by Eng';
  const nextApprove: MappingStatus = queueType === 'engineering' ? 'Approved by Eng' : 'Confirmed by MIS';

  const { data: allMappings = [], isLoading, isFetching, isError, refetch: refetchMappings } = useMappings();
  const { data: requirements = [], refetch: refetchRequirements } = useRequirements();

  React.useEffect(() => {
    if (isError) {
      enqueueSnackbar('Failed to load queue data. Please try again.', { variant: 'error' });
    }
  }, [isError, enqueueSnackbar]);
  const { mutateAsync: approveMapping, isPending: approving } = useApproveMapping();
  const { mutateAsync: rejectMapping, isPending: rejecting } = useRejectMapping();
  const { mutateAsync: updateCandidate } = useUpdateCandidate();
  const isActionPending = approving || rejecting;

  const handleRefreshData = async () => {
    try {
      await Promise.all([refetchMappings(), refetchRequirements()]);
      enqueueSnackbar('Queue data reloaded', { variant: 'info' });
    } catch {
      enqueueSnackbar('Failed to reload data', { variant: 'error' });
    }
  };
  
  const pendingMappings = React.useMemo(() => allMappings.filter(m => m.status === filterStatus), [allMappings, filterStatus]);
  const approvedMappings = React.useMemo(() => allMappings.filter(m => m.status === nextApprove), [allMappings, nextApprove]);

  const [viewMappingId, setViewMappingId] = React.useState<string | null>(null);

  const handleAction = async () => {
    if (!selectedMapping || !actionType || !currentUser) return;
    try {
      const actor = { role: currentUser.role, id: currentUser.id };
      const isApprove = actionType === 'approve';

      if (isApprove) {
        await approveMapping({
          mappingId: selectedMapping,
          actor,
          nextStatus: nextApprove,
          comment,
        });
        // When MIS confirms (Confirmed by MIS), set isActive: true for all mapped candidates
        if (nextApprove === 'Confirmed by MIS') {
          const mapping = allMappings.find((m) => m.id === selectedMapping);
          const lineItems: Array<{ candidateId?: string }> = (mapping as any)?.lineItems ?? [];
          for (const li of lineItems) {
            if (li.candidateId) {
              await updateCandidate({ id: li.candidateId, isActive: true }).catch(() => {/* ignore individual failures */});
            }
          }
        }
      } else {
        await rejectMapping({
          mappingId: selectedMapping,
          actor,
          comment,
        });
      }

      enqueueSnackbar(isApprove ? 'Mapping approved!' : 'Mapping rejected', {
        variant: isApprove ? 'success' : 'warning',
      });
      setSelectedMapping(null);
      setActionType(null);
      setComment('');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.response?.data?.error || err?.message || err?.error || 'Error processing action';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const renderMappingCard = (m: Mapping, isPending: boolean) => {
    const getStr = (val: any, fb = '') => {
      if (typeof val === 'string') return val;
      if (val && typeof val === 'object') return val.label || val.name || val.id || fb;
      return fb;
    };
    const reqList: Array<{ requirementId?: string; techStack?: any; clientName?: any; location?: any; id?: string }> =
      (m.requirements && m.requirements.length > 0)
        ? m.requirements
        : (m.requirements
            ? [m.requirement]
            : (m.requirementRecordIds && m.requirementRecordIds.length > 0
                ? m.requirementRecordIds.map((id) => requirements.find((r) => r.id === id)).filter(Boolean) as Array<any>
                : (m.requirementRecordId
                    ? [requirements.find((r) => r.id === m.requirementRecordId)].filter(Boolean) as Array<any>
                    : []
                  )
              )
          );

    const firstReq = reqList[0];
    const reqCode = getStr(
      firstReq?.requirementId ?? firstReq?.id ?? m.requirementRecordId,
      m.requirementRecordId || '—'
    );
    const techStack = getStr(
      firstReq?.techStack ?? m.requirement?.techStack,
      'Role Mapped'
    );
    const clientName = getStr(firstReq?.clientName ?? m.requirement?.clientName, '—');
    const location = getStr(
      firstReq?.location ?? m.requirement?.location ?? (m as any).location ?? (m as any).locations,
      'Bangalore'
    );
    const remainingCount = Math.max(0, reqList.length - 1);

    return (
      <Box
        key={m.id}
        onClick={() => setViewMappingId(m.id)}
        sx={{
          cursor: 'pointer',
          mb: 1.5,
          borderRadius: 2,
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          bgcolor: isDark ? '#1e293b' : '#ffffff',
          p: 1.75,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: isDark
              ? '0 4px 20px rgba(0,0,0,0.5)'
              : '0 4px 16px rgba(0,0,0,0.1)',
            borderColor: isDark ? 'rgba(99,102,241,0.6)' : '#6366f1',
            bgcolor: isDark ? 'rgba(99,102,241,0.12)' : '#f5f3ff',
          },
        }}
      >
        {/* Top row: tech + actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'capitalize',
              bgcolor: isDark ? 'rgba(37,99,235,0.25)' : '#eff6ff',
              color: isDark ? '#60a5fa' : '#2563eb',
              border: `1px solid ${isDark ? 'rgba(37,99,235,0.4)' : '#bfdbfe'}`,
            }}
          >
            {techStack}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }}>
            <Tooltip title="View detail">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); setViewMappingId(m.id); }}
                sx={{
                  bgcolor: isDark ? 'rgba(99,102,241,0.2)' : '#ede9fe',
                  color: isDark ? '#a5b4fc' : '#6366f1',
                  borderRadius: 1.5,
                  p: 0.5,
                  '&:hover': { bgcolor: isDark ? 'rgba(99,102,241,0.3)' : '#ddd6fe' }
                }}
              >
                <OpenInNew fontSize="small" />
              </IconButton>
            </Tooltip>

            {isPending && (
              <>
                <Tooltip title={queueType === 'engineering' ? 'Approve' : 'Confirm'}>
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); setSelectedMapping(m.id); setActionType('approve'); }}
                    sx={{
                      bgcolor: isDark ? 'rgba(16,185,129,0.2)' : '#dcfce7',
                      color: isDark ? '#34d399' : '#16a34a',
                      borderRadius: 1.5,
                      p: 0.5,
                      '&:hover': { bgcolor: isDark ? 'rgba(16,185,129,0.3)' : '#bbf7d0' }
                    }}
                  >
                    <CheckCircle fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Revert">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); setSelectedMapping(m.id); setActionType('reject'); }}
                    sx={{
                      bgcolor: isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2',
                      color: isDark ? '#f87171' : '#dc2626',
                      borderRadius: 1.5,
                      p: 0.5,
                      '&:hover': { bgcolor: isDark ? 'rgba(239,68,68,0.3)' : '#fecaca' }
                    }}
                  >
                    <Undo fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>

        {/* Requirement ID with badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <DataBox text={reqCode} />
          {remainingCount > 0 && (
            <Tooltip
              title={`+${remainingCount} more requirements mapped`}
              arrow
              placement="top"
            >
              <Box
                sx={{
                  bgcolor: isDark ? 'rgba(147,197,253,0.15)' : '#eff6ff',
                  color: isDark ? '#93c5fd' : '#2563eb',
                  border: `1px solid ${isDark ? 'rgba(147,197,253,0.3)' : '#bfdbfe'}`,
                  borderRadius: '12px',
                  px: 0.8,
                  py: 0.15,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                +{remainingCount}
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* Data rows like DataBox */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : 'text.secondary', minWidth: 56, fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase' }}>Client</Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#ffffff' : 'text.primary', fontWeight: 600, fontSize: '0.78rem', textTransform: 'capitalize' }}>{clientName}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : 'text.secondary', minWidth: 56, fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase' }}>Location</Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#cbd5e1' : 'text.secondary', fontWeight: 500, fontSize: '0.75rem' }}>{location}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : 'text.secondary', minWidth: 56, fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase' }}>Status</Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 0.75,
                py: 0.2,
                borderRadius: 1,
                fontSize: '0.65rem',
                fontWeight: 700,
                bgcolor: isDark ? 'rgba(245,158,11,0.2)' : '#fffbeb',
                color: isDark ? '#fbbf24' : '#b45309',
                border: `1px solid ${isDark ? 'rgba(245,158,11,0.35)' : '#fde68a'}`,
              }}
            >
              {capitalizeStatus(m.status)}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  // const title = queueType === 'engineering' ? 'Engineering Review Queue' : 'MIS Confirmation Queue';
  // const subtitle = queueType === 'engineering'
  //   ? 'Mappings awaiting Head of Engineering approval'
  //   : 'Mappings awaiting MIS Manager confirmation';

  const title = queueType === 'engineering' ? 'Engineering Review Queue' : 'MIS Confirmation Queue';

const subtitle = queueType === 'engineering'
  ? 'Mappings Awaiting Head of Engineering Approval'
  : 'Mappings Awaiting MIS Manager Confirmation';

  return (
    <Box sx={{ width: '100%', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <PageHeader title={title} subtitle={subtitle} />
        {/* <Button
          variant="outlined"
          size="small"
          startIcon={isFetching ? <CircularProgress size={14} color="inherit" /> : <Refresh fontSize="small" />}
          onClick={handleRefreshData}
          disabled={isFetching}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, height: 36 }}
        >
          {isFetching ? 'Refreshing...' : 'Refresh Queue'}
        </Button> */}
      </Box>

      <Grid container spacing={3} sx={{ flex: 1, minHeight: 0, mt: -0.5, px: 3 }}>
        <Grid item xs={12} md={6} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
            <div className="panel-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="panel-title">{queueType === 'engineering' ? 'Engineering Review Queue' : 'In MIS Queue'}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--panel-text)', background: 'var(--bg-body)', padding: '2px 8px', borderRadius: 12 }}>
                {pendingMappings.length} Cards
              </span>
            </div>
            
            <div className="panel-body" style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column' }}>
              {isLoading || isFetching ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 320, p: 4, gap: 1 }}>
                  <CircularProgress size={32} />
                  <Typography variant="caption" color="text.secondary">Loading queue items...</Typography>
                </Box>
              ) : pendingMappings.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 320, textAlign: 'center', py: 4 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: isDark ? 'rgba(34, 197, 94, 0.16)' : '#e6f4ea',
                      border: `2px solid ${isDark ? 'rgba(34, 197, 94, 0.4)' : '#a7f3d0'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      boxShadow: isDark 
                        ? '0 0 16px rgba(34, 197, 94, 0.25)' 
                        : '0 4px 12px rgba(22, 163, 74, 0.12)',
                    }}
                  >
                    <CheckCircle sx={{ fontSize: 40, color: isDark ? '#4ade80' : '#16a34a' }} />
                  </Box>
                  <Typography variant="body1" fontWeight={700} sx={{ fontSize: '1rem', mb: 0.5 }}>All clear!</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No pending approvals in this queue.</Typography>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={isFetching ? <CircularProgress size={14} /> : <Refresh fontSize="small" />}
                    onClick={handleRefreshData}
                    disabled={isFetching}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Reload Data
                  </Button>
                </Box>
              ) : (
                pendingMappings.map(m => renderMappingCard(m, true))
              )}
            </div>
          </div>
        </Grid>

        <Grid item xs={12} md={6} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
            <div className="panel-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="panel-title">{queueType === 'engineering' ? 'MIS Confirmation Queue' : 'Discussion'}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--panel-text)', background: 'var(--bg-body)', padding: '2px 8px', borderRadius: 12 }}>
                {approvedMappings.length} Cards
              </span>
            </div>
            
            <div className="panel-body" style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column' }}>
              {isLoading || isFetching ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 320, p: 4, gap: 1 }}>
                  <CircularProgress size={32} />
                  <Typography variant="caption" color="text.secondary">Loading queue items...</Typography>
                </Box>
              ) : approvedMappings.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 320, textAlign: 'center', py: 4 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: isDark ? 'rgba(34, 197, 94, 0.16)' : '#e6f4ea',
                      border: `2px solid ${isDark ? 'rgba(34, 197, 94, 0.4)' : '#a7f3d0'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      boxShadow: isDark 
                        ? '0 0 16px rgba(34, 197, 94, 0.25)' 
                        : '0 4px 12px rgba(22, 163, 74, 0.12)',
                    }}
                  >
                    <CheckCircle sx={{ fontSize: 40, color: isDark ? '#4ade80' : '#16a34a' }} />
                  </Box>
                  <Typography variant="body1" fontWeight={700} sx={{ fontSize: '1rem', mb: 0.5 }}>All clear!</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No pending approvals in this queue.</Typography>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={isFetching ? <CircularProgress size={14} /> : <Refresh fontSize="small" />}
                    onClick={handleRefreshData}
                    disabled={isFetching}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Reload Data
                  </Button>
                </Box>
              ) : (
                approvedMappings.map(m => renderMappingCard(m, false))
              )}
            </div>
          </div>
        </Grid>
      </Grid>

      {/* Action Confirm Dialog */}
      <Dialog open={!!selectedMapping} onClose={() => { setSelectedMapping(null); setActionType(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>{actionType === 'approve' ? 'Confirm Action' : 'Reject Mapping'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {actionType === 'approve' 
              ? 'Are you sure you want to approve this mapping and move it to the next stage?' 
              : 'Please provide a reason for rejecting this mapping.'}
          </Typography>
          
          <TextField
            fullWidth
            label="Comments / Notes (Optional for approval)"
            multiline
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            size="small"
            required={actionType === 'reject'}
            error={actionType === 'reject' && !comment.trim()}
            disabled={isActionPending}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setSelectedMapping(null); setActionType(null); }} color="error" disabled={isActionPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleAction} 
            variant="contained" 
            color={actionType === 'approve' ? 'success' : 'error'}
            disabled={(actionType === 'reject' && !comment.trim()) || isActionPending}
          >
            {isActionPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              actionType === 'approve' ? 'Approve' : 'Reject'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!viewMappingId} onClose={() => setViewMappingId(null)} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 0 }}>
          {viewMappingId && <MappingDetailContent id={viewMappingId} onBack={() => setViewMappingId(null)} isPopup={true} />}
        </DialogContent>
      </Dialog>
    </Box>
  );
};