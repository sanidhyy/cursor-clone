import { SignInButton } from '@clerk/nextjs';
import { ShieldAlertIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';

export const UnauthenticatedView = () => {
  return (
    <div className='flex h-screen items-center justify-center bg-background'>
      <div className='w-full max-w-lg bg-muted'>
        <Item variant='outline'>
          <ItemMedia variant='icon'>
            <ShieldAlertIcon />
          </ItemMedia>

          <ItemContent>
            <ItemTitle>Unauthorized Access</ItemTitle>
            <ItemDescription>You&apos;re not authorized to access this resource.</ItemDescription>
          </ItemContent>

          <ItemActions>
            <SignInButton>
              <Button variant='outline' size='sm'>
                Sign in
              </Button>
            </SignInButton>
          </ItemActions>
        </Item>
      </div>
    </div>
  );
};
