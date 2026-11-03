import type { Metadata } from 'next';

import { SignUpView } from '@/features/auth/views/sign-up-view';

export const metadata: Metadata = {
  title: 'Sign Up',
  description:
    'Create your free Polaris account and start building applications with AI-powered code generation, an intelligent editor, and live previews.',
};

const SignUpPage = () => {
  return <SignUpView />;
};

export default SignUpPage;
