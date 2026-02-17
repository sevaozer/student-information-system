import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAll } from '../services/api';
import {
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
  Alert
} from "@mui/material";

const Auth = () => {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    
    try {
      const users = await getAll('Users');
      const foundUser = users.find(u => u.FullName.toLowerCase() === fullName.toLowerCase());

      if (!foundUser) {
        setError('Kullanıcı bulunamadı.');
        return;
      }
      
      // Şifre kontrolü: Veritabanında PasswordHash varsa buradaki kontrol semboliktir.
      // Gerçek bir uygulamada bu kontrol backend'de yapılır.
      if (password === '12345') { 
        login(foundUser.Role, foundUser.UserID);
        
        if (foundUser.Role === 'student') {
          navigate('/classschedule');
        } else if (foundUser.Role === 'teacher' || foundUser.Role === 'instructor' || foundUser.Role === 'admin') {
          navigate('/departments');
        }
        
      } else {
        setError('Hatalı şifre.');
      }
      
    } catch (err) {
      console.error("Giriş sırasında bir hata oluştu:", err);
      setError("Giriş işlemi sırasında bir sorun oluştu.");
    }
  };

  return (
    <Container component={Paper} sx={{ p: 4, mt: 8, maxWidth: 400 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Giriş
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack spacing={2} direction="column" alignItems="center">
        <TextField
          label="İsim Soyisim"
          variant="outlined"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          fullWidth
        />
        <TextField
          label="Şifre"
          type="password"
          variant="outlined"
          value={password}
          onChange={e => setPassword(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          onClick={handleLogin}
          fullWidth
        >
          Giriş Yap
        </Button>
      </Stack>
    </Container>
  );
};

export default Auth;

