import dynamic from 'next/dynamic';

/**
 * Critical: prevents "TypeError: url.replace is not a function" error
 */
const Reader = dynamic(() => import('./readerRolling'), {
  ssr: false,
});

export default function Page() {
  return <Reader />;
}
