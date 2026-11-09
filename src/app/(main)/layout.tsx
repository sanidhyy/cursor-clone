import { AuthGate } from '@/features/auth/components/auth-gate';
import { SettingsModal } from '@/features/settings/components/settings-modal';

const MainLayout = ({ children }: LayoutProps<'/'>) => {
  return (
    <AuthGate>
      {children}

      <SettingsModal />
    </AuthGate>
  );
};

export default MainLayout;
