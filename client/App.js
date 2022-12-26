import React from 'react';
import { useLocation } from 'react-router-dom';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import Routes from '@/Routes';

const App = () => {
  const location = useLocation().pathname;
  return (
    <div>
      <Navbar />
      <Routes />
      {location.includes('jest') ? null : <Footer />}
    </div>
  );
};

export default App;
