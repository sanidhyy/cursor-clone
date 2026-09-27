import { AuthConfig } from 'convex/server';

const authConfig: AuthConfig = {
  providers: [
    {
      domain: process.env.CLERK_FRONTEND_API_URL!,
      applicationID: 'convex',
    },
  ],
};

export default authConfig;
