const AuthLayout = ({ children }: LayoutProps<'/'>) => {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-sidebar p-6 md:p-16'>
      {children}
    </div>
  );
};

export default AuthLayout;
