// Reusable Back Button Component
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../lib/utils';

interface BackButtonProps {
  to?: string; // Optional specific route
  label?: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
}

export function BackButton({ 
  to, 
  label = 'Back', 
  className,
  variant = 'ghost'
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleBack}
      className={cn('gap-2', className)}
    >
      <ArrowLeft className="size-4" />
      {label}
    </Button>
  );
}
