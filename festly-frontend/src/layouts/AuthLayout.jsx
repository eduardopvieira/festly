import { useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { PartyPopper } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [loading, user, navigate]);

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4">
      <Link to="/" className="flex items-center gap-2 font-bold text-2xl mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <PartyPopper className="h-5 w-5" />
        </div>
        Festly
      </Link>

      <Card className="w-full max-w-md py-0">
        <CardContent className="p-8">
          <Outlet />
        </CardContent>
      </Card>

      <p className="mt-6 text-muted-foreground text-sm">
        © {new Date().getFullYear()} Festly
      </p>
    </div>
  );
}
