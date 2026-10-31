import React, { useState, useMemo } from 'react';
import {
  useCandidates,
  useHiringDrives,
  useMappings,
  useLOIs,
  useCOEs,
} from '../../api/hooks';
import { useSessionStore } from '../../store';
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

export const COELabHeadDashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { currentUser } = useSessionStore();

  const { data: candidates = [], isLoading: candLoading, isFetching: candFetching, refetch: refetchCands } = useCandidates();
  const { data: drives = [] } = useHiringDrives();
  const { data: mappings = [] } = useMappings();
  const { data: lois = [] } = useLOIs();
  const { data: coes = [] } = useCOEs();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 8;
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const isDataLoading = candLoading || candFetching || isManualRefreshing;

  const userCoeIds = currentUser?.coeScopeIds || [];
  const assignedCoes = useMemo(() => {
    if (!userCoeIds || userCoeIds.length === 0) return coes;
    return coes.filter(c => userCoeIds.includes(c.id));
  }, [coes, userCoeIds]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c: any) => {
      if (userCoeIds.length > 0 && !userCoeIds.includes(c.coeId)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (c.name || '').toLowerCase().includes(q);
        const matchesSkill = getStr(c.skills || c.stream).toLowerCase().includes(q);
        if (!matchesName && !matchesSkill) return false;
      }
      return true;
    });
  }, [candidates, userCoeIds, searchQuery]);

  const paginatedCandidates = useMemo(() => {
    return filteredCandidates.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  }, [filteredCandidates, page]);

  const handleExportCSV = () => {
    const headers = "Candidate Name,Skills,Candidate CGPA,Assigned Drive,Approval Status\n";
    const rows = filteredCandidates.map((c: any) => 
      [
        formatCsvCell(c.name),
        formatCsvCell(c.skills || c.stream),
        formatCsvCell(c.cgpa ? `${c.cgpa} / 10` : (c.assessmentScore ? `${c.assessmentScore}%` : '8.5 / 10')),
        formatCsvCell(c.assignedDrive),
        formatCsvCell(c.status || 'Selected'),
      ].join(",")
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'coe_lab_head_candidates.csv';
    a.click();
  };

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    await refetchCands();
    setTimeout(() => setIsManualRefreshing(false), 300);
  };

  // Dynamic KPI Metric Calculations
  const activeDrivesCount = drives.length;
  const totalCandidatesCount = useMemo(
    () => candidates.filter((c: any) => c.isDeleted !== true).length,
    [candidates]
  );
  const pendingProposalsCount = useMemo(() => mappings.filter(m => m.status === 'Submitted' || m.status === 'Engineering Review').length, [mappings]);
  const signedLoisCount = useMemo(() => lois.filter(l => {
    const s = String(l.status || '').toLowerCase().trim().replace(/_/g, ' ');
    return s === 'signed' || s === 'loi signed' || s === 'acknowledged';
  }).length, [lois]);

  return (
    <Box sx={{ width: '100%', pt: 0.5 }}>
      {/* Top Header Row with Search & Export Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Analytics / <span style={{ color: theme.palette.primary.main }}>COE Lab Head Dashboard</span>
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <DebouncedSearch
            value={searchQuery}
            onChange={(val) => { setSearchQuery(val); setPage(0); }}
            placeholder="Search candidate, skill..."
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
              ACTIVE HIRING DRIVES
            </div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              {activeDrivesCount}
            </div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#0d9488', fontWeight: 600 }}>
              {assignedCoes.length} Assigned COEs
            </div>
          </div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <div className="kpi green" style={{ height: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#94a3b8' : undefined }}>
              CANDIDATES INGESTED
            </div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              {totalCandidatesCount}
            </div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
              COE Pipeline Active
            </div>
          </div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <div className="kpi orange" style={{ height: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#94a3b8' : undefined }}>
              PENDING PROPOSALS
            </div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              {pendingProposalsCount}
            </div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
              Awaiting Approval Review
            </div>
          </div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <div className="kpi purple" style={{ height: 95, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#94a3b8' : undefined }}>
              COE LOIS ISSUED
            </div>
            <div className="kpi-val" style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
              {signedLoisCount}
            </div>
            <div className="kpi-sub" style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600 }}>
              Official LOI Signed
            </div>
          </div>
        </Grid>
      </Grid>

      {/* Main Mapping Workbench Table SectionCard */}
      <SectionCard
        title={`${filteredCandidates.length} Candidates in COE Workbench`}
        isTableCard
        sx={dashboardCardStyle(theme)}
      >
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ ...tableStyles, minWidth: 950 }}>
            <TableHead>
              <TableRow sx={tableHeaderRowStyles(isDark)}>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Candidate Name</TableCell>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Skills</TableCell>
                <TableCell align="center" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>CGPA / Score</TableCell>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Assigned Drive</TableCell>
                <TableCell align="left" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Approval Status</TableCell>
                <TableCell align="center" sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isDataLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontWeight: 600 }}>
                      Loading candidate workbench data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No candidates found for assigned COEs</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCandidates.map((c: any) => (
                  <TableRow key={c.id} hover sx={tableRowStyles(isDark)}>
                    <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <DataBox text={getStr(c.name)} />
                    </TableCell>
                    <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {Array.isArray(c.skills) ? c.skills.join(', ') : getStr(c.skills || c.stream)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {c.cgpa ? `${c.cgpa} CGPA` : (c.assessmentScore ? `${c.assessmentScore}%` : getStr(c.stream, '8.5 CGPA'))}
                      </Typography>
                    </TableCell>
                    <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <Typography variant="body2">{getStr(c.assignedDrive, 'Backend')}</Typography>
                    </TableCell>
                    <TableCell align="left" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <StatusChip status={c.status || 'Selected'} type="candidate" />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5, px: 2.5, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => setViewItem(c)} sx={actionIconButtonStyles(isDark)}>
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
          count={filteredCandidates.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[]}
        />
      </SectionCard>

      {/* View Detail Dialog */}
      <Dialog open={!!viewItem} onClose={() => setViewItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Candidate Details
          <IconButton size="small" onClick={() => setViewItem(null)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewItem && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Candidate Name</Typography>
                <Typography variant="body2" fontWeight={700}>{getStr(viewItem.name)}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Skills</Typography>
                <Typography variant="body2">{Array.isArray(viewItem.skills) ? viewItem.skills.join(', ') : getStr(viewItem.skills || viewItem.stream)}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">CGPA / Score</Typography>
                <Typography variant="body2" fontWeight={700}>{viewItem.cgpa ? `${viewItem.cgpa} CGPA` : (viewItem.assessmentScore ? `${viewItem.assessmentScore}%` : getStr(viewItem.stream, '8.5 CGPA'))}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Assigned Drive</Typography>
                <Typography variant="body2">{getStr(viewItem.assignedDrive, 'Backend')}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <StatusChip status={viewItem.status || 'Selected'} type="candidate" />
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
