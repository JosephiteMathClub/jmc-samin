"use client";
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white p-4">
      <h1 className="text-9xl font-bold gold-text mb-4">404</h1>
      <h2 className="text-2xl font-medium mb-8">Page Not Found</h2>
      <p className="text-zinc-400 mb-12 text-center max-w-md">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link 
        href="/"
        className="px-8 py-3 btn-metallic-blue"
      >
        Back to Home
      </Link>
    </div>
  );
}
