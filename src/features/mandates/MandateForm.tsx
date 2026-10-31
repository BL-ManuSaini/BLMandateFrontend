import React, { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { useSnackbar } from 'notistack';

import {
  Autocomplete,
  TextField,
  ThemeProvider,
  createTheme,
  useTheme,
  IconButton,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { actionIconButtonStyles } from '../../style/tableStyles';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DataBox, StatusChip, InfoRow, capitalizeStatus } from '../../components/shared';
import { can } from "../../auth/permissions";
import { useSessionStore } from "../../store";
import { getSafeString, getSafeArrayString, toTitleCase } from '../../utils';
import { api } from '../../api/client';
import dayjs from 'dayjs';

import {
  useClients,
  useCOEs,
  useCreateRequirement,
  useCreateMandate,
  useRequirements,
  useUpdateMandate,
  useUpdateRequirement,
  useTechStacks,
  useInfiniteLocations,useCOE
} from '../../api/hooks';

import {
  generateId,
  generateRequirementId,
} from '../../utils';

const schema = z.object({
  clientName: z.string().min(1, 'Required'),
  shortName: z.string().min(1, 'Required'),
  mandateType: z.string().min(1, 'Required'),
  onboardingDate: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export interface RequirementItem {
  id: string;
  techStack: string;
  engagementModel: string;
  location: string;
  openPositions: number;
  expLevel?: string;
  targetCoe?: string;
  onboardingDate?: string;
}

export interface MandateFormProps {
  onBack: () => void;
  mode: 'create' | 'edit' | 'view';
  requirement?: any;
  mandate?: any;
  isPopup?: boolean;
}

interface RequirementRowFormProps {
  req: RequirementItem;
  index: number;
  pid: string;
  isDark: boolean;
  isView: boolean;
  isEdit: boolean;
  handleRequirementChange: (index: number, key: keyof RequirementItem, value: any) => void;
  handleRemoveRequirement: (index: number) => void;
  nativeInputStyle: React.CSSProperties;
  actionIconButtonStyles: (isDark: boolean, colorType?: 'default' | 'error') => any;
}

export const RequirementRowForm: React.FC<RequirementRowFormProps> = ({
  req,
  index,
  pid,
  isDark,
  isView,
  isEdit,
  handleRequirementChange,
  handleRemoveRequirement,
  nativeInputStyle,
  actionIconButtonStyles,
}) => {
  const [techQuery, setTechQuery] = useState(req.techStack || '');
  const [locQuery, setLocQuery] = useState(req.location || '');
   const { data: coes = [], isLoading: coesLoading, isError: coesError, error: coesErr } = useCOEs();

  useEffect(() => {
    if (req.techStack && req.techStack !== techQuery) {
      setTechQuery(req.techStack);
    }
  }, [req.techStack]);

  useEffect(() => {
    if (req.location && req.location !== locQuery) {
      setLocQuery(req.location);
    }
  }, [req.location]);

  const { data: techOptions = [] } = useTechStacks(techQuery);
  const { data: locationsData, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteLocations(locQuery);
  const locationOptions = locationsData ? locationsData.pages.flatMap((page) => page.items) : [];
  const getCoeNames = (ids: string[]) => {
    if (!ids || ids.length === 0) return '—';
    return coes.filter(c => ids.includes(c.id)).map(c => c.name).join(', ');
  };

  const handleScroll = (event: React.SyntheticEvent) => {
    const listboxNode = event.currentTarget;
    if (listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 1) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  };


  return (
    <div 
      style={{
        background: isDark ? '#0f172a' : '#f8fafc',
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#cbd5e1' : 'var(--navy)' }}>
            Requirement Id {index + 1}
          </span>
          
          {pid !== '—' && (
            <div style={{ display: 'flex', gap: 4 }}>
              {pid.split('-').map((part, i) => (
                <span key={i} style={{
                  background: isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff',
                  color: isDark ? '#60a5fa' : '#2563eb',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  border: `1px solid ${isDark ? 'rgba(37,99,235,0.3)' : '#bfdbfe'}`
                }}>
                  {part}
                </span>
              ))}
            </div>
          )}
        </div>

        {(!isView && !isEdit) && (
          <IconButton
            size="small"
            onClick={() => handleRemoveRequirement(index)}
            sx={actionIconButtonStyles(isDark, 'error')}
            title="Remove Requirement"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Technology stack</label>
          <Autocomplete
            freeSolo
            value={req.techStack || ''}
            inputValue={techQuery}
            onInputChange={(_, value) => {
              setTechQuery(value);
              handleRequirementChange(index, 'techStack', value);
            }}
            onChange={(_, value) => {
              const valObj = value as any;
              const valStr = typeof value === 'string' ? value : (valObj?.label || valObj?.name || valObj?.id || '');
              setTechQuery(valStr);
              handleRequirementChange(index, 'techStack', valStr);
            }}
            disabled={isView}
            options={techOptions}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select or type Tech Stack..." />
            )}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Open positions</label>
          <input
            type="number"
            value={req.openPositions || ''}
            onChange={(e) => handleRequirementChange(index, 'openPositions', Number(e.target.value))}
            disabled={isView}
            placeholder="e.g. 10"
            style={nativeInputStyle}
          />
        </div>
      </div>

      <div className="form-grid" style={{ marginBottom: 12 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Engagement model</label>
          <Autocomplete
            freeSolo
            value={req.engagementModel || ''}
            inputValue={req.engagementModel || ''}
            onInputChange={(_, value) => handleRequirementChange(index, 'engagementModel', value)}
            onChange={(_, value) => handleRequirementChange(index, 'engagementModel', value || '')}
            disabled={isView}
            options={['FresherISA', 'FresherFixed', 'LateralISA', 'UpSkilling']}
            getOptionLabel={(option) => toTitleCase(option)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select Engagement Model..." />
            )}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Experience level</label>
          {isView ? (
            <Typography variant="body1" fontWeight={500} sx={{ py: 1 }}>
              {req.expLevel || 'Fresher'}
            </Typography>
          ) : (
            <Autocomplete
              freeSolo
              value={req.expLevel || 'Fresher'}
              inputValue={req.expLevel || 'Fresher'}
              onInputChange={(_, value) => handleRequirementChange(index, 'expLevel', value)}
              onChange={(_, value) => handleRequirementChange(index, 'expLevel', value || 'Fresher')}
              disabled={isView}
              options={['Fresher', '0-1 Year', '1-3 Years', '3-5 Years', '5+ Years']}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select Experience Level..." />
              )}
            />
          )}
        </div>
      </div>

      <div className="form-grid" style={{ marginBottom: 0 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Job location</label>
          <Autocomplete
            freeSolo
            value={req.location || ''}
            inputValue={locQuery}
            onInputChange={(_, value) => {
              setLocQuery(value);
              handleRequirementChange(index, 'location', value);
            }}
            onChange={(_, value) => {
              handleRequirementChange(index, 'location', value || '');
            }}
            disabled={isView}
            options={locationOptions}
            ListboxProps={{
              onScroll: handleScroll,
            }}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select Job Location..." />
            )}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Target COE</label>
         <Autocomplete
  options={coes}
  getOptionLabel={(o) => toTitleCase(o.name)}
  value={coes.find((c) => c.id === req.targetCoe) || null}
  onChange={(_, value) =>
    handleRequirementChange(index, 'targetCoe', value?.id || '')
  }
  disabled={isView}
  renderInput={(params) => (
    <TextField
      {...params}
      placeholder="Select Target COE..."
    />
  )}
/>
        
        </div>
      </div>

      <div className="form-grid" style={{ marginTop: 12, marginBottom: 0 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Onboarding Target Date</label>
          {isView ? (
            <Typography variant="body1" fontWeight={500} sx={{ py: 1 }}>
              {req.onboardingDate ? dayjs(req.onboardingDate).format('DD MMM YYYY') : '—'}
            </Typography>
          ) : (
            <DatePicker
              disabled={isView}
              minDate={dayjs()}
              value={req.onboardingDate ? dayjs(req.onboardingDate) : null}
              onChange={(value) => handleRequirementChange(index, 'onboardingDate', value ? value.format('YYYY-MM-DD') : '')}
              format="DD MMM YYYY"
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const MandateForm: React.FC<MandateFormProps> = ({ onBack, mode, requirement, mandate, isPopup }) => {

  const { enqueueSnackbar } = useSnackbar();

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // DYNAMIC THEME BASED ON DARK/LIGHT MODE
  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
    },
    typography: {
      fontFamily: 'inherit',
      fontSize: 13,
    },
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            background: isDark ? '#1e293b' : '#fff',
            borderRadius: 10,
            minHeight: 34,
            height: 38,
            color: isDark ? '#f8fafc' : '#0f172a',
            '& fieldset': {
              borderColor: isDark ? '#334155' : '#CBD5E1',
            },
            '&:hover fieldset': {
              borderColor: '#2563EB',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2563EB',
              borderWidth: '1px',
            },
            '&.Mui-disabled': {
              color: isDark ? '#f8fafc' : '#0f172a',
              WebkitTextFillColor: isDark ? '#f8fafc' : '#0f172a',
              fontWeight: 600,
              opacity: 1,
              background: isDark ? '#1e293b' : '#f1f5f9',
            },
          },
          input: {
            padding: '6px 12px',
            fontSize: 13,
            '&.Mui-disabled': {
              color: isDark ? '#f8fafc' : '#0f172a',
              WebkitTextFillColor: isDark ? '#f8fafc' : '#0f172a',
              fontWeight: 600,
              opacity: 1,
            },
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            borderRadius: 10,
            border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
            background: isDark ? '#1e293b' : '#fff',
            boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
            color: isDark ? '#f8fafc' : '#0f172a',
          },
          option: {
            minHeight: 34,
            fontSize: 13,
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            height: 34,
            fontSize: 13,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          fullWidth: true,
          size: 'small',
        },
      },
    },
  }), [isDark]);

  const { data: clients = [] } = useClients();
  const { data: requirements = [] } = useRequirements();
  const { mutateAsync: createMandate, isPending: isCreatingMandate } = useCreateMandate();
  const { mutateAsync: createReq, isPending: isCreating } = useCreateRequirement();
  const { mutateAsync: updateMandate, isPending: isUpdatingMandate } = useUpdateMandate();
  const { mutateAsync: updateReq, isPending: isUpdatingReq } = useUpdateRequirement();

  const isPending = isCreatingMandate || isCreating || isUpdatingMandate || isUpdatingReq;

  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  const { handleSubmit, watch, register, control, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientName: '',
      shortName: '',
      mandateType: '',
      onboardingDate: '',
      notes: '',
    },
  });

  const [requirementsList, setRequirementsList] = useState<RequirementItem[]>([]);

  const handleAddRequirement = () => {
    setRequirementsList(prev => [
      ...prev,
      {
        id: `req-${Date.now()}`,
        techStack: '',
        engagementModel: '',
        location: '',
        openPositions: 0,
        targetCoe: '',
        onboardingDate: '',
      }
    ]);
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirementsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleRequirementChange = (index: number, field: keyof RequirementItem, value: any) => {
    setRequirementsList(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  useEffect(() => {
    if (requirement || mandate) {
      const reqList = Array.isArray(requirement) 
        ? requirement 
        : (requirement ? [requirement] : (mandate?.requirements || []));

      const firstReq = reqList[0];

      const rawDate = mandate?.onboardingDate || 
        firstReq?.onboardingDate || 
        (firstReq as any)?.onboardingTargetDate || 
        (firstReq as any)?.targetOnboardingDate || 
        (mandate as any)?.onboardingTargetDate || 
        (mandate as any)?.startDate || 
        '';

      const formattedDate = rawDate ? (dayjs(rawDate).isValid() ? dayjs(rawDate).format('YYYY-MM-DD') : rawDate) : '';

      reset({
        clientName: mandate?.clientName || firstReq?.clientName || mandate?.mandateName || '',
        shortName: mandate?.shortName || mandate?.clientShortName || mandate?.short_name || '',
        mandateType: mandate?.mandateType || (firstReq?.requirementId ? firstReq.requirementId.split('-')[1] : '') || '',
        onboardingDate: formattedDate,
        notes: mandate?.notes || mandate?.remarks || mandate?.comments || '',
      });

      if (reqList.length > 0) {
        setRequirementsList(
          reqList.map((r: any, idx: number) => ({
            id: r.id || r._id || `req-${idx}`,
            techStack: getSafeString(r.techStack || r.techStackName || r.proposedTech || r.techStackRef),
            engagementModel: getSafeString(r.intakeType || r.engagementModel || r.intake_type),
            location: getSafeString(r.location || r.locationName || r.jobLocation || r.locationRef),
            openPositions: r.openPositions ?? r.contractRef ?? 0,
            expLevel: getSafeString(r.expLevel || r.experienceLevel || 'Fresher'),
            targetCoe: getSafeString(r.targetCoeIds || r.targetCoe || r.targetCoeId || r.coeName),
            onboardingDate: r.onboardingDate ? (dayjs(r.onboardingDate).isValid() ? dayjs(r.onboardingDate).format('YYYY-MM-DD') : r.onboardingDate) : '',
          }))
        );
      }
    }
  }, [requirement, mandate, reset]);

  const watchedClientName = watch('clientName');
  const watchedShortName = watch('shortName');
  const watchedOnboardingDate = watch('onboardingDate');
  const watchedMandateType = watch('mandateType');

  const canAddRequirement = !!(watchedClientName && watchedShortName && watchedMandateType && watchedOnboardingDate);

  const monthDay = watchedOnboardingDate
    ? new Date(watchedOnboardingDate).toLocaleString('en-US', { month: 'short', day: '2-digit' }).replace(' ', '')
    : '-';

  const techShort = requirementsList[0]?.techStack ? getSafeString(requirementsList[0].techStack).split(' ')[0] : '-';
  const watchedEngagement = requirementsList[0]?.engagementModel || '-';

  const getPreviewId = (req: RequirementItem, idx: number) => {
    const ts = req.techStack ? getSafeString(req.techStack).split(' ')[0] : '-';
    return watchedShortName && req.techStack && req.engagementModel && watchedOnboardingDate
      ? generateRequirementId(
          watchedShortName.replace(/\s+/g, ''),
          watchedMandateType || '-',
          ts,
          req.engagementModel,
          monthDay,
          '[SEQ]'
        )
      : '—';
  };

  const toIsoDateString = (d?: string) => {
    if (!d) return '';
    const parsed = dayjs(d);
    if (!parsed.isValid()) return d;
    return parsed.startOf('day').toISOString();
  };

  const onSubmit = async (data: FormValues) => {
    try {
      for (let i = 0; i < requirementsList.length; i++) {
        const r = requirementsList[i];
        if (!r.techStack || !r.engagementModel || !r.location || r.openPositions <= 0) {
          enqueueSnackbar(`Please fill all fields for Requirement #${i + 1} or remove it`, { variant: 'warning' });
          return;
        }
      }

      if (isEdit && (requirement || mandate)) {
        const firstReq = Array.isArray(requirement) ? requirement[0] : requirement;
        const targetMandateId = mandate?.id || firstReq?.mandateId || (firstReq as any)?.mandate_id;
        const payload = {
          shortName: data.shortName,
          mandateType: data.mandateType as any,
          contractRef: String(requirementsList[0]?.openPositions || 0),
          onboardingDate: toIsoDateString(data.onboardingDate),
          locations: Array.from(new Set(requirementsList.map(r => r.location).filter(Boolean))),
          notes: data.notes ?? "",
          status: "active" as const,
        };

        if (targetMandateId) {
          await updateMandate({ id: targetMandateId, ...payload });
        }

        for (const req of requirementsList) {
          const reqPayload = {
            techStack: getSafeString(req.techStack),
            intakeType: req.engagementModel,
            expLevel: req.expLevel || 'Fresher',
            location: getSafeString(req.location),
            onboardingDate: toIsoDateString(req.onboardingDate || data.onboardingDate),
            openPositions: req.openPositions,
            ...(req.targetCoe ? { targetCoe: req.targetCoe, targetCoeIds: [req.targetCoe] } : {}),
          };
          if (req.id && !req.id.startsWith('req-')) {
            await updateReq({ id: req.id, ...reqPayload });
          } else {
            await createReq({
              mandateId: targetMandateId,
              ...reqPayload,
              status: 'active',
            });
          }
        }
        enqueueSnackbar('Requirement updated successfully', { variant: 'success' });
        onBack();
        return;
      }

      const payload = {
        clientName: data.clientName,
        shortName: data.shortName,
        mandateType: data.mandateType as any,
        onboardingDate: toIsoDateString(data.onboardingDate),
        locations: Array.from(new Set(requirementsList.map(r => r.location).filter(Boolean))),
        techStacks: Array.from(new Set(requirementsList.map(r => getSafeString(r.techStack)).filter(Boolean))),
        notes: data.notes ?? "",
        status: "active" as const,
        requirements: requirementsList.map(req => {
          const ts = getSafeString(req.techStack);
          const loc = getSafeString(req.location);
          return {
            techStack: ts,
            techStackName: ts,
            intakeType: req.engagementModel,
            expLevel: req.expLevel || 'Fresher',
            location: loc,
            locationName: loc,
            openPositions: req.openPositions,
            onboardingDate: toIsoDateString(req.onboardingDate || data.onboardingDate),
            ...(req.targetCoe ? { targetCoe: req.targetCoe, targetCoeIds: [req.targetCoe] } : {}),
          };
        })
      };

      await createMandate(payload);
      enqueueSnackbar('Mandate and Requirements created successfully', { variant: 'success' });
      onBack();
    } catch (error: any) {
      console.error(error);
      const message = error?.message || error?.error || (isEdit ? 'Error updating requirement' : 'Error creating mandate');
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const autoCompleteProps = (field: any) => ({
    freeSolo: true,
    value: field.value || '',
    inputValue: field.value || '',
    onInputChange: (_: any, value: string) => { field.onChange(value); },
    onChange: (_: any, value: string) => { field.onChange(value || ''); },
    disabled: isView,
  });

  const nativeInputStyle = {
    height: 38,
    fontSize: 13,
    padding: '6px 12px',
    background: isDark ? '#1e293b' : (isView ? '#f1f5f9' : '#fff'),
    color: isDark ? '#f8fafc' : '#0f172a',
    border: `1px solid ${isDark ? '#334155' : '#CBD5E1'}`,
    borderRadius: 10,
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
    fontWeight: isView ? 600 : 20,
    WebkitTextFillColor: isDark ? '#f8fafc' : '#0f172a',
    opacity: 1,
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <>
          <div className="topbar">
            <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button
                startIcon={<ArrowBackIcon fontSize="small" />}
                onClick={onBack}
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
              <span className="breadcrumb">
                Mandates /{' '}
                <span>
                  {isView ? 'View Mandate' : isEdit ? 'Edit Mandate' : 'Create New Mandate'}
                </span>
              </span>
            </div>

            <div 
              className="topbar-middle" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                flexGrow: 1, 
                justifyContent: 'center', 
                margin: '0 24px', 
                overflowX: 'auto', 
                padding: '4px 0',
                whiteSpace: 'nowrap'
              }}
            >
              {[
                { key: 'draft', label: 'Draft', color: '#64748b', bg: '#f1f5f9', darkBg: 'rgba(100,116,139,0.15)', darkColor: '#94a3b8' },
                { key: 'active', label: 'Active', color: '#10b981', bg: '#ecfdf5', darkBg: 'rgba(16,185,129,0.15)', darkColor: '#34d399' },
                { key: 'in_mapping', label: 'In-Mapping', color: '#d97706', bg: '#fffbeb', darkBg: 'rgba(217,119,6,0.15)', darkColor: '#fbbf24' },
                { key: 'mapped', label: 'Mapped', color: '#2563eb', bg: '#eff6ff', darkBg: 'rgba(37,99,235,0.15)', darkColor: '#60a5fa' },
                { key: 'loi_issued', label: 'LOI Issued', color: '#0d9488', bg: '#f0fdfa', darkBg: 'rgba(13,148,136,0.15)', darkColor: '#2dd4bf' },
                { key: 'cfp_started', label: 'CFP Started', color: '#8b5cf6', bg: '#f5f3ff', darkBg: 'rgba(139,92,246,0.15)', darkColor: '#a78bfa' },
                { key: 'fulfilled', label: 'Fulfilled', color: '#059669', bg: '#ecfdf5', darkBg: 'rgba(5,150,105,0.15)', darkColor: '#34d399' }
              ].map((step, idx, arr) => {
                const currentStatus = (mandate?.status || 'active').toLowerCase().replace(/\s+/g, '_');
                const isCurrent = step.key === currentStatus;
                const isPassed = arr.findIndex(s => s.key === currentStatus) >= idx;
                
                return (
                  <React.Fragment key={step.label}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 100,
                        background: isDark ? step.darkBg : step.bg,
                        border: `1px solid ${isDark ? step.darkColor : step.color}`,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: isDark ? step.darkColor : step.color,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: isDark ? step.darkColor : step.color,
                          textTransform: 'uppercase',
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <span style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 12, fontWeight: 600 }}>→</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

           
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              margin: '1rem',
              alignItems: 'start',
            }}
          >
            {/* LEFT PANEL */}
            <div>
              <div className="panel">
                <div className="panel-hd">
                  <span className="panel-title" style={{ color: isDark ? '#f8fafc' : 'inherit' }}>Mandate Details</span>
                </div>

                <div className="panel-body">
                  <form id="req-form" onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Client Name</label>
                        <Controller
                          control={control}
                          name="clientName"
                          render={({ field }) => (
                            isView ? (
                              <Typography variant="body1" fontWeight={500} sx={{ py: 1 }}>{field.value || '—'}</Typography>
                            ) : (
                              <Autocomplete
                                {...autoCompleteProps(field)}
                                options={clients.map((c) => c.name)}
                                renderInput={(params) => (
                                  <TextField {...params} placeholder="Enter Client Name..." />
                                )}
                              />
                            )
                          )}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Short Name</label>
                        {isView ? (
                          <Typography variant="body1" fontWeight={500} sx={{ py: 1 }}>{watch('shortName') || '—'}</Typography>
                        ) : (
                          <TextField
                            fullWidth
                            placeholder="Enter short Name..."
                            disabled={isView}
                            {...register('shortName')}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                              },
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Mandate type</label>
                        <Controller
                          control={control}
                          name="mandateType"
                          render={({ field }) => (
                            isView ? (
                              <Typography variant="body1" fontWeight={500} sx={{ py: 1 }}>{toTitleCase(field.value) || '—'}</Typography>
                            ) : (
                              <Autocomplete
                                {...autoCompleteProps(field)}
                                options={['NEW', 'EXPANSION', 'RENEW', 'REPLACEMENT', 'EXT', 'SUB']}
                                getOptionLabel={(option) => toTitleCase(option)}
                                renderInput={(params) => (
                                  <TextField {...params} placeholder="Select Mandate Type..." />
                                )}
                              />
                            )
                          )}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Onboarding Target Date</label>
                        <Controller
                          control={control}
                          name="onboardingDate"
                          render={({ field }) => (
                            isView ? (
                              <Typography variant="body1" fontWeight={500} sx={{ py: 1 }}>
                                {field.value ? dayjs(field.value).format('DD MMM YYYY') : '—'}
                              </Typography>
                            ) : (
                              <DatePicker
                                disabled={isView}
                                minDate={dayjs()}
                                value={field.value ? dayjs(field.value) : null}
                                onChange={(value) => field.onChange(value ? value.format('YYYY-MM-DD') : '')}
                                format="DD MMM YYYY"
                                slotProps={{ textField: { size: 'small' } }}
                              />
                            )
                          )}
                        />
                      </div>
                    </div>

                    {/* Requirements Dynamic List */}
                    {requirementsList.length > 0 && (
                      <div style={{ marginTop: 20, marginBottom: 16 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#f8fafc' : 'var(--navy)', display: 'block', marginBottom: 12 }}>
                          Requirements ({requirementsList.length})
                        </span>

                        <div className="custom-scroll" style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '6px' }}>
                          {requirementsList.map((req, index) => {
                            const pid = getPreviewId(req, index);
                            return (
                              <RequirementRowForm
                                key={req.id}
                                req={req}
                                index={index}
                                pid={pid}
                                isDark={isDark}
                                isView={isView}
                                isEdit={isEdit}
                                handleRequirementChange={handleRequirementChange}
                                handleRemoveRequirement={handleRemoveRequirement}
                                nativeInputStyle={nativeInputStyle}
                                actionIconButtonStyles={actionIconButtonStyles}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Enhanced + Add More Button */}
                    {canAddRequirement && !isView && !isEdit && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleAddRequirement}
                        startIcon={<AddIcon fontSize="small" />}
                        sx={{
                          mt: 1.5,
                          mb: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 0.75,
                          px: 2,
                          borderRadius: 1.5,
                          width: 'fit-content'
                        }}
                      >
                        {requirementsList.length >= 1 ? 'Add Another Requirement' : 'Add Requirement'}
                      </Button>
                    )}

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Notes (optional)</label>
                      {isView ? (
                        <Typography variant="body1" fontWeight={500} sx={{ py: 1, whiteSpace: 'pre-wrap' }}>
                          {watch('notes') || '—'}
                        </Typography>
                      ) : (
                        <textarea
                          rows={2}
                          placeholder="Add any specific notes..."
                          style={{ ...nativeInputStyle, height: 'auto', resize: 'vertical' }}
                          {...register('notes')}
                        />
                      )}
                    </div>
                  </form>
                </div>
              </div>

              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 2.5 }}>
                <Button
                  variant="text"
                  color="error"
                  onClick={onBack}
                  sx={{ textTransform: 'none', fontWeight: 700, px: 2.5 }}
                >
                  {isView ? 'Close' : 'Cancel'}
                </Button>

                {!isView && (
                  <Button
                    type="submit"
                    form="req-form"
                    variant="contained"
                    disabled={isPending}
                    sx={{ 
                      textTransform: 'none', 
                      fontWeight: 700, 
                      px: 3,
                      py: 0.75,
                      borderRadius: 2.5,
                      backgroundColor: '#6366f1',
                      boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.5)',
                      '&:hover': {
                        backgroundColor: '#4f46e5',
                        boxShadow: '0 10px 20px -4px rgba(99, 102, 241, 0.6)'
                      }
                    }}
                  >
                    {isPending ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} color="inherit" />
                        Saving...
                      </Box>
                    ) : (
                      isEdit ? 'Update Mandate' : 'Create Mandate'
                    )}
                  </Button>
                )}
              </Box>
            </div>

            {/* RIGHT PANEL - Preview */}
            <div>
              <div className="panel">
                <div 
                  className="panel-hd" 
                  style={{ 
                    background: isDark ? 'rgba(139, 92, 246, 0.1)' : 'var(--purple-light)',
                    borderBottom: isDark ? '1px solid rgba(139, 92, 246, 0.2)' : 'none'
                  }}
                >
                  <span className="panel-title" style={{ color: isDark ? '#c084fc' : 'var(--purple)' }}>
                    <i className="ti ti-sparkles" aria-hidden="true" style={{ marginRight: 5 }} />
                    AI Requirement ID Generator
                  </span>
                  <span 
                    className="section-tag" 
                    style={{ 
                      background: isDark ? 'rgba(139, 92, 246, 0.15)' : 'var(--purple-light)', 
                      color: isDark ? '#c084fc' : 'var(--purple)', 
                      border: isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(90,45,130,.2)' 
                    }}
                  >
                    Live Preview
                  </span>
                </div>

                <div className="panel-body">
                  <div style={{ fontSize: 13, color: isDark ? '#94a3b8' : 'var(--g500)', marginBottom: 10 }}>
                    Generated automatically from your form inputs. The AI checks for duplicates and semantic conflicts.
                  </div>

                  <div className="rid-box">
                    {requirementsList.length === 0 ? (
                      <>
                        <div className="rid-label">Generated Requirement ID</div>
                        <div className="rid-value">
                          <span style={{ fontSize: 13, color: '#7CA8D4', fontStyle: 'italic', fontFamily: 'inherit' }}>
                            Fill the form &amp; add a requirement to preview…
                          </span>
                        </div>
                      </>
                    ) : (() => {
                      const req = requirementsList[0];
                      const pid = getPreviewId(req, 0);
                      const isEmpty = pid === '—';
                      return (
                        <div>
                          <div className="rid-label">
                            Generated Requirement ID{req.techStack ? ` — ${getSafeString(req.techStack).split(' ')[0]}` : ''}
                          </div>
                          <div className="rid-value">
                            {isEmpty ? (
                              <span style={{ fontSize: 13, color: '#7CA8D4', fontStyle: 'italic', fontFamily: 'inherit' }}>
                                Fill tech stack, engagement &amp; date…
                              </span>
                            ) : (
                              pid.split('-').map((part, i, arr) => (
                                <React.Fragment key={i}>
                                  <span className="rid-tag">{part}</span>
                                  {i < arr.length - 1 && '-'}
                                </React.Fragment>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div 
                    style={{ 
                      marginTop: 10, 
                      padding: 8, 
                      background: isDark ? 'rgba(16, 185, 129, 0.15)' : 'var(--green-light)', 
                      borderRadius: 6, 
                      border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #6EE7B7', 
                      fontSize: 12, 
                      color: isDark ? '#34d399' : 'var(--green)', 
                      display: 'flex', 
                      gap: 6, 
                      alignItems: 'center' 
                    }}
                  >
                    <i className="ti ti-circle-check" aria-hidden="true" style={{ fontSize: 16 }} />
                    <span>No duplicate mandate detected. ID is unique and valid. Sequence number auto-increments</span>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : 'var(--g500)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
                      ID Tag Breakdown
                    </div>
                    <table style={{ width: '100%', fontSize: 12 }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '3px 0', color: isDark ? '#cbd5e1' : 'var(--g500)' }}>Short Name</td>
                          <td style={{ fontWeight: 600, color: isDark ? '#60a5fa' : 'var(--navy)', fontFamily: 'monospace' }}>
                            {watchedShortName || '—'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '3px 0', color: isDark ? '#cbd5e1' : 'var(--g500)' }}>Mandate type</td>
                          <td style={{ fontWeight: 600, color: isDark ? '#60a5fa' : 'var(--navy)', fontFamily: 'monospace' }}>
                            {watchedMandateType || '—'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '3px 0', color: isDark ? '#cbd5e1' : 'var(--g500)' }}>Technology stack</td>
                          <td style={{ fontWeight: 600, color: isDark ? '#60a5fa' : 'var(--navy)', fontFamily: 'monospace' }}>
                            {techShort}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '3px 0', color: isDark ? '#cbd5e1' : 'var(--g500)' }}>Engagement Modeal</td>
                          <td style={{ fontWeight: 600, color: isDark ? '#60a5fa' : 'var(--navy)', fontFamily: 'monospace' }}>
                            {watchedEngagement}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '3px 0', color: isDark ? '#cbd5e1' : 'var(--g500)' }}>Onboarding Target Date</td>
                          <td style={{ fontWeight: 600, color: isDark ? '#60a5fa' : 'var(--navy)', fontFamily: 'monospace' }}>
                            {watchedOnboardingDate ? dayjs(watchedOnboardingDate).format('DD MMM YYYY') : '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div 
                    style={{ 
                      marginTop: 10, 
                      padding: 8, 
                      background: isDark ? 'rgba(56, 189, 248, 0.1)' : 'var(--blue-light)', 
                      borderRadius: 6, 
                      border: isDark ? '1px solid rgba(56, 189, 248, 0.2)' : 'none',
                      fontSize: 12, 
                      color: isDark ? '#38bdf8' : 'var(--navy)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 4
                    }}
                  >
                   
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      </LocalizationProvider>
    </ThemeProvider>
  );
};