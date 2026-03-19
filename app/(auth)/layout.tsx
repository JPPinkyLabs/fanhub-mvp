import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <nav className="p-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-label="FanHub">
            <circle cx="16" cy="16" r="15" fill="#39ff14" fillOpacity="0.1" stroke="#39ff14" strokeWidth="1.5"/>
            <polygon points="16,6 20,13 28,14 22,20 24,28 16,24 8,28 10,20 4,14 12,13" fill="none" stroke="#39ff14" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="16" cy="16" r="3" fill="#39ff14"/>
          </svg>
          <span className="font-black text-lg text-white">Fan<span className="text-brand-500">Hub</span></span>
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
