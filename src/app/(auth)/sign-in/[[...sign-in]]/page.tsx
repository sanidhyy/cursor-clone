import type { Metadata } from 'next';

import { SignInView } from '@/features/auth/views/sign-in-view';

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to Polaris to continue building, editing, and shipping projects with your AI-powered coding assistant.',
};

const SignInPage = () => {
  return <SignInView />;
};

export default SignInPage;
