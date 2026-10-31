import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Card,
  useTheme,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Paper,
  InputAdornment,
  Skeleton,
  Autocomplete,
  CircularProgress,
  Stack,
  alpha,
  TablePagination
} from "@mui/material";
import { ROWS_PER_PAGE } from "../../theme/constants";
import {
  AutoAwesome,
  Edit as EditIcon,
  Cancel,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Search as SearchIcon,
  LayersOutlined,
  CheckCircle,
  InfoOutlined,
  Refresh,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import {
  useMandates,
  useClients,
  useCreateMandate,
  useUpdateMandate,
  useDeleteMandate,
  useRequirements,
} from "../../api/hooks";
import { useTechStacks } from "../../api/hooks/useTechStacks";
import { toFormDate } from "../../api/mappers/mandate.mapper";
import type { Mandate } from "../../types";
import { tableRowStyles, tableHeaderRowStyles, actionIconButtonStyles } from '../../style/tableStyles';
import { PageHeader } from '../../components/shared';
import { MandateForm } from "./MandateForm";
import { DataBox, StatusChip, InfoRow, capitalizeStatus, DebouncedSearch } from "../../components/shared";
import { can } from "../../auth/permissions";
import { useSessionStore } from "../../store";
import { getSafeString, getSafeArrayString, toTitleCase } from "../../utils";

// ── Custom Status Badge helper to match modern skilling UI design ───────────
const getStatusBadgeStyles = (status: string, isDark: boolean) => {
  const norm = (status || 'active').toLowerCase().replace(/_/g, '-');
  switch (norm) {
    case 'active':
    case 'fulfilled':
      return {
        bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
        color: isDark ? '#34d399' : '#047857',
        border: isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0'
      };
    case 'in-mapping':
    case 'mapping':
      return {
        bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
        color: isDark ? '#fbbf24' : '#b45309',
        border: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a'
      };
    case 'mapped':
      return {
        bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
        color: isDark ? '#60a5fa' : '#1d4ed8',
        border: isDark ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe'
      };
    case 'loi-issued':
    case 'loi':
      return {
        bg: isDark ? 'rgba(20, 184, 166, 0.15)' : '#f0fdfa',
        color: isDark ? '#2dd4bf' : '#0f766e',
        border: isDark ? 'rgba(20, 184, 166, 0.3)' : '#99f6e4'
      };
    case 'cfp-started':
    case 'cfp':
      return {
        bg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#f5f3ff',
        color: isDark ? '#a78bfa' : '#6d28d9',
        border: isDark ? 'rgba(99, 102, 241, 0.3)' : '#ddd6fe'
      };
    case 'cancelled':
    case 'closed':
    case 'on-hold':
      return {
        bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
        color: isDark ? '#f87171' : '#b91c1c',
        border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fca5a5'
      };
    case 'draft':
    default:
      return {
        bg: isDark ? 'rgba(148, 163, 184, 0.15)' : '#f8fafc',
        color: isDark ? '#94a3b8' : '#475569',
        border: isDark ? 'rgba(148, 163, 184, 0.3)' : '#cbd5e1'
      };
  }
};

// ── BRD-defined mandate types ─────────────────────────────────────────────────
const MANDATE_TYPES = [
  { value: "NEW",         label: "NEW — New Mandate" },
  { value: "EXPANSION",  label: "EXPANSION — Headcount Expansion" },
  { value: "RENEW",      label: "RENEW — Contract Renewal" },
  { value: "REPLACEMENT",label: "REPLACEMENT — Role Replacement" },
  { value: "EXT",        label: "EXT — Contract Extension" },
  { value: "SUB",        label: "SUB — Sub-contract" },
] as const;

// ── Engagement Models ─────────────────────────────────────────────────────────
const ENGAGEMENT_MODELS = [
  { value: "Fresher ISA", label: "Fresher ISA" },
  { value: "Lateral",     label: "Lateral" },
  { value: "Contract",    label: "Contract" },
  { value: "Internship",  label: "Internship" },
] as const;

// ── Validation Schema ─────────────────────────────────────────────────────────
const schema = z.object({
  mandateName: z.string().min(3, "Mandate name must be at least 3 characters"),
  shortName:   z.string().min(2, "Short code required (e.g. APEX)"),
  clientId:    z.string().min(1, "Select an associated client"),
  mandateType: z.string().min(1, "Select a mandate type"),
  techStacks:  z.array(z.string()).min(1, "Select at least one technology stack"),
  openPositions: z
    .string()
    .refine((v) => !v || parseInt(v, 10) >= 0, { message: "Cannot be negative" })
    .optional(),
  startDate:      z.string().min(1, "SLA start date required"),
  onboardingDate: z.string().min(1, "Onboarding date required"),
  locations: z.string().min(1, "Enter at least one location"),
  notes:     z.string().optional(),
  engagementModel: z.string().optional(),
  jobLocation: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

// ── Fixed Columns for perfect alignment ───────────────────────────────────────
const TABLE_COLUMNS = [
  { id: 'seq', label: '#', align: 'left' as const, width: '5%' },
  { id: 'client', label: 'Client Name', align: 'left' as const, width: '22%' },
  { id: 'type', label: 'Type', align: 'left' as const, width: '13%' },
  { id: 'locations', label: 'Locations', align: 'left' as const, width: '22%' },
  { id: 'date', label: 'Target Date', align: 'left' as const, width: '15%' },
  { id: 'status', label: 'Status', align: 'left' as const, width: '13%' },
  { id: 'actions', label: 'Actions', align: 'right' as const, width: '10%' },
] as const;

const LOCATION_CHIP_VISIBLE_MAX = 2;

const locationChipSx = (isDark: boolean) => ({
  fontSize: '0.7rem',
  height: 22,
  fontWeight: 600,
  bgcolor: isDark ? 'rgba(99,102,241,0.08)' : '#f3f4f6',
  borderColor: 'divider',
  borderRadius: 1,
  maxWidth: 140,
  '& .MuiChip-label': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    px: 0.75,
  },
});

const renderLocationChips = (locations: unknown, isDark: boolean) => {
  const items = (Array.isArray(locations) ? locations : [])
    .map((loc) => toTitleCase(getSafeString(loc)))
    .filter(Boolean);

  if (items.length === 0) {
    return (
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
        —
      </Typography>
    );
  }

  const visible = items.slice(0, LOCATION_CHIP_VISIBLE_MAX);
  const overflow = items.slice(LOCATION_CHIP_VISIBLE_MAX);

  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
      {visible.map((label, idx) => (
        <Tooltip key={`${label}-${idx}`} title={label} arrow placement="top">
          <Chip
            label={label}
            size="small"
            variant="outlined"
            sx={locationChipSx(isDark)}
          />
        </Tooltip>
      ))}
      {overflow.length > 0 && (
        <Tooltip
          title={
            <Box component="span" sx={{ display: 'block', whiteSpace: 'pre-line' }}>
              {overflow.join('\n')}
            </Box>
          }
          arrow
          placement="top"
        >
          <Chip
            label={`+${overflow.length}`}
            size="small"
            variant="outlined"
            sx={locationChipSx(isDark)}
          />
        </Tooltip>
      )}
    </Box>
  );
};

export const MandatesPage: React.FC = () => {
  const theme  = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { currentUser } = useSessionStore();
  const isDark = theme.palette.mode === "dark";

  const companyInputRef = useRef<HTMLInputElement>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [openFormDialog, setOpenFormDialog] = useState<boolean>(false);
  const [editingMandate, setEditingMandate] = useState<Mandate | null>(null);
  const [viewingMandate, setViewingMandate] = useState<Mandate | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery]       = useState<string>("");
  const [statusFilter, setStatusFilter]       = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formReq, setFormReq] = useState<any>(null);
  const [formMandate, setFormMandate] = useState<Mandate | null>(null);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // ── Data hooks ────────────────────────────────────────────────────────────
  const { data: mandates = [], isLoading: mandatesLoading, refetch, isFetching, isError, error } = useMandates();

  useEffect(() => {
    if (isError && error) {
      enqueueSnackbar((error as any)?.message || 'Failed to load mandates', { variant: 'error' });
    }
  }, [isError, error, enqueueSnackbar]);
  const { data: requirements = [] } = useRequirements();
  const { data: clients  = [] }                               = useClients();
  const { data: techStackOptions = [], isLoading: techLoading } = useTechStacks();
  const { mutateAsync: createMandate, isPending: creating } = useCreateMandate();
  const { mutateAsync: updateMandate, isPending: updating } = useUpdateMandate();
  const { mutate: deleteMandateApi, isPending: isDeleting } = useDeleteMandate();

  const deleteMandate = (id: string) =>
    deleteMandateApi(id, {
      onSuccess: () => { enqueueSnackbar("Mandate deleted successfully", { variant: "success" }); setDeleteTargetId(null); },
      onError:   () => enqueueSnackbar("Failed to delete mandate",     { variant: "error"   }),
    });

  const canDelete = currentUser && can.deleteMandate(currentUser.role);
  const canCreate = currentUser && can.createMandate(currentUser.role);
  const canEdit   = currentUser && can.updateMandate(currentUser.role);

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mandateName:   "",
      shortName:     "",
      clientId:      "",
      mandateType:   "",
      techStacks:    [],
      openPositions: "0",
      startDate:     "",
      onboardingDate: "",
      locations:     "",
      notes:         "",
      engagementModel: "Fresher ISA",
      jobLocation:   "",
    },
  });

  const watchMandateName  = watch("mandateName");
  const watchShortName    = watch("shortName");
  const watchType         = watch("mandateType");
  const watchStartDate    = watch("startDate");
  const watchTechStacks   = watch("techStacks");
  const watchEngagementModel = watch("engagementModel") || "FresherISA";
  const isReadOnly        = !!viewingMandate;

  // ── Populate form when editing/viewing ───────────────────────────────────
  useEffect(() => {
    const active = editingMandate || viewingMandate;
    if (active) {
      setValue("mandateName",   active.mandateName);
      setValue("shortName",     active.shortName || active.mandateName.substring(0, 4).toUpperCase());
      setValue("clientId",      active.clientId);
      setValue("mandateType",   active.mandateType);
      setValue("techStacks",    (active.techStacks ?? []).map((t: any) => getSafeString(t)).filter(Boolean));
      setValue("openPositions", active.contractRef || "0");
      setValue("startDate",     toFormDate(active.startDate));
      setValue("onboardingDate",toFormDate(active.onboardingDate));
      setValue("locations", getSafeArrayString(active.locations));
      setValue("notes", active.notes || "");
      setValue("engagementModel", "Fresher ISA");
      setValue("jobLocation", getSafeArrayString(active.locations));
    } else {
      reset();
    }
  }, [editingMandate, viewingMandate, setValue, reset]);

  // ── Search filter ─────────────────────────────────────────────────────────
  const filteredMandates = useMemo(() => {
    let list = mandates;
    if (statusFilter) {
      list = list.filter((m) => (m.status || "active").toLowerCase() === statusFilter.toLowerCase());
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((m) => {
      const locStr = getSafeArrayString(m.locations).toLowerCase();
      const techStr = getSafeArrayString(m.techStacks).toLowerCase();
      const client = clients.find((c) => c.id === m.clientId);
      const clientName = (m.clientName || (client ? client.name : "")).toLowerCase();
      return (
        (m.clientName || m.mandateName || "").toLowerCase().includes(q) ||
        clientName.includes(q) ||
        (m.mandateType || "").toLowerCase().includes(q) ||
        locStr.includes(q) ||
        techStr.includes(q)
      );
    });
  }, [mandates, searchQuery, statusFilter, clients]);

  const visibleMandates = useMemo(() =>
    filteredMandates.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE),
    [filteredMandates, page]
  );

  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter]);

  // ── Requirement ID preview ────────────────────────────────────────────────
  const formattedDateSegment = useMemo(() => {
    if (!watchStartDate) return "DateTag";
    const d = new Date(watchStartDate);
    if (isNaN(d.getTime())) return "DateTag";
    return `${d.toLocaleDateString("en-US", { month: "short" })}${d.toLocaleDateString("en-US", { day: "2-digit" })}`;
  }, [watchStartDate]);

  const generatedRID = useMemo(() => {
    const clientShort = watchShortName ||
      (watchMandateName ? watchMandateName.substring(0, 4).toUpperCase() : "ClientShort");
    const type    = watchType || "MandateType";
    const techTag = watchTechStacks.length > 0
      ? getSafeString(watchTechStacks[0]).replace(/[^a-zA-Z0-9]/g, "")
      : "TechStack";
    const engagementTag = watchEngagementModel.replace(/\s+/g, "");
    const sequence = "116";
    return `${clientShort}-${type}-${techTag}-${engagementTag}-${formattedDateSegment}-${sequence}`;
  }, [watchShortName, watchMandateName, watchType, watchTechStacks, watchEngagementModel, formattedDateSegment]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        mandateName:    data.mandateName,
        shortName:      data.shortName,
        clientId:       data.clientId,
        mandateType:    data.mandateType,
        techStacks:     data.techStacks.map((t: any) => getSafeString(t)).filter(Boolean),
        contractRef:    data.openPositions ?? "0",
        startDate:      data.startDate,
        onboardingDate: data.onboardingDate,
        locations: data.locations
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        notes:  data.notes ?? "",
        status: "active" as const,
      };

      if (editingMandate) {
        await updateMandate({ id: editingMandate.id, ...payload });
        enqueueSnackbar("Mandate updated successfully", { variant: "success" });
      } else {
        await createMandate(payload);
        enqueueSnackbar("Mandate created successfully", { variant: "success" });
      }
      handleCloseFormDialog();
    } catch (err: any) {
      const message = err?.message || err?.error || 'Error saving mandate';
      enqueueSnackbar(message, { variant: "error" });
    }
  };

  const onView  = (m: Mandate) => { 
    const reqs = requirements.filter((r: any) => 
      r.mandateId === m.id || 
      (r.mandateId && typeof r.mandateId === 'object' && (r.mandateId.id === m.id || r.mandateId._id === m.id)) ||
      r.mandateId === (m as any)._id
    );
    const reqData = reqs.length > 0 ? reqs : (m.requirements && m.requirements.length > 0 ? m.requirements : null);
    setFormReq(reqData);
    setFormMandate(m);
    setFormMode('view');
    setShowForm(true);
  };
  const onEdit  = (m: Mandate) => { 
    const reqs = requirements.filter((r: any) => 
      r.mandateId === m.id || 
      (r.mandateId && typeof r.mandateId === 'object' && (r.mandateId.id === m.id || r.mandateId._id === m.id)) ||
      r.mandateId === (m as any)._id
    );
    const reqData = reqs.length > 0 ? reqs : (m.requirements && m.requirements.length > 0 ? m.requirements : null);
    setFormReq(reqData);
    setFormMandate(m);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleInitializeCreate = () => {
    setFormReq(null);
    setFormMandate(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleCloseFormDialog = () => {
    setShowForm(false);
    setOpenFormDialog(false);
    setEditingMandate(null);
    setViewingMandate(null);
    reset();
  };

  const existingCompanies = useMemo(() =>
    Array.from(new Set(mandates.map((m) => m.mandateName).filter(Boolean))),
    [mandates]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  if (showForm) {
    return (
      <MandateForm 
        onBack={handleCloseFormDialog} 
        mode={formMode} 
        requirement={formReq} 
        mandate={formMandate} 
      />
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader
        title="Mandates"
        subtitle={`${mandates.length} total mandates`}
        action={canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleInitializeCreate} sx={{ textTransform: "none", fontWeight: 700 }}>
            Add Mandate
          </Button>
        )}
      />

      {/* ── Table view list ── */}
        <Card
          sx={{
            borderRadius: 1,
            bgcolor: 'background.paper',
            border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.02)',
            overflow: 'hidden',
          }}
        >
          {/* Card Header Strip */}
          <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, width: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 750, color: 'text.primary', flexShrink: 0 }}>
              {mandatesLoading ? "Fetching data…" : `${filteredMandates.length} Total Mandates`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, ml: 'auto', alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
              <DebouncedSearch
                value={searchQuery}
                onChange={(val) => setSearchQuery(val)}
                placeholder="Search mandates..."
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
          </Box>

<TableContainer sx={{ width: "100%", overflowX: 'auto', bgcolor: 'transparent' }}>
  <Table sx={{ minWidth: 850, width: '100%' }}>
    <TableHead>
      <TableRow sx={tableHeaderRowStyles(isDark)}>
        {[
          { label: 'Client Name', width: '28%' },
          { label: 'Type', width: '110px' },
          { label: 'Locations', width: '22%' },
          { label: 'Target Date', width: '140px' },
          { label: 'Status', width: '130px' },
          { label: 'Actions', width: '150px', align: 'center' },
        ].map((col) => (
          <TableCell
            key={col.label}
            align={(col.align as any) || "left"}
            sx={{
              fontWeight: 700,
              fontSize: "0.82rem",
              py: 1.25, // Compact vertical padding for a sleek header
              px: 2,
              whiteSpace: 'nowrap',
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
      {mandatesLoading ? (
        <TableRow>
          <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </TableCell>
        </TableRow>
      ) : visibleMandates.length === 0 ? (
        <TableRow>
          <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
            <Typography variant="body2">No matching mandates found.</Typography>
          </TableCell>
        </TableRow>
      ) : (
        visibleMandates.map((m) => {
          return (
            <TableRow key={m.id} hover sx={tableRowStyles(isDark)}>
              
              {/* 1. Client Name */}
              <TableCell align="left" sx={{ fontWeight: 700, color: 'primary.main', py: 1.25, px: 2, verticalAlign: 'middle' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <DataBox text={toTitleCase(m.clientName || m.mandateName)} />
                </Box>
              </TableCell>

              {/* 2. Type */}
              <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                <Chip
                  label={toTitleCase(m.mandateType || "New")}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: "0.7rem",
                    height: 22,
                    fontWeight: 600,
                    bgcolor: isDark ? 'rgba(99,102,241,0.08)' : '#f3f4f6',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                />
              </TableCell>

              {/* 3. Locations */}
              <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle' }}>
                {renderLocationChips(m.locations, isDark)}
              </TableCell>

              {/* 4. Target Date */}
              <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, fontSize: "0.85rem" }}>
                  {m.onboardingDate 
                    ? new Date(m.onboardingDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) 
                    : "—"}
                </Typography>
              </TableCell>

              {/* 5. Status */}
              <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                {(() => {
                  const badge = getStatusBadgeStyles(m.status || "active", isDark);
                  return (
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1.25,
                        py: 0.4,
                        borderRadius: 3,
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        letterSpacing: '0.3px',
                        textTransform: 'capitalize',
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: 'currentColor',
                        }}
                      />
                      {capitalizeStatus(m.status || "active")}
                    </Box>
                  );
                })()}
              </TableCell>

              {/* 6. Actions (Centered Alignment - No Right Border Overlap) */}
              <TableCell align="center" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', width: '150px' }}>
                <Box 
                  sx={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    gap: 0.75,
                    width: "100%" 
                  }}
                >
                  <Tooltip title="View">
                    <IconButton
                      size="small"
                      onClick={() => onView(m)}
                      sx={actionIconButtonStyles(isDark)}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {canEdit && (
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(m)}
                        sx={actionIconButtonStyles(isDark)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canDelete && (
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTargetId(m.id)}
                        sx={actionIconButtonStyles(isDark, 'error')}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>

            </TableRow>
          );
        })
      )}
    </TableBody>
  </Table>
</TableContainer>
        
          <TablePagination
            component="div"
            count={filteredMandates.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={ROWS_PER_PAGE}
            rowsPerPageOptions={[]}
          />
        </Card>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Mandate</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this mandate? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTargetId(null)} color="error" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            sx={{ textTransform: "none" }}
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={14} color="inherit" /> : undefined}
            onClick={() => {
              if (deleteTargetId) {
                deleteMandate(deleteTargetId);
              }
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};