'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/submit', label: 'Submit a Link' },
    { href: '/unsubscribe', label: 'Unsubscribe' },
  ];

  return (
    <footer className="flex-shrink-0 py-6 px-4 border-t border-gray-200/30 bg-white/30 backdrop-blur-lg relative z-10">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 text-sm">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`transition ${
              pathname === link.href
                ? 'text-gray-900 font-bold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
