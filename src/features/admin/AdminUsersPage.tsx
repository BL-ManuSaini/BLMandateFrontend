import React from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TablePagination,
  TableHead, TableRow, Chip, Avatar, useTheme, CircularProgress,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, InputLabel, FormControl, OutlinedInput,
  Checkbox, ListItemText, IconButton, InputAdornment, Grid
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Search, Refresh } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useUsers, useCOEs, useRoles, useCreateUser, useUpdateUser, useDeleteUser } from '../../api/hooks';
import { PageHeader, SectionCard, RoleBadge, StatusChip, DataBox } from '../../components/shared';
import { ROWS_PER_PAGE } from '../../theme/constants';
import { dashboardCardStyle, tableHeaderRowStyles, tableRowStyles, actionIconButtonStyles, tableBodyCellPrimaryStyles, tableBodyCellSecondaryStyles } from '../../style/tableStyles';
import type { User, UserRole } from '../../types';
import { ROLE_LABELS } from '../../auth/permissions';
import { toTitleCase } from '../../utils';

export const AdminUsersPage: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const { data: users = [], isLoading, refetch, isFetching } = useUsers();
  const { data: coes = [] } = useCOEs();
  let { data: roles = [] } = useRoles();
   const excludedRoles = ["Account Manager", "MIS Manager"];

roles = roles.filter((role) => !excludedRoles.includes(role?.label));
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [page, setPage] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [editUserId, setEditUserId] = React.useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = React.useState<string | null>(null);
  const [isViewOnly, setIsViewOnly] = React.useState(false);

  // Form states
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [roleId, setRoleId] = React.useState('');
  const [coeScopeIds, setCoeScopeIds] = React.useState<string[]>([]);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const roleOptions = React.useMemo(() => {
    const systemRoles: UserRole[] = [
      'ACCOUNT_MANAGER',
      'COE_COORDINATOR',
      'COE_LAB_HEAD',
      'HEAD_OF_ENGINEERING',
      'MIS_MANAGER',
    ];

    const result: { val: string; label: string }[] = [];
    const seenLabels = new Set<string>();

    systemRoles.forEach((roleKey) => {
      const label = ROLE_LABELS[roleKey] || roleKey;
      result.push({ val: roleKey, label });
      seenLabels.add(label.toLowerCase());
      seenLabels.add(roleKey.toLowerCase());
    });

    roles.forEach((r) => {
      const enumMatch = (Object.keys(ROLE_LABELS) as UserRole[]).find(
        (key) => key === r.id || key === r.name || ROLE_LABELS[key]?.toLowerCase() === r.name?.toLowerCase()
      );
      if (enumMatch) {
        return;
      }
      if (r.id && r.name && !seenLabels.has(r.name.toLowerCase())) {
        result.push({ val: r.id, label: r.name });
        seenLabels.add(r.name.toLowerCase());
      }
    });

    return result;
  }, [roles]);

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const roleName = (ROLE_LABELS[u.role as UserRole] || roles.find((r) => r.id === u.role)?.name || u.role || '').toLowerCase();
      const name = u.name.toLowerCase();
      const email = u.email.toLowerCase();
      const q = search.toLowerCase().trim();

      const matchesSearch = name.includes(q) || email.includes(q) || roleName.includes(q);
      const matchesRole =
        !statusFilter ||
        u.role === statusFilter ||
        u.role?.toLowerCase() === statusFilter.toLowerCase() ||
        roles.find((r) => r.id === statusFilter)?.name === u.role;

      return matchesSearch && matchesRole;
    });
  }, [users, roles, search, statusFilter]);

  React.useEffect(() => {
    setPage(0);
  }, [search, statusFilter]);

  const paginatedUsers = React.useMemo(() => 
    filteredUsers.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE), 
    [filteredUsers, page]
  );

  const getCoeName = (coeId: string) =>
    coes.find((c) => c.id === coeId)?.name || coeId;

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditUserId(null);
    setIsViewOnly(false);
    setName('');
    setEmail('');
    setPassword('');
    setRoleId('');
    setCoeScopeIds([]);
  };

  const handleViewClick = (user: User) => {
    setIsViewOnly(true);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    const matchingRole = roles.find((r) => r.name === user.role);
    setRoleId(matchingRole ? matchingRole.id : '');
    setCoeScopeIds(user.coeScopeIds || []);
    setOpen(true);
  };

  const handleEditClick = (user: User) => {
    setEditUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // blank means do not update password
    const matchingRole = roles.find((r) => r.name === user.role);
    setRoleId(matchingRole ? matchingRole.id : '');
    setCoeScopeIds(user.coeScopeIds || []);
    setOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingUserId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUserId) return;
    try {
      await deleteUserMutation.mutateAsync(deletingUserId);
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
      setDeletingUserId(null);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to delete user', { variant: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || (!editUserId && !password.trim()) || !roleId) {
      enqueueSnackbar('Please fill all required fields', { variant: 'warning' });
      return;
    }

    try {
      if (editUserId) {
        const payload: any = {
          name,
          email,
          roleId,
          coeScopeIds,
        };
        if (password.trim()) {
          payload.password = password;
        }
        await updateUserMutation.mutateAsync({
          id: editUserId,
          ...payload,
        });
        enqueueSnackbar('User updated successfully', { variant: 'success' });
      } else {
        await createUserMutation.mutateAsync({
          name,
          email,
          password,
          roleId,
          coeScopeIds,
        });
        enqueueSnackbar('User created successfully', { variant: 'success' });
      }
      handleClose();
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to save user details', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      <PageHeader
        title="User Management"
        subtitle="All provisioned system users"
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpen}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Create New User
          </Button>
        }
      />

      <SectionCard
        title={`${filteredUsers.length} Provisioned Users`}
        isTableCard
        action={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search users..."
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
              label="Role"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150, bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            >
              <MenuItem value="">All Roles</MenuItem>
              {roleOptions.map((r) => (
                <MenuItem key={r.val} value={r.val}>
                  {r.label}
                </MenuItem>
              ))}
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
  <Table sx={{ minWidth: 850, width: '100%' }}>
    <TableHead>
      <TableRow sx={tableHeaderRowStyles(isDark)}>
        {[
          { label: 'User Name', width: '28%' },
          { label: 'Role', width: '150px' },
          { label: 'COE Scope', width: '25%' },
          { label: 'Status', width: '110px' },
          { label: 'Actions', width: '140px', align: 'center' },
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
          <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </TableCell>
        </TableRow>
      ) : (
        paginatedUsers.map((user) => (
          <TableRow key={user.id} hover sx={tableRowStyles(isDark)}>
            
            {/* 1. User Name */}
            <TableCell align="left" sx={{ ...tableBodyCellPrimaryStyles(isDark), py: 1.25, px: 2, verticalAlign: 'middle' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar 
                  src={user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/')) ? user.avatar : undefined} 
                  sx={{ width: 34, height: 34, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'primary.main' }}
                >
                  {user.avatar && user.avatar.length <= 3 
                    ? user.avatar 
                    : user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </Avatar>
                <Box>
                  <DataBox text={toTitleCase(user.name)} />
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', display: 'block', color: 'text.secondary' }}>
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            </TableCell>

            {/* 2. Role */}
            <TableCell align="left" sx={{ ...tableBodyCellSecondaryStyles(isDark), py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              <RoleBadge role={user.role} />
            </TableCell>

            {/* 3. COE Scope */}
            <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle' }}>
              {user.coeScopeIds.length === 0 ? (
                <Chip label="All COEs" size="small" color="primary" sx={{ fontWeight: 700, height: 22, fontSize: '0.75rem', borderRadius: 1 }} />
              ) : (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                  {user.coeScopeIds.map((coeId) => (
                    <Chip 
                      key={coeId} 
                      label={toTitleCase(getCoeName(coeId))} 
                      size="small" 
                      variant="outlined" 
                      sx={{ 
                        fontSize: '0.7rem',
                        height: 22,
                        borderRadius: 1,
                        backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                        color: isDark ? '#94a3b8' : '#64748b',
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        whiteSpace: 'nowrap'
                      }} 
                    />
                  ))}
                </Box>
              )}
            </TableCell>

            {/* 4. Status */}
            <TableCell align="left" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              <StatusChip status={user.status} type="user" />
            </TableCell>

            {/* 5. Actions (Centered Alignment) */}
            <TableCell align="center" sx={{ py: 1.25, px: 2, verticalAlign: 'middle', width: '140px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.75 }}>
                <IconButton size="small" onClick={() => handleViewClick(user)} sx={actionIconButtonStyles(isDark)} title="View">
                  <Visibility fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleEditClick(user)} sx={actionIconButtonStyles(isDark)} title="Edit">
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleDeleteClick(user.id)} sx={actionIconButtonStyles(isDark, 'error')} title="Delete">
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </TableCell>

          </TableRow>
        ))
      )}

      {users.length === 0 && !isLoading && (
        <TableRow>
          <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
            <Typography variant="body2" color="text.secondary">No users found</Typography>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>

  <TablePagination
    component="div"
    count={users.length}
    page={page}
    onPageChange={handleChangePage}
    rowsPerPage={ROWS_PER_PAGE}
    rowsPerPageOptions={[]}
  />
</Box>
      </SectionCard>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!deletingUserId} onClose={() => setDeletingUserId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete User</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Are you sure you want to delete this user? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeletingUserId(null)} color="error">Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained" 
            sx={{ fontWeight: 700 }}
            disabled={deleteUserMutation.isPending}
          >
            {deleteUserMutation.isPending ? (
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

      <Dialog 
        open={open} 
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
          }
        }} 
        disableEscapeKeyDown
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isViewOnly ? 'User Account Details' : (editUserId ? 'Edit User Details' : 'Provision New User')}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2} pt={1}>
              <Grid item xs={12}>
                <TextField
                  label="Full Name"
                  value={isViewOnly ? toTitleCase(name) : name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fullWidth
                  variant="outlined"
                  size="small"
                  inputProps={{ autoComplete: 'new-name' }}
                  disabled={isViewOnly}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  variant="outlined"
                  size="small"
                  inputProps={{ autoComplete: 'new-email' }}
                  disabled={isViewOnly}
                />
              </Grid>
              {!isViewOnly && (
                <Grid item xs={12}>
                  <TextField
                    label={editUserId ? "Password (leave blank to keep current)" : "Password"}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editUserId}
                    fullWidth
                    variant="outlined"
                    size="small"
                    inputProps={{ autoComplete: 'new-password' }}
                  />
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required size="small" disabled={isViewOnly}>
                  <InputLabel id="role-select-label">Assign Role</InputLabel>
                  <Select
                    labelId="role-select-label"
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    input={<OutlinedInput label="Assign Role" />}
                  >
                    {roles.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {toTitleCase(r.label)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" disabled={isViewOnly}>
                  <InputLabel id="coe-select-label">COE Access Scope</InputLabel>
                  <Select
                    labelId="coe-select-label"
                    multiple
                    value={coeScopeIds}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCoeScopeIds(typeof value === 'string' ? value.split(',') : value);
                    }}
                    input={<OutlinedInput label="COE Access Scope" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((id) => (
                          <Chip key={id} label={toTitleCase(getCoeName(id))} size="small" sx={{ height: 22, fontSize: '0.75rem' }} />
                        ))}
                      </Box>
                    )}
                  >
                    {coes.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        <Checkbox checked={coeScopeIds.indexOf(c.id) > -1} size="small" />
                        <ListItemText primary={toTitleCase(c.name)} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} color="error">
              {isViewOnly ? 'Close' : 'Cancel'}
            </Button>
             {!isViewOnly && (
              <Button
                type="submit"
                variant="contained"
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
                sx={{ fontWeight: 700 }}
              >
                {(createUserMutation.isPending || updateUserMutation.isPending) ? (
                  <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                ) : null}
                {(createUserMutation.isPending || updateUserMutation.isPending)
                  ? 'Saving...'
                  : (editUserId ? 'Save Changes' : 'Create User')}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingUserId} onClose={() => setDeletingUserId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete this user? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeletingUserId(null)} color="error" disabled={deleteUserMutation.isPending} sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm} disabled={deleteUserMutation.isPending} sx={{ textTransform: "none", fontWeight: 700 }}>
            {deleteUserMutation.isPending ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
            {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
