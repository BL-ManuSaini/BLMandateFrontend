import React, { useState, useMemo } from 'react';
import {
  useMandates,
  useRequirements,
  useMappings,
  useLOIs,
} from '../../api/hooks';
import { DataBox, StatusChip, SectionCard, DebouncedSearch } from '../../components/shared';
import {
  Box,
  Grid,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  IconButton,
  CircularProgress,
  useTheme,
  LinearProgress,
  TablePagination,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import { Search, FileDownload, Refresh, Visibility, Close } from '@mui/icons-material';
import { tableHeaderRowStyles, tableRowStyles, dashboardCardStyle, tableStyles, actionIconButtonStyles } from '../../style/tableStyles';
import { formatCsvCell, toTitleCase } from '../../utils';
import dayjs from 'dayjs';

const getStr = (val: any, fb = '—'): string => {
  let raw = '';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string' && val.trim()) raw = val.trim();
  else if (val && typeof val === 'object') raw = val.label || val.name || val.clientName || val.id || fb;
  else raw = fb;

  if (!raw || raw === fb) return fb;
  return toTitleCase(raw);
};

const getRequirementIdForMandate = (m: any, allReqs: any[] = []): string => {
  if (!m) return '—';

  // 1. Look for linked requirements in allReqs matching mandateId
  const linkedReqs = allReqs.filter(
    (r: any) =>
      r.mandateId === m.id ||
      r.mandateId === m._id ||
      (m.id && r.mandateId === m.id)
  );

  if (linkedReqs.length > 0) {
    const firstReqId = linkedReqs.find((r: any) => r.requirementId)?.requirementId;
    if (firstReqId) return firstReqId;
  }

  // 2. Check direct requirementId or requirements array in mandate object
  if (Array.isArray(m.requirements) && m.requirements.length > 0) {
    const r0 = m.requirements[0];
    if (typeof r0 === 'object' && r0?.requirementId) return r0.requirementId;
    if (typeof r0 === 'string') {
      const match = allReqs.find((r: any) => r.id === r0 || r._id === r0 || r.requirementId === r0);
      if (match?.requirementId) return match.requirementId;
      if (r0.includes('-') && r0.length > 5) return r0;
    }
  }

  if (m.requirementId) {
    const match = allReqs.find(
      (r: any) =>
        r.id === m.requirementId ||
        r._id === m.requirementId ||
        r.requirementId === m.requirementId
    );
    if (match?.requirementId) return match.requirementId;
    if (typeof m.requirementId === 'string' && m.requirementId.includes('-') && m.requirementId.length > 5) {
      return m.requirementId;
    }
  }

  if (typeof m.shortName === 'string' && m.shortName.includes('-')) {
    return m.shortName;
  }

  const prefix = m.clientName ? m.clientName.slice(0, 5).toLowerCase() : 'req';
  const tag = m.shortName ? m.shortName.toUpperCase() : 'NEW';
  return `${prefix}-${tag}-AIMLDataEng-1`;
};

const getMandateName = (m: any, allReqs: any[] = []): string => {
  return getRequirementIdForMandate(m, allReqs);
};

const getMandateTechStacks = (m: any, allReqs: any[]): string => {
  if (!m) return '—';
  if (Array.isArray(m.techStacks) && m.techStacks.length > 0) return m.techStacks.filter(Boolean).join(', ');
  if (typeof m.techStacks === 'string' && m.techStacks.trim()) return m.techStacks.trim();
  if (typeof m.techStack === 'string' && m.techStack.trim()) return m.techStack.trim();
  if (Array.isArray(m.technologies) && m.technologies.length > 0) return m.technologies.filter(Boolean).join(', ');
  if (typeof m.technologies === 'string' && m.technologies.trim()) return m.technologies.trim();
  
  const reqsForMandate = allReqs.filter(r => r.mandateId === m.id || r.mandateId === m.mandateId);
  if (reqsForMandate.length > 0) {
    const stacks = Array.from(new Set(reqsForMandate.map(r => r.techStack).filter(Boolean)));
    if (stacks.length > 0) return stacks.join(', ');
  }
  return '—';
};

const getMandateFulfillmentMetrics = (m: any, allReqs: any[] = [], allMappings: any[] = []) => {
  if (!m) return { totalOpen: 0, fulfilled: 0, percent: 0 };

  const linkedReqs = allReqs.filter(
    (r: any) =>
      r.mandateId === m.id ||
      r.mandateId === m._id ||
      (m.id && r.mandateId === m.id)
  );

  let totalOpen = 0;
  if (linkedReqs.length > 0) {
    totalOpen = linkedReqs.reduce((sum, r) => sum + (Number(r.openPositions) || 0), 0);
  } else {
    totalOpen = Number(m.openPositions) || Number(m.totalOpen) || Number(m.requirementsCount) || 0;
  }

  const linkedReqIds = new Set(linkedReqs.map((r: any) => r.id || r._id).filter(Boolean));
  const linkedMappings = allMappings.filter(
    (mp: any) =>
      linkedReqIds.has(mp.requirementId) ||
      mp.mandateId === m.id ||
      mp.mandateId === m._id
  );

  const fulfilled = linkedMappings.filter(
    (mp: any) =>
      mp.status === 'Signed' ||
      mp.status === 'Confirmed by MIS' ||
      mp.status === 'LOI Issued' ||
      mp.status === 'CFP Started'
  ).length;

  const percent = totalOpen > 0 ? Math.min(100, Math.round((fulfilled / totalOpen) * 100)) : (fulfilled > 0 ? 100 : 0);

  return { totalOpen, fulfilled, percent };
};

export const AccountManagerDashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { data: mandates = [], isLoading: mandatesLoading, isFetching: mandatesFetching, refetch: refetchMandates } = useMandates();
  const { data: requirements = [], isLoading: reqsLoading } = useRequirements();
  const { data: mappings = [] } = useMappings();
  const { data: lois = [] } = useLOIs();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 8;
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const isDataLoading = mandatesLoading || reqsLoading || mandatesFetching || isManualRefreshing;

  const filteredMandates = useMemo(() => {
    return mandates.filter(m => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const client = getStr(m.clientName).toLowerCase();
        const name = getMandateName(m).toLowerCase();
        const tech = getMandateTechStacks(m, requirements).toLowerCase();
        if (!client.includes(q) && !name.includes(q) && !tech.includes(q)) return false;
      }
      return true;
    });
  }, [mandates, searchQuery, requirements]);

  const paginatedMandates = useMemo(() => {
    return filteredMandates.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  }, [filteredMandates, page]);

  const handleExportCSV = () => {
    const headers = "Client Name,Requirement Id,Tech Stacks,Total Open,Status\n";
    const rows = filteredMandates.map(m => 
      [
        formatCsvCell(m.clientName),
        formatCsvCell(getMandateName(m)),
        formatCsvCell(getMandateTechStacks(m, requirements)),
        formatCsvCell(m.requirementsCount ?? 0),
        formatCsvCell(m.status),
      ].join(",")
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'account_manager_pipeline.csv';
    a.click();
  };

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    await refetchMandates();
    setTimeout(() => setIsManualRefreshing(false), 300);
  };

  // Dynamic Metrics Calculations
  const activeMandatesCount = useMemo(() => mandates.filter(m => m.status === 'active').length, [mandates]);
  const newMandatesThisWeek = useMemo(() => {
    const oneWeekAgo = dayjs().subtract(7, 'day');
    return mandates.filter(m => dayjs(m.createdAt).isAfter(oneWeekAgo)).length;
  }, [mandates]);
  const expiringSoonCount = useMemo(() => {
    const nextTwoWeeks = dayjs().add(14, 'day');
    return mandates.filter(m => m.onboardingDate && dayjs(m.onboardingDate).isBefore(nextTwoWeeks) && dayjs(m.onboardingDate).isAfter(dayjs())).length;
  }, [mandates]);

  const totalOpenPositions = useMemo(() => {
    return requirements.reduce((acc, r) => acc + (r.openPositions || 0), 0);
  }, [requirements]);

  const confirmedMappingsCount = useMemo(() => mappings.filter(m => m.status === 'Confirmed by MIS').length, [mappings]);
  const activeClientsCount = useMemo(() => {
    const clientsSet = new Set(mandates.map(m => m.clientName).filter(Boolean));
    return clientsSet.size;
  }, [mandates]);

  const signedLoisCount = useMemo(() => lois.filter(l => {
    const s = String(l.status || '').toLowerCase().trim().replace(/_/g, ' ');
    return s === 'signed' || s === 'loi signed' || s === 'acknowledged';
  }).length, [lois]);

  return (
    <Box sx={{ width: '100%', pt: 0.5 }}>
      {/* Top Header Row with Search & Export Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Analytics / <span style={{ color: theme.palette.primary.main }}>Account Manager Dashboard</span>
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <DebouncedSearch
            value={searchQuery}
            onChange={(val) => { setSearchQuery(val); setPage(0); }}
            placeholder="Search client, mandate, tech..."
          />

          <Button variant="contained" startIcon={<FileDownload />} onClick={handleExportCSV} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}>
            Export CSV
          </Button>

          <IconButton 
            size="small" 
            onClick={handleRefresh} 
            sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', p: 1 }}
          >
            <Refresh fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* KPI Cards Row using LOI Tracker CSS style */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <div className="kpi" style={{ height: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#94a3b8' : undefined }}>
              MY ACTIVE MANDATES
            </div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              {activeMandatesCount}
            </div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#0d9488', fontWeight: 600 }}>
              ↑ {newMandatesThisWeek} New This Week · {expiringSoonCount} Expiring Soon
            </div>
          </div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <div className="kpi green" style={{ height: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#94a3b8' : undefined }}>
              TOTAL OPEN POSITIONS
            </div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              {totalOpenPositions}
            </div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
              {activeClientsCount} Active Client Accounts
            </div>
          </div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <div className="kpi orange" style={{ height: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#94a3b8' : undefined }}>
              CONFIRMED MAPPINGS
            </div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              {confirmedMappingsCount}
            </div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
              {signedLoisCount} Signed LOIs
            </div>
          </div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <div className="kpi purple" style={{ height: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#94a3b8' : undefined }}>
              ACTIVE CLIENT ACCOUNTS
            </div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              {activeClientsCount}
            </div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600 }}>
              Fulfillment in progress
            </div>
          </div>
        </Grid>
      </Grid>

      {/* Main Mandate Pipeline Table SectionCard */}
      <SectionCard
        title={`${filteredMandates.length} Client Mandates`}
        isTableCard
        sx={dashboardCardStyle(theme)}
      >
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ ...tableStyles, minWidth: 950 }}>
            <TableHead>
              <TableRow sx={tableHeaderRowStyles(isDark)}>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Client Name</TableCell>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Tech Stacks</TableCell>
                <TableCell align="center" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Total Open</TableCell>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Fulfillment Progress</TableCell>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Status</TableCell>
                <TableCell align="center" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isDataLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontWeight: 600 }}>
                      Loading account manager mandates data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedMandates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No mandates found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMandates.map((m) => (
                  <TableRow key={m.id} hover sx={tableRowStyles(isDark)}>
                    <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <DataBox text={getStr(m.clientName)} />
                    </TableCell>
                    <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {getMandateTechStacks(m, requirements)}
                      </Typography>
                    </TableCell>
                    {(() => {
                      const metrics = getMandateFulfillmentMetrics(m, requirements, mappings);
                      const barColor = metrics.percent >= 100 ? theme.palette.success.main : metrics.percent >= 50 ? theme.palette.warning.main : theme.palette.primary.main;
                      return (
                        <>
                          <TableCell align="center" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{metrics.totalOpen}</Typography>
                          </TableCell>
                          <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', minWidth: 160 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={metrics.percent}
                                sx={{
                                  flex: 1,
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                  '& .MuiLinearProgress-bar': { bgcolor: barColor }
                                }}
                              />
                              <Tooltip title={`${metrics.fulfilled} of ${metrics.totalOpen} filled`}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: barColor, minWidth: 32 }}>
                                  {metrics.percent}%
                                </Typography>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </>
                      );
                    })()}
                    <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <StatusChip status={m.status} type="mandate" />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => setViewItem(m)} sx={actionIconButtonStyles(isDark)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>

        <TablePagination
          component="div"
          count={filteredMandates.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[]}
        />
      </SectionCard>

      {/* View Detail Dialog */}
      <Dialog open={!!viewItem} onClose={() => setViewItem(null)} PaperProps={{ sx: { minWidth: { xs: '95%', sm: 640 }, maxWidth: 800, borderRadius: 2 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Mandate Details
          <IconButton size="small" onClick={() => setViewItem(null)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {viewItem && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0, fontWeight: 500 }}>Client Name</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ wordBreak: 'break-word', textAlign: 'right' }}>{getStr(viewItem.clientName)}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0, fontWeight: 500 }}>Requirement Id</Typography>
                <DataBox text={getRequirementIdForMandate(viewItem, requirements)} sx={{
                  width: 'fit-content',
                  maxWidth: '60%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                  textAlign: 'right',
                }} />
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Tech Stacks</Typography>
                <Typography variant="body2">{getMandateTechStacks(viewItem, requirements)}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Mandate Type</Typography>
                <Typography variant="body2">{getStr(viewItem.mandateType, 'New')}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <StatusChip status={viewItem.status} type="mandate" />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewItem(null)} sx={{ color: 'error.main', fontWeight: 700, textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
