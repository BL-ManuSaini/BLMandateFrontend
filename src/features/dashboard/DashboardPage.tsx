import React from 'react';
import { useSessionStore } from '../../store';
import { MISManagerDashboard } from './MISManagerDashboard';
import { AccountManagerDashboard } from './AccountManagerDashboard';
import { COELabHeadDashboard } from './COELabHeadDashboard';
import { HeadOfEngineeringDashboard } from './HeadOfEngineeringDashboard';
import { COECoordinatorDashboard } from './COECoordinatorDashboard';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useSessionStore();
  const role = currentUser?.role;

  switch (role) {
    case 'ACCOUNT_MANAGER':
      return <AccountManagerDashboard />;
    case 'COE_LAB_HEAD':
      return <COELabHeadDashboard />;
    case 'HEAD_OF_ENGINEERING':
      return <HeadOfEngineeringDashboard />;
    case 'COE_COORDINATOR':
      return <COECoordinatorDashboard />;
    case 'MIS_MANAGER':
    default:
      return <MISManagerDashboard />;
  }
};