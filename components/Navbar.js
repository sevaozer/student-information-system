import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  Stack,
  Box,
} from '@mui/material';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user && user.Role ? user.Role.toLowerCase() : null;
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher' || role === 'instructor';
  const isStudent = role === 'student';
  const isAuthorizedToManage = isAdmin || isTeacher;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuButtonStyle = {
    px: 1,
    py: 0.5,
    fontSize: '0.875rem',
    minWidth: 'auto',
    whiteSpace: 'nowrap',
  };

  return (
    <AppBar position="static">
      <Toolbar disableGutters sx={{ px: 2 }}>
        {/* Başlık */}
        <Typography
          variant="h6"
          component={Link}
          to={user ? "/class-schedule" : "/"}
          sx={{ mr: 2, textDecoration: 'none', color: 'inherit' }}
        >
          OBS
        </Typography>

        {user ? (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end" flexWrap="wrap">
              {isAuthorizedToManage && (
                <>
                  <Button color="inherit" component={Link} to="/users" sx={menuButtonStyle}>KULLANICILAR</Button>
                  <Button color="inherit" component={Link} to="/departments" sx={menuButtonStyle}>BÖLÜMLER</Button>
                  <Button color="inherit" component={Link} to="/courses" sx={menuButtonStyle}>DERSLER</Button>
                  <Button color="inherit" component={Link} to="/sections" sx={menuButtonStyle}>ŞUBELER</Button>
                  <Button color="inherit" component={Link} to="/enrollments" sx={menuButtonStyle}>ÖĞRENCİ KAYIT</Button>
                </>
              )}

              <Button color="inherit" component={Link} to="/messages" sx={menuButtonStyle}>MESAJLAR</Button>
              <Button color="inherit" component={Link} to="/class-schedule" sx={menuButtonStyle}>DERS PROGRAMI</Button>
              <Button color="inherit" component={Link} to="/section-grades" sx={menuButtonStyle}>DERS NOTLARI</Button>

              {isStudent && (
                <Button color="inherit" component={Link} to="/enrollments" sx={menuButtonStyle}>KAYITLI DERSLERİM</Button>
              )}

              <Button color="inherit" onClick={handleLogout} sx={menuButtonStyle}>ÇIKIŞ YAP</Button>
            </Stack>
          </>
        ) : (
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button color="inherit" component={Link} to="/" sx={menuButtonStyle}>GİRİŞ</Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;








