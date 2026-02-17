// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Auth from './pages/Auth'; 
import Departments from './pages/Departments';
import Courses from './pages/Courses';
import ClassSchedule from './pages/ClassSchedule';
import Users from './pages/Users';
import Enrollments from './pages/Enrollments';
import ExamResults from './pages/ExamResults';
import Messages from './pages/Messages';
import SectionGrades from './pages/SectionGrades';
import Sections from './pages/Sections';
import Navbar from './components/Navbar'; 

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/courses" element={<Courses />} />
          
            {/* 🚨 Düzeltme: Hem tireli hem de konsoldaki uyarıya neden olan yolu ekledik */}
          <Route path="/class-schedule" element={<ClassSchedule />} />
          <Route path="/classschedule" element={<ClassSchedule />} /> 
            {/* ---------------------------------------------------------------------- */}
            
          <Route path="/users" element={<Users />} />
          <Route path="/enrollments" element={<Enrollments />} />
          <Route path="/exam-results" element={<ExamResults />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/section-grades" element={<SectionGrades />} />
          <Route path="/sections" element={<Sections />} />
          
            {/* 🚨 Konsolda hata veren "/logout-success" yolunu da tanımlayın (geçici veya kalıcı) */}
            <Route path="/logout-success" element={<Auth />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;