import { Loader2, LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface LogoutConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending: boolean;
  /** Signing in again asks for a one-time PIN (off for everyone, or for this user, it's password only). */
  pinOnSignIn: boolean;
}

export function LogoutConfirmationDialog({ open, onOpenChange, onConfirm, pending, pinOnSignIn }: LogoutConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded">
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out of Indlela?</AlertDialogTitle>
          <AlertDialogDescription>
            {pinOnSignIn ? "You'll need your password and a one-time PIN to sign in again." : "You'll need your password to sign in again."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button onClick={onConfirm} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <LogOut />}
            Sign out
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
