import React, { useEffect, useState, useCallback } from "react";
import { getAll, createItem, updateItem, deleteItem } from "../services/api";
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Stack,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DoneIcon from "@mui/icons-material/Done";

// Stil tanımlamaları
const cellStyle = { 
  textAlign: 'center', 
  py: 1, 
  px: 1, 
};

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  
  const userRole = user?.Role?.toLowerCase();
  const currentUserID = user?.UserID;

  const [newMessage, setNewMessage] = useState({
    ReceiverID: '',
    SectionID: 1,
    MessageText: "",
    SentDate: new Date().toISOString().slice(0,19),
    IsRead: false
  });

  // ----------------- Load Messages -----------------
  const fetchMessages = useCallback(async () => {
    if (!currentUserID) return;

    const data = await getAll("Messages"); 
    if (userRole === 'student') {
      const studentMessages = data.filter(
        m => m.SenderID === currentUserID || m.ReceiverID === currentUserID
      );
      setMessages(studentMessages);
    } else {
      setMessages(data);
    }
  }, [userRole, currentUserID]);

  // ----------------- Load Users -----------------
  const fetchUsers = useCallback(async () => {
    if (!currentUserID) return;

    const data = await getAll("Users");
    const filteredUsers = data.filter(u => u.UserID !== currentUserID); 
    setUsers(filteredUsers);

    if (filteredUsers.length > 0 && !newMessage.ReceiverID) {
      setNewMessage(prev => ({ ...prev, ReceiverID: filteredUsers[0].UserID }));
    }
  }, [currentUserID, newMessage.ReceiverID]);

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchUsers();
    }
  }, [user, fetchMessages, fetchUsers]);

  // ----------------- Handlers -----------------
  const handleAdd = async () => {
    if (!currentUserID) return;
    if (!newMessage.ReceiverID) return alert("Lütfen bir alıcı seçin.");
    
    await createItem("Messages", { ...newMessage, SenderID: currentUserID }); 
    setNewMessage(prev => ({ ...prev, MessageText: "" }));
    fetchMessages();
  };

  const handleDelete = async id => {
    await deleteItem("Messages", id);
    fetchMessages();
  };

  const handleUpdate = async id => {
    await updateItem("Messages", id, { IsRead: true });
    fetchMessages();
  };

  // ----------------- Render -----------------
  return (
    <Container component={Paper} sx={{ p: 4, mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Mesajlar
      </Typography>

      <Stack spacing={2} direction="row" sx={{ mb: 4 }} alignItems="center">
        <FormControl variant="outlined" size="small" sx={{ width: '200px' }}>
          <InputLabel>Alıcı Seç</InputLabel>
          <Select
            value={newMessage.ReceiverID}
            onChange={e => setNewMessage({ ...newMessage, ReceiverID: e.target.value })}
            label="Alıcı Seç"
          >
            {users.map(u => (
              <MenuItem key={u.UserID} value={u.UserID}>
                {u.FullName} ({u.Role})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Mesaj Metni"
          variant="outlined"
          size="small"
          fullWidth
          value={newMessage.MessageText}
          onChange={e => setNewMessage({ ...newMessage, MessageText: e.target.value })}
        />
        <Button variant="contained" onClick={handleAdd}>
          Gönder
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...cellStyle, width: '15%' }}>Gönderen</TableCell>
              <TableCell sx={{ ...cellStyle, width: '15%' }}>Alıcı</TableCell>
              <TableCell sx={{ ...cellStyle, width: '45%' }}>Mesaj</TableCell>
              <TableCell sx={{ ...cellStyle, width: '15%' }}>Durum</TableCell>
              <TableCell sx={{ ...cellStyle, width: '10%' }} align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.map(m => (
              <TableRow key={m.MessageID} sx={{ backgroundColor: m.IsRead ? 'transparent' : 'rgba(255, 235, 59, 0.1)' }}>
                <TableCell sx={cellStyle}>{m.SenderName || "Bilinmiyor"}</TableCell>
                <TableCell sx={cellStyle}>{m.ReceiverName || "Bilinmiyor"}</TableCell>
                <TableCell>{m.MessageText}</TableCell>
                <TableCell sx={cellStyle}>{m.IsRead ? "Okundu" : "Okunmadı"}</TableCell>
                <TableCell sx={cellStyle} align="right">
                  <IconButton onClick={() => handleUpdate(m.MessageID)} color="success" size="small">
                    <DoneIcon fontSize="small"/>
                  </IconButton>
                  <IconButton onClick={() => handleDelete(m.MessageID)} color="error" size="small">
                    <DeleteIcon fontSize="small"/>
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Messages;











