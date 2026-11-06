import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Device, isSignedIn } from './ui/kit';
import { Login, Code, Locked, Forgot, Welcome } from './pages/Auth';
import Today from './pages/Today';
import Jobs, { Search, Notifications, Day } from './pages/Jobs';
import { JobPage, JobPack, StartJob, Work, Complete, Done, Summary, History } from './pages/Job';
import Visit from './pages/Visit';
import Calendar from './pages/Calendar';
import Messages, { Thread } from './pages/Messages';
import Profile, { Details, Work as WorkSettings, NotificationsSettings, Connections, Security, Help } from './pages/Profile';

// Jadeite Installer — the fitter's phone app (375 × 812). Same job records as the Office Admin.
const OPEN = ['/login', '/code', '/locked', '/forgot'];
function Guard({ children }: { children: React.ReactElement }) {
  const loc = useLocation();
  if (!isSignedIn() && !OPEN.includes(loc.pathname)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Device>
      <Guard>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/code" element={<Code />} />
          <Route path="/locked" element={<Locked />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/welcome/:step" element={<Welcome />} />
          <Route path="/" element={<Today />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/search" element={<Search />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/job/:id" element={<JobPage />} />
          <Route path="/job/:id/pack" element={<JobPack />} />
          <Route path="/job/:id/start" element={<StartJob />} />
          <Route path="/job/:id/work" element={<Work />} />
          <Route path="/job/:id/complete/:step" element={<Complete />} />
          <Route path="/job/:id/summary" element={<Summary />} />
          <Route path="/done/:id" element={<Done />} />
          <Route path="/visit/:id" element={<Visit />} />
          <Route path="/day/:id" element={<Day />} />
          <Route path="/history/:id" element={<History />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Thread />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/details" element={<Details />} />
          <Route path="/profile/work" element={<WorkSettings />} />
          <Route path="/profile/notifications" element={<NotificationsSettings />} />
          <Route path="/profile/connections" element={<Connections />} />
          <Route path="/profile/security" element={<Security />} />
          <Route path="/profile/help" element={<Help />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Guard>
    </Device>
  );
}
