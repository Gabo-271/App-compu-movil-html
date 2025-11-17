import React from 'react';
import { VoteAppProvider, useVoteApp } from './components/VoteAppContext';
import { HomePageNew } from './components/HomePageNew';
import { LoginScreen } from './components/LoginScreen';
import { VotingListScreen } from './components/VotingListScreen';
import { VotingDetailScreen } from './components/VotingDetailScreen';
import { UserProfileScreen } from './components/UserProfileScreen';
import { LoadingScreen, EmptyScreen, SuccessScreen, ErrorScreen } from './components/GlobalStates';
import { DebugPanel } from './components/DebugPanel';

function VoteAppContent() {
  const { state } = useVoteApp();

  // Debug logs básicos
  console.log('📱 APP:', state.currentScreen, '| Usuario:', state.user?.email || 'null', '| Cargando:', state.isLoading);

  // Si está cargando, mostrar pantalla de carga
  if (state.isLoading) {
    console.log('📱 APP - Mostrando LoadingScreen porque isLoading=true');
    return <LoadingScreen />;
  }

  switch (state.currentScreen) {
    case 'home':
      console.log('📱 APP - Renderizando HomePageNew');
      return <HomePageNew />;
    case 'login':
      console.log('📱 APP - Renderizando LoginScreen');
      return <LoginScreen />;
    case 'voting-list':
      console.log('📱 APP - Renderizando VotingListScreen');
      return <VotingListScreen />;
    case 'voting-detail':
      console.log('📱 APP - Renderizando VotingDetailScreen');
      return <VotingDetailScreen />;
    case 'profile':
      console.log('📱 APP - Renderizando UserProfileScreen');
      return <UserProfileScreen />;
    case 'loading':
      console.log('📱 APP - Renderizando LoadingScreen (case loading)');
      return <LoadingScreen />;
    case 'empty':
      console.log('📱 APP - Renderizando EmptyScreen');
      return <EmptyScreen />;
    case 'success':
      console.log('📱 APP - Renderizando SuccessScreen');
      return <SuccessScreen />;
    case 'error':
      console.log('📱 APP - Renderizando ErrorScreen');
      return <ErrorScreen type="network" />;
    default:
      console.log('📱 APP - Caso default, renderizando LoginScreen');
      return <LoginScreen />;
  }
}

export default function App() {
  return (
    <VoteAppProvider>
      <div className="size-full">
        <VoteAppContent />
        <DebugPanel />
      </div>
    </VoteAppProvider>
  );
}