import React, { useState, useMemo } from 'react';
import {
  useMappings,
  useRequirements,
  useCandidates,
  useCOEs,
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
  TablePagination,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import { FileDownload, Refresh, Visibility, Close } from '@mui/icons-material';
import { formatCsvCell, toTitleCase } from '../../utils';
import { tableHeaderRowStyles, tableRowStyles, dashboardCardStyle, tableStyles, actionIconButtonStyles } from '../../style/tableStyles';

const getStr = (val: any, fb = '—'): string => {
  let raw = '';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string' && val.trim()) raw = val.trim();
  else if (val && typeof val === 'object') raw = val.label || val.name || val.clientName || val.id || fb;
  else raw = fb;

  if (!raw || raw === fb) return fb;
  return toTitleCase(raw);
};

export const HeadOfEngineeringDashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { data: mappings = [], isLoading: mapLoading, isFetching: mapFetching, refetch: refetchMappings } = useMappings();
  const { data: requirements = [] } = useRequirements();
  const { data: candidates = [] } = useCandidates();
  const { data: coes = [] } = useCOEs();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 8;
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const isDataLoading = mapLoading || mapFetching || isManualRefreshing;

  const reviewQueue = useMemo(() => {
    return mappings.filter(m => {
      if (m.status !== 'Engineering Review' && m.status !== 'Submitted' && m.status !== 'Approved by Eng') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = (m.id || '').toLowerCase().includes(q);
        const matchesReq = (m.requirementRecordId || '').toLowerCase().includes(q);
        if (!matchesId && !matchesReq) return false;
      }
      return true;
    });
  }, [mappings, searchQuery]);

  const paginatedQueue = useMemo(() => {
    return reviewQueue.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  }, [reviewQueue, page]);

  const handleExportCSV = () => {
    const headers = "Client Name,Required Tech Stack,COE Source,AI Suitability Score,Review Status\n";
    const rows = paginatedQueue.map((m: any) => {
      const req = requirements.find(r => r.id === m.requirementRecordId);
      return [
        formatCsvCell(req?.clientName || '—'),
        formatCsvCell(req?.techStack || '—'),
        formatCsvCell(m.coeId || '—'),
        formatCsvCell(m.suitabilityScore ? `${m.suitabilityScore}%` : '—'),
        formatCsvCell(m.status),
      ].join(",");
    }).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'engineering_review_queue.csv';
    a.click();
  };

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    await refetchMappings();
    setTimeout(() => setIsManualRefreshing(false), 300);
  };

  // Dynamic KPI Metric Calculations
  const pendingProposalsCount = useMemo(() => mappings.filter(m => m.status === 'Engineering Review' || m.status === 'Submitted').length, [mappings]);
  const approvedEngCount = useMemo(() => mappings.filter(m => m.status === 'Approved by Eng' || m.status === 'Confirmed by MIS').length, [mappings]);
  const totalTechStacksCount = useMemo(() => {
    const techSet = new Set(requirements.map(r => r.techStack).filter(Boolean));
    return techSet.size;
  }, [requirements]);
  const activeCoesCount = coes.length;

  return (
    <Box sx={{ width: '100%', pt: 0.5 }}>
      {/* Top Header Row with Search & Export Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Analytics / <span style={{ color: theme.palette.primary.main }}>Head of Engineering Dashboard</span>
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <DebouncedSearch
            value={searchQuery}
            onChange={(val) => { setSearchQuery(val); setPage(0); }}
            placeholder="Search client, tech..."
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
          <div className="kpi orange" style={{ height: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#94a3b8' : undefined }}>
              MAPPING PROPOSALS PENDING
            </div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              {pendingProposalsCount}
            </div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
              Awaiting Technical Review
            </div>
          </div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <div className="kpi green" style={{ height: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#94a3b8' : undefined }}>
              ENGINEERING APPROVALS
            </div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              {approvedEngCount}
            </div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
              Verified & Approved
            </div>
          </div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <div className="kpi" style={{ height: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#94a3b8' : undefined }}>
              TOTAL TECH STACKS
            </div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              {totalTechStacksCount}
            </div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#0d9488', fontWeight: 600 }}>
              Active Tech Competencies
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
              Under Technical Governance
            </div>
          </div>
        </Grid>
      </Grid>

      {/* Main Engineering Review Queue Table SectionCard */}
      <SectionCard
        title={`${reviewQueue.length} Proposals in Review Queue`}
        isTableCard
        sx={dashboardCardStyle(theme)}
      >
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ ...tableStyles, minWidth: 950 }}>
            <TableHead>
              <TableRow sx={tableHeaderRowStyles(isDark)}>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Client Name</TableCell>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Required Tech Stack</TableCell>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>COE Source</TableCell>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Candidate Name</TableCell>
                <TableCell align="center" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>AI Suitability Score</TableCell>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Review Status</TableCell>
                <TableCell align="center" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isDataLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontWeight: 600 }}>
                      Loading engineering review queue data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedQueue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No items in engineering review queue</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedQueue.map((m: any) => {
                  const req = requirements.find(r => r.id === m.requirementRecordId);
                  const cand = candidates.find(c => c.id === m.candidateId);
                  return (
                    <TableRow key={m.id} hover sx={tableRowStyles(isDark)}>
                      <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{getStr(req?.clientName, '—')}</Typography>
                      </TableCell>
                      <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{getStr(req?.techStack, '—')}</Typography>
                      </TableCell>
                      <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <Typography variant="body2">{getStr(m.coeId, '—')}</Typography>
                      </TableCell>
                      <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <DataBox text={getStr(cand?.name, '—')} />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                          {m.suitabilityScore ? `${m.suitabilityScore}%` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <StatusChip status={m.status} type="mapping" />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => setViewItem({ ...m, req, cand })} sx={actionIconButtonStyles(isDark)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>

        <TablePagination
          component="div"
          count={reviewQueue.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[]}
        />
      </SectionCard>

      {/* View Detail Dialog */}
      <Dialog open={!!viewItem} onClose={() => setViewItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Proposal Details
          <IconButton size="small" onClick={() => setViewItem(null)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewItem && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Client Name</Typography>
                <Typography variant="body2" fontWeight={700}>{getStr(viewItem.req?.clientName, '—')}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Tech Stack</Typography>
                <Typography variant="body2">{getStr(viewItem.req?.techStack, '—')}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Candidate Name</Typography>
                <DataBox text={getStr(viewItem.cand?.name, '—')} />
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">AI Suitability Score</Typography>
                <Typography variant="body2" fontWeight={700} color="success.main">{viewItem.suitabilityScore ? `${viewItem.suitabilityScore}%` : '—'}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <StatusChip status={viewItem.status} type="mapping" />
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
