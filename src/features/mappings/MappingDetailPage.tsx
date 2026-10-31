import React from 'react';
import {
  Box, Button, Typography, Chip, TextField,
  Grid, Avatar, Table, TableHead, TableRow, TableCell, TableBody, 
  Stepper, Step, StepLabel, useTheme, IconButton, TablePagination, CircularProgress
} from '@mui/material';
import { ArrowBack, Send, CheckCircle, Cancel, Close } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  useMapping, useRequirement, useRequirements, useMappingLineItems,
  useCandidates, useApprovals, useAuditEvents,
  useUpdateCandidate,
  useSubmitMappingForReview, useApproveMapping, useRejectMapping,
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { StatusChip, SectionCard, InfoRow, DataBox } from '../../components/shared';
import { formatDate, formatDateTime, toTitleCase } from '../../utils';
import type { MappingStatus } from '../../types';
import { dashboardCardStyle, tableStyles, tableHeaderRowStyles, tableHeaderCellStyles, tableRowStyles } from '../../style/tableStyles';

const STEPS: MappingStatus[] = [
  'Draft', 'Submitted', 'Engineering Review', 'Approved by Eng',
  'Confirmed by MIS', 'In Discussion', 'LOI Issued', 'Signed', 'CFP Started',
];

const getStr = (val: any, fb = ''): string => {
  let raw = '';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') raw = val;
  else if (val && typeof val === 'object') raw = val.label || val.name || val.id || fb;
  else raw = fb;

  if (!raw || raw === fb) return fb;
  return toTitleCase(raw);
};

export const MappingDetailContent: React.FC<{ id: string, onBack?: () => void, isPopup?: boolean }> = ({ id, onBack, isPopup }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore(); // 
  const [comment, setComment] = React.useState('');
  const [candPage, setCandPage] = React.useState(0);
  const candRowsPerPage = 5;
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { data: mapping, isLoading: mappingLoading, refetch: refetchMapping } = useMapping(id || '');
  const { data: requirement } = useRequirement(mapping?.requirementRecordId || '');
  const { data: requirements = [] } = useRequirements();
  const { data: lineItems = [], isLoading: lineItemsLoading, refetch: refetchLineItems } = useMappingLineItems(id);
  const { data: candidates = [], isLoading: candidatesLoading } = useCandidates();
  const { data: approvals = [] } = useApprovals(id ? { mappingId: id } : undefined);
  const { data: auditEvents = [] } = useAuditEvents({ entityId: id }); 

  React.useEffect(() => {
    if (id) {
      refetchMapping();
      refetchLineItems();
    }
  }, [id, refetchMapping, refetchLineItems]);

  const isDetailLoading = mappingLoading || lineItemsLoading || candidatesLoading;

  const { mutateAsync: submitForReview, isPending: submitting } = useSubmitMappingForReview();
  const { mutateAsync: approveMapping, isPending: approving } = useApproveMapping();
  const { mutateAsync: rejectMapping, isPending: rejecting } = useRejectMapping();
  const { mutateAsync: updateCandidate } = useUpdateCandidate();

  const isActionPending = submitting || approving || rejecting;

  const mappedCandidates = React.useMemo(() => {
    return lineItems
      .map((li) => ({
        ...li,
        // Robust lookup: match against id, candidateId, _id, or externalKey
        candidate: candidates.find((c: any) =>
          c.isDeleted !== true && (
            c.id === li.candidateId ||
            c.candidateId === li.candidateId ||
            c._id === li.candidateId ||
            c.externalKey === li.candidateId
          )
        ),
      }))
      .filter((li) => li.candidate && (li.candidate as any).isDeleted !== true);
  }, [lineItems, candidates]);

  const paginatedCandidates = React.useMemo(() => {
    return mappedCandidates.slice(candPage * candRowsPerPage, candPage * candRowsPerPage + candRowsPerPage);
  }, [mappedCandidates, candPage]);

  const targetRequirements = React.useMemo(() => {
    if (!mapping) return [];

    const reqsMap = new Map<string, any>();

    // 1. Check mapping.requirements array
    if (Array.isArray((mapping as any).requirements) && (mapping as any).requirements.length > 0) {
      (mapping as any).requirements.forEach((r: any) => {
        if (r) {
          const reqId = r.id || r.requirementId || r._id;
          const full = requirements.find((item) => item.id === reqId || item.requirementId === r.requirementId) || r;
          const key = full.id || full.requirementId || JSON.stringify(full);
          reqsMap.set(key, full);
        }
      });
    }

    // 2. Check mapping.requirementRecordIds array
    if (Array.isArray((mapping as any).requirementRecordIds) && (mapping as any).requirementRecordIds.length > 0) {
      (mapping as any).requirementRecordIds.forEach((recId: string) => {
        const found = requirements.find((r) => r.id === recId || r.requirementId === recId);
        if (found) {
          reqsMap.set(found.id || found.requirementId, found);
        } else {
          reqsMap.set(recId, { requirementId: recId, id: recId });
        }
      });
    }

    // 3. Check mapping.requirement object
    if ((mapping as any).requirement) {
      const r = (mapping as any).requirement;
      const reqId = r.id || r.requirementId;
      const full = requirements.find((item) => item.id === reqId || item.requirementId === r.requirementId) || r;
      reqsMap.set(full.id || full.requirementId, full);
    }

    // 4. Check mapping.requirementRecordId single ID
    if (mapping.requirementRecordId) {
      const found = requirements.find((r) => r.id === mapping.requirementRecordId || r.requirementId === mapping.requirementRecordId);
      if (found) {
        reqsMap.set(found.id || found.requirementId, found);
      } else if (!reqsMap.has(mapping.requirementRecordId)) {
        reqsMap.set(mapping.requirementRecordId, { requirementId: mapping.requirementRecordId, id: mapping.requirementRecordId });
      }
    }

    // 5. Also collect any requirements from line items
    lineItems.forEach((li: any) => {
      const recId = li.requirementRecordId || li.requirementId;
      if (recId) {
        const found = requirements.find((r: any) => r.id === recId || r.requirementId === recId);
        if (found) {
          reqsMap.set(found.id || found.requirementId, found);
        }
      }
    });

    // 6. Fallback to single `requirement` hook data if nothing matched above
    if (reqsMap.size === 0 && requirement) {
      reqsMap.set(requirement.id || requirement.requirementId, requirement);
    }

    return Array.from(reqsMap.values());
  }, [mapping, requirement, lineItems, requirements]);

  React.useEffect(() => {
    if (!mappingLoading && !mapping && id) {
      enqueueSnackbar('Failed to load mapping details', { variant: 'error' });
    }
  }, [mappingLoading, mapping, id, enqueueSnackbar]);

  // Show a centred spinner while ANY primary data is being fetched
  if (mappingLoading || lineItemsLoading || (!mapping && isDetailLoading)) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 360, p: 4 }}>
        <CircularProgress size={44} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontWeight: 600 }}>
          Loading details...
        </Typography>
      </Box>
    );
  }

  if (!mapping) {
    return (
      <Box p={4} textAlign="center">
        <Typography color="error.main" fontWeight={600}>Failed to load mapping data.</Typography>
      </Box>
    );
  }

  const getNormalizedStepIdx = (st?: string): number => {
    if (!st) return 0;
    const s = String(st).toLowerCase().replace(/[_]/g, ' ').trim();
    if (s.includes('cfp')) return 8;
    if (s.includes('signed')) return 7;
    if (s.includes('loi issued') || s.includes('loi sent') || s.includes('loi')) return 6;
    if (s.includes('discussion')) return 5;
    if (s.includes('confirmed by mis') || s.includes('confirmed')) return 4;
    if (s.includes('approved by eng') || s.includes('approved by hoe') || s.includes('approved')) return 3;
    if (s.includes('engineering review') || s.includes('pending hoe review') || s.includes('hoe review')) return 2;
    if (s.includes('submitted')) return 1;
    if (s.includes('draft')) return 0;
    return 0;
  };

  const stepIdx = getNormalizedStepIdx(mapping.status);

  const canApproveEng = currentUser && can.engineeringApprove(currentUser.role) && (mapping.status === 'Engineering Review' || mapping.status === 'Submitted');
  const canConfirmMIS = currentUser && can.misConfirm(currentUser.role) && (mapping.status === 'Approved by Eng' || (mapping.status as string) === 'Approved by HOE');
  const canSubmit = currentUser && can.submitMapping(currentUser.role) && mapping.status === 'Draft';

  const handleSubmit = async () => {
    if (!currentUser || !id) return;
    try {
      await submitForReview({
        mappingId: id,
        actor: { role: currentUser.role, id: currentUser.id },
        comment,
      });
      enqueueSnackbar('Submitted for engineering review', { variant: 'success' });
      setComment('');
    } catch (err: any) {
      const message = err?.message || err?.error || 'Error processing action';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleApprove = async (nextStatus: MappingStatus) => {
    if (!currentUser || !id) return;
    try {
      await approveMapping({
        mappingId: id,
        actor: { role: currentUser.role, id: currentUser.id },
        nextStatus,
        comment,
      });
      // When mapping is Confirmed by MIS, set isActive: true for all mapped candidates
      if (nextStatus === 'Confirmed by MIS') {
        for (const li of lineItems) {
          if (li.candidateId) {
            await updateCandidate({ id: li.candidateId, isActive: true }).catch(() => {/* ignore individual failures */});
          }
        }
      }
      enqueueSnackbar('Mapping approved successfully', { variant: 'success' });
      setComment('');
    } catch (err: any) {
      const message = err?.message || err?.error || 'Error processing action';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleReject = async () => {
    if (!currentUser || !id) return;
    try {
      await rejectMapping({
        mappingId: id,
        actor: { role: currentUser.role, id: currentUser.id },
        comment,
      });
      enqueueSnackbar('Mapping proposal rejected', { variant: 'warning' });
      setComment('');
    } catch (err: any) {
      const message = err?.message || err?.error || 'Error processing action';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  return (
    <Box sx={{ height: isPopup ? "auto" : "calc(100vh - 80px)", display: "flex", flexDirection: "column", p: isPopup ? 3 : 0 }}>
      {/* Top Header Row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={onBack || (() => navigate('/mappings'))} 
          variant="outlined" 
          size="small"
          sx={{ 
            textTransform: "none", 
            fontWeight: 600, 
            color: '#6366f1',
            borderColor: 'rgba(99, 102, 241, 0.4)',
            borderRadius: '50px',
            px: 2.5,
            height: 38,
            backgroundColor: 'transparent',
            boxShadow: 'none',
            '&:hover': {
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.04)',
              boxShadow: 'none'
            },
            display: isPopup ? 'none' : 'inline-flex'
          }}
        >
          Back
        </Button>
        <Typography variant="h5" fontWeight={700}>Mapping Details</Typography>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatusChip status={mapping.status} type="mapping" />
          {isPopup && (
            <IconButton onClick={onBack} size="small" sx={{ ml: 1 }}>
              <Close />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Workflow Progress Tracker */}
      <SectionCard sx={{ mb: 4, ...dashboardCardStyle(theme), p: 3 }}>
        <Box sx={{ width: '100%', overflowX: 'auto', py: 1 }}>
          <Stepper activeStep={stepIdx + 1} alternativeLabel sx={{ minWidth: 720 }}>
            {STEPS.map((step, i) => {
              const displayStep =
                step === 'Engineering Review' ? 'Pending HOE Review' :
                step === 'Approved by Eng' ? 'Approved by HOE' : step;
              return (
                <Step key={step} completed={i <= stepIdx}>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.75rem', mt: 0.5 } }}>
                    {displayStep}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Box>
      </SectionCard>

      <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
      {/* Left Column: Context Data */}
      <Grid item xs={12} md={7}>
        <Box 
          sx={{ 
            maxHeight: targetRequirements.length > 1 ? '520px' : 'none', 
            overflowY: targetRequirements.length > 1 ? 'auto' : 'visible',
            pr: targetRequirements.length > 1 ? 1 : 0,
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2,
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }
          }}
        >
          {targetRequirements.length > 0 ? (
            targetRequirements.map((req: any, idx: number) => {
              const reqNotes = req.notes || req.description || (idx === 0 ? mapping?.notes : '') || '';
              return (
                <SectionCard
                  key={req.id || req.requirementId || idx}
                  title={targetRequirements.length > 1 ? `Target Requirement ${idx + 1}` : "Target Requirement"}
                  sx={{ display: 'flex', flexDirection: 'column', m: 0 }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1, flex: 1, justifyContent: 'center' }}>
                    {req.techStack && (
                      <InfoRow label="Tech Stack" value={<Chip label={getStr(req.techStack)} size="small" color="primary" variant="outlined" />} />
                    )}
                    {req.intakeType && (
                      <InfoRow label="Intake Type" value={getStr(req.intakeType)} />
                    )}
                    {req.location && (
                      <InfoRow label="Location" value={getStr(req.location)} />
                    )}
                    {req.openPositions !== undefined && (
                      <InfoRow label="Open Positions" value={getStr(req.openPositions, '0')} />
                    )}
                    {req.onboardingDate && (
                      <InfoRow label="Onboarding Target" value={formatDate(req.onboardingDate)} />
                    )}
                    <InfoRow label="Notes" value={reqNotes ? getStr(reqNotes) : "—"} />
                  </Box>
                </SectionCard>
              );
            })
          ) : (
            requirement && (
              <SectionCard title="Target Requirement" sx={{ height: '100%', display: 'flex', flexDirection: 'column', m: 0 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1, flex: 1, justifyContent: 'center' }}>
                  <InfoRow label="Tech Stack" value={<Chip label={getStr(requirement.techStack)} size="small" color="primary" variant="outlined" />} />
                  <InfoRow label="Intake Type" value={getStr(requirement.intakeType)} />
                  <InfoRow label="Location" value={getStr(requirement.location)} />
                  <InfoRow label="Open Positions" value={getStr(requirement.openPositions, '0')} />
                  <InfoRow label="Onboarding Target" value={formatDate(requirement.onboardingDate)} />
                  <InfoRow label="Notes" value={requirement?.notes || (requirement as any).description || mapping?.notes ? getStr(requirement.notes || (requirement as any).description || mapping?.notes) : "—"} />
                </Box>
              </SectionCard>
            )
          )}
        </Box>
      </Grid>

        {/* Right Column: Actions and Logs */}
        <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Active Work Action Module */}
          {(canSubmit || canApproveEng || canConfirmMIS) && (
            <SectionCard title="Review Action Required" sx={{ border: '1px solid', borderColor: theme.palette.primary.main }}>
              <TextField
                label="Decision Notes / Execution Comments" 
                fullWidth 
                multiline 
                rows={3}
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                sx={{ mb: 2, mt: 1 }} 
                disabled={isActionPending}
              />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {canSubmit && (
                  <Button 
                    variant="contained" 
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Send />} 
                    onClick={handleSubmit} 
                    fullWidth 
                    sx={{ textTransform: "none", fontWeight: 700 }}
                    disabled={isActionPending}
                  >
                    {submitting ? 'Submitting...' : 'Submit for Official Review'}
                  </Button>
                )}
                {canApproveEng && (
                  <>
                    <Button 
                      variant="contained" 
                      color="success" 
                      startIcon={approving ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />} 
                      sx={{ flex: 1, textTransform: "none", fontWeight: 700 }} 
                      onClick={() => handleApprove('Approved by Eng')}
                      disabled={isActionPending}
                    >
                      {approving ? 'Approving...' : 'Approve'}
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      startIcon={rejecting ? <CircularProgress size={16} color="inherit" /> : <Cancel />} 
                      sx={{ flex: 1, textTransform: "none", fontWeight: 700 }} 
                      onClick={handleReject}
                      disabled={isActionPending}
                    >
                      {rejecting ? 'Rejecting...' : 'Reject'}
                    </Button>
                  </>
                )}
                {canConfirmMIS && (
                  <Button 
                    variant="contained" 
                    color="success" 
                    startIcon={approving ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />} 
                    fullWidth 
                    onClick={() => handleApprove('Confirmed by MIS')} 
                    sx={{ textTransform: "none", fontWeight: 700 }}
                    disabled={isActionPending}
                  >
                    {approving ? 'Confirming...' : 'Confirm  Mapping'}
                  </Button>
                )}
              </Box>
            </SectionCard>
          )}

          {/* Historical Sign-Off Ledger */}
          <SectionCard title="Approval History" sx={{ height: '100%', display: 'flex', flexDirection: 'column', flex: 1, m: 0 }}>
            <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: '220px', mt: 1, pr: 0.5 }}>
              {approvals.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No clearance events recorded yet</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {approvals.map((ap) => (
                    <Box key={ap.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                          {toTitleCase(ap.actorRole.replace(/_/g, ' '))}
                        </Typography>
                        <Chip
                          label={toTitleCase(ap.decision)} 
                          size="small"
                          color={ap.decision === 'Approved' ? 'success' : ap.decision === 'Rejected' ? 'error' : 'default'}
                          sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                        />
                      </Box>
                      {ap.comment && (
                        <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 0.5, fontStyle: 'italic' }}>
                          "{ap.comment}"
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.disabled" display="block">
                        {formatDateTime(ap.timestamp)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </SectionCard>
        </Grid>

        {/* Full-width bottom row: Associated Candidates */}
        <Grid item xs={12}>
          <SectionCard title={`Associated Candidates (${mappedCandidates.length})`} isTableCard>
            <Box sx={{ overflowX: 'auto', width: '100%', mt: 0 }}>
              <Table size="small" sx={{ minWidth: 500 }}>
                <TableHead>
                  <TableRow sx={tableHeaderRowStyles(isDark)}>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem", py: 1.5, borderBottom: 'none', backgroundColor: isDark ? '#0f3066' : '#0a3066', color: '#ffffff' }}>Candidate Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem", py: 1.5, borderBottom: 'none', backgroundColor: isDark ? '#0f3066' : '#0a3066', color: '#ffffff' }}>Tech Stack</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem", py: 1.5, borderBottom: 'none', backgroundColor: isDark ? '#0f3066' : '#0a3066', color: '#ffffff' }}>Allocation</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem", py: 1.5, borderBottom: 'none', backgroundColor: isDark ? '#0f3066' : '#0a3066', color: '#ffffff' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCandidates.map((item) => (
                    <TableRow key={item.id} hover sx={tableRowStyles(isDark)}>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 600, bgcolor: 'primary.main' }}>
                            {item.candidate?.name.slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{toTitleCase(item.candidate?.name || item.candidateId)}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block">{item.candidate?.email || 'No email registerd'}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2">{toTitleCase(item.proposedTech)}</Typography></TableCell>
                      <TableCell>
                        <Chip label={toTitleCase(item.allocationType)} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                      </TableCell>
                      <TableCell>
                        {item.candidate && <StatusChip status={item.candidate.status} type="candidate" />}
                      </TableCell>
                    </TableRow>
                  ))}
                  {mappedCandidates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">No candidates mapped to this profile yet</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
            {mappedCandidates.length > 5 && (
              <Box sx={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <TablePagination
                  component="div"
                  count={mappedCandidates.length}
                  page={candPage}
                  onPageChange={(_, newPage) => setCandPage(newPage)}
                  rowsPerPage={candRowsPerPage}
                  rowsPerPageOptions={[]}
                />
              </Box>
            )}
          </SectionCard>
        </Grid>

        {/* Audit Timeline */}
        {/* <Grid item xs={12}>
          <SectionCard title="Audit Trail">
            {auditEvents.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No recorded audit events</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, pl: 1 }}>
                {auditEvents.map((ev) => (
                  <Box key={ev.id} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.75, flexShrink: 0, boxShadow: `0 0 0 3px ${theme.palette.primary.light}33` }} />
                    <Box sx={{ mt: -0.25 }}>
                      <Typography variant="body2" fontWeight={600} color="text.primary">{ev.action}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">{formatDateTime(ev.timestamp)}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </SectionCard>
        </Grid> */}
      </Grid>
    </Box>
  );
};

export const MappingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return <MappingDetailContent id={id!} onBack={() => navigate('/mappings')} />;
};