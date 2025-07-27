// src/components/SplashScreen.tsx
import React from 'react';

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 bg-[#0d0d0d] flex flex-col justify-center items-center z-50">
        
        <img src='/logo.png' alt="WealthSnap Logo" className="w-40 h-40 animate-pulse"/>
      <div className="animate-pulse text-white text-4xl font-bold tracking-widest mb-4">
        Financial Forecast
      </div>
      <p className="text-white/50 text-sm">Visualize. Simulate. Succeed.</p>
    </div>
  );
};

export default SplashScreen;