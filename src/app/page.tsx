'use client';

import dynamic from 'next/dynamic';

const Main = dynamic(() => import('./components/Main'), { ssr: false });

const Index = () => (
  <>
    <Main />
  </>
);

export default Index;
