import { Suspense } from 'react';
import InterEventRegister from '@/views/InterEventRegister';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'National Inter-School Event Registration - Josephite Math Club',
  description: 'Register for national scale inter-school math championship segments and events.',
};

export default function InterRootRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#020202]">
        <Loader2 className="w-10 h-10 text-[var(--c-6-start)] animate-spin" />
      </div>
    }>
      <InterEventRegister />
    </Suspense>
  );
}
