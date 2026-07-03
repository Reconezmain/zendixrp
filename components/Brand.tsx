import Link from 'next/link';
import Image from 'next/image';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="ZendixRP hjem">
      <span className="brandLogo" aria-hidden="true"><Image src="/images/zendix-logo.png" alt="" width={49} height={40} priority /></span>
      {!compact && <span className="brandName">ZENDIX<span>RP</span></span>}
    </Link>
  );
}
