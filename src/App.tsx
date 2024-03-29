import React from 'react';
import logo from './logo.svg';
import './App.css';
import Plinko from './components/game/plinko';
import InfinitePlinko from './components/game/infinitePlinko';
import ResponsiveAppBar from './components/game/appBar';
import MultiplayerPlinko from './components/game/multiplayerPlinko';
import HostPlinko from './components/game/hostPlinko';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
function App() {
  return (
    <>
      <BrowserRouter>
        <ResponsiveAppBar />
        <Routes>
          <Route path="/" element={<Plinko />} />
          <Route path="/yolo" element={<Plinko />} />
          <Route path="/infinite" element={<InfinitePlinko />} />
          <Route path="/multiplayer" element={<MultiplayerPlinko />} />
          <Route path="/multiplayer/*" element={<HostPlinko />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
