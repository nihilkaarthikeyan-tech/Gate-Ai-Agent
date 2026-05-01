import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Planner from './pages/Planner';
import Tutor from './pages/Tutor';
import MockTests from './pages/MockTests';
import PYQVault from './pages/PYQVault';
import WeakAreas from './pages/WeakAreas';
import Flashcards from './pages/Flashcards';
import PhotoSolver from './pages/PhotoSolver';
import Shortcuts from './pages/Shortcuts';
import Notes from './pages/Notes';
import Motivation from './pages/Motivation';
import InterviewPrep from './pages/InterviewPrep';
import Counselling from './pages/Counselling';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="planner" element={<Planner />} />
        <Route path="tutor" element={<Tutor />} />
        <Route path="mock-tests" element={<MockTests />} />
        <Route path="pyqs" element={<PYQVault />} />
        <Route path="weak-areas" element={<WeakAreas />} />
        <Route path="flashcards" element={<Flashcards />} />
        <Route path="photo-solver" element={<PhotoSolver />} />
        <Route path="shortcuts" element={<Shortcuts />} />
        <Route path="notes" element={<Notes />} />
        <Route path="motivation" element={<Motivation />} />
        <Route path="interview-prep" element={<InterviewPrep />} />
        <Route path="counselling" element={<Counselling />} />
      </Route>
    </Routes>
  );
};

export default App;
