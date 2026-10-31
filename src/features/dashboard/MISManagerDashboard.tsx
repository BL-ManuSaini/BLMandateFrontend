import React, { useState, useMemo } from 'react';
import {
  useMandates,
  useRequirements,
  useCOEs,
  useMappings,
  useLOIs,
  useHiringDrives,
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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  TablePagination,
  Chip,
} from '@mui/material';
import { Search, Visibility, Close, FileDownload, Refresh } from '@mui/icons-material';
import { tableHeaderRowStyles, tableRowStyles, dashboardCardStyle, tableStyles, actionIconButtonStyles } from '../../style/tableStyles';
import { getSafeString, formatDate, formatCsvCell, toTitleCase } from '../../utils';
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

export const MISManagerDashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { data: mandates = [], isLoading: mandatesLoading, isFetching: mandatesFetching, refetch: refetchMandates } = useMandates();
  const { data: requirements = [], isLoading: reqsLoading, isFetching: reqsFetching, refetch: refetchReqs } = useRequirements();
  const { data: coes = [] } = useCOEs();
  const { data: mappings = [] } = useMappings();
  const { data: lois = [] } = useLOIs();
  const { data: drives = [] } = useHiringDrives();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const isDataLoading = mandatesLoading || reqsLoading || mandatesFetching || reqsFetching || isManualRefreshing;

  const filteredRequirements = useMemo(() => {
    return requirements.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = (r.requirementId || '').toLowerCase().includes(q);
        const matchesClient = (r.clientName || '').toLowerCase().includes(q);
        const matchesTech = getSafeString(r.techStack).toLowerCase().includes(q);
        const matchesLoc = getSafeString(r.location).toLowerCase().includes(q);
        if (!matchesId && !matchesClient && !matchesTech && !matchesLoc) return false;
      }
      return true;
    });
  }, [requirements, searchQuery]);

  const paginatedRequirements = useMemo(() => {
    return filteredRequirements.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  }, [filteredRequirements, page]);

  const handleExportCSV = () => {
    const headers = "Requirement ID,Client Name,Tech Stack,Open Positions,Total Mapped,Status,Location\n";
    const rows = filteredRequirements.map(r => 
      [
        formatCsvCell(r.requirementId),
        formatCsvCell(r.clientName),
        formatCsvCell(r.techStack),
        formatCsvCell(r.openPositions ?? 0),
        formatCsvCell(r.mappingsCount ?? 0),
        formatCsvCell(r.status),
        formatCsvCell(r.location),
      ].join(",")
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mis_dashboard_pipeline.csv';
    a.click();
  };

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    await Promise.all([refetchMandates(), refetchReqs()]);
    setTimeout(() => setIsManualRefreshing(false), 300);
  };

  // Dynamic Metrics Calculations
  const activeMandates = useMemo(() => mandates.filter(m => m.status === 'active'), [mandates]);
  const activeMandatesCount = activeMandates.length;
  const newMandatesThisWeek = useMemo(() => {
    const oneWeekAgo = dayjs().subtract(7, 'day');
    return mandates.filter(m => dayjs(m.createdAt).isAfter(oneWeekAgo)).length;
  }, [mandates]);
  const expiringSoonCount = useMemo(() => {
    const nextTwoWeeks = dayjs().add(14, 'day');
    return mandates.filter(m => m.onboardingDate && dayjs(m.onboardingDate).isBefore(nextTwoWeeks) && dayjs(m.onboardingDate).isAfter(dayjs())).length;
  }, [mandates]);

  const confirmedMappings = useMemo(() => mappings.filter(m => m.status === 'Confirmed by MIS'), [mappings]);
  const confirmedMappingsCount = confirmedMappings.length;
  const activeClientsCount = useMemo(() => {
    const clientsSet = new Set(confirmedMappings.map(m => (m as any).clientName).filter(Boolean));
    return clientsSet.size || (new Set(requirements.map(r => r.clientName).filter(Boolean))).size;
  }, [confirmedMappings, requirements]);

  const avgAgeDays = useMemo(() => {
    if (confirmedMappings.length === 0) return 8;
    const totalDays = confirmedMappings.reduce((acc, m) => acc + dayjs().diff(dayjs(m.createdAt), 'day'), 0);
    return Math.round(totalDays / confirmedMappings.length) || 8;
  }, [confirmedMappings]);

  const signedLoisCount = useMemo(() => lois.filter(l => {
    const s = String(l.status || '').toLowerCase().trim().replace(/_/g, ' ');
    return s === 'signed' || s === 'loi signed' || s === 'acknowledged';
  }).length, [lois]);
  const pendingLoisCount = useMemo(() => lois.filter(l => {
    const s = String(l.status || '').toLowerCase().trim().replace(/_/g, ' ');
    return s === 'sent' || s === 'loi sent' || s === 'pending';
  }).length, [lois]);
  const declinedLoisCount = useMemo(() => lois.filter(l => {
    const s = String(l.status || '').toLowerCase().trim().replace(/_/g, ' ');
    return s === 'cancelled' || s === 'declined' || s === 'rejected';
  }).length, [lois]);

  const activeCoesCount = coes.length;
  const drivesTodayCount = useMemo(() => {
    return drives.filter(d => dayjs(d.date).isSame(dayjs(), 'day')).length;
  }, [drives]);

  return (
    <Box sx={{ width: '100%', pt: 0.5 }}>
      {/* Top Header Row with Search & Export Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
          Analytics / <span style={{ color: theme.palette.primary.main }}>MIS Dashboard</span>
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <DebouncedSearch
            value={searchQuery}
            onChange={(val) => { setSearchQuery(val); setPage(0); }}
            placeholder="Search ID, client, tech..."
          />

          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={handleExportCSV}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
          >
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
              ACTIVE MANDATES
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
              MAPPINGS CONFIRMED
            </div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              {confirmedMappingsCount}
            </div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
              {activeClientsCount} Active Clients · Avg Age: {avgAgeDays} Days
            </div>
          </div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <div className="kpi orange" style={{ height: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#94a3b8' : undefined }}>
              LOIS ISSUED
            </div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              {signedLoisCount}
            </div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
              {signedLoisCount} signed · {pendingLoisCount} pending · {declinedLoisCount} declined
            </div>
          </div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <div className="kpi purple" style={{ height: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#94a3b8' : undefined }}>
              ACTIVE COES
            </div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              {activeCoesCount}
            </div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600 }}>
              {drivesTodayCount} drives today
            </div>
          </div>
        </Grid>
      </Grid>

      {/* Main Table Card inside SectionCard */}
      <SectionCard
        title={`${filteredRequirements.length} Requirements in Pipeline`}
        isTableCard
        sx={dashboardCardStyle(theme)}
      >
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ ...tableStyles, minWidth: 1100 }}>
            <TableHead>
              <TableRow sx={tableHeaderRowStyles(isDark)}>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap', minWidth: 320 }}>Requirement Id</TableCell>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Client Name</TableCell>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Tech Stack</TableCell>
                <TableCell align="center" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Open Positions</TableCell>
                <TableCell align="center" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Total Mapped</TableCell>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Status</TableCell>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Location</TableCell>
                <TableCell align="center" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isDataLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontWeight: 600 }}>
                      Loading dashboard requirements data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedRequirements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No requirements found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequirements.map((r) => (
                  <TableRow key={r.id} hover sx={tableRowStyles(isDark)}>
                    <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap', minWidth: 320 }}>
                      <DataBox text={getStr(r.requirementId)} />
                    </TableCell>
                    <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {getStr(r.clientName)}
                      </Typography>
                    </TableCell>
                    <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {getStr(r.techStack)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {r.openPositions ?? 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {r.mappingsCount ?? 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <StatusChip status={r.status} type="requirement" />
                    </TableCell>
                    <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <Chip label={toTitleCase(getStr(r.location))} size="small" sx={{ fontSize: '0.75rem', height: 22 }} />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => setViewItem(r)} sx={actionIconButtonStyles(isDark)}>
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
          count={filteredRequirements.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[]}
        />
      </SectionCard>

      {/* View Detail Dialog */}
      <Dialog open={!!viewItem} onClose={() => setViewItem(null)} PaperProps={{ sx: { minWidth: { xs: '90%', sm: 560 }, maxWidth: 700, borderRadius: 2 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Requirement Details
          <IconButton size="small" onClick={() => setViewItem(null)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewItem && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0, mt: 0.25 }}>Requirement Id</Typography>
                <DataBox text={getStr(viewItem.requirementId)} sx={{ 
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>Client Name</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word', textAlign: 'right' }}>{getStr(viewItem.clientName)}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Tech Stack</Typography>
                <Chip label={toTitleCase(getStr(viewItem.techStack))} size="small" sx={{ fontSize: '0.75rem', height: 22 }} />
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Intake Type</Typography>
                <Typography variant="body2">{getStr(viewItem.intakeType)}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Location</Typography>
                <Chip label={toTitleCase(getStr(viewItem.location))} size="small" sx={{ fontSize: '0.75rem', height: 22 }} />
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Open Positions</Typography>
                <Typography variant="body2" fontWeight={700}>{viewItem.openPositions ?? 0}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                {/* <Typography variant="body2" color="text.secondary">Onboarding Target</Typography>
                <Typography variant="body2">{formatDate(viewItem.onboardingDate)}</Typography> */}
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Notes</Typography>
                <Typography variant="body2">{getStr(viewItem.notes || viewItem.description)}</Typography>
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
