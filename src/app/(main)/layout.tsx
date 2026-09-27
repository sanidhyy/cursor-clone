import { AuthGate } from '@/features/auth/components/auth-gate';

const MainLayout = ({ children }: LayoutProps<'/'>) => {
  return <AuthGate>{children}</AuthGate>;
};

export default MainLayout;
