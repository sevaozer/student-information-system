import React, { useEffect, useState, useCallback } from "react";
import { getAll, createItem, updateItem, deleteItem } from "../services/api";
import { useAuth } from "../context/AuthContext";
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
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";

const Users = () => {
    const { user } = useAuth();

    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({
        FullName: "",
        Email: "",
        Role: "student",
        DepartmentID: 1,
        PasswordHash: "",
        Gender: "",
    });
    const [filters, setFilters] = useState({ search: "", gender: "", role: "" });
    const [editUser, setEditUser] = useState(null);

    const userRole = user?.Role?.toLowerCase();
    const isAuthorizedToManage = userRole === "admin" || userRole === "teacher";

    // Kullanıcıları çek
    const fetchUsers = useCallback(async () => {
        try {
            const data = await getAll("Users");
            setUsers(data);
        } catch (error) {
            console.error("Kullanıcılar getirilirken bir hata oluştu:", error);
        }
    }, []);

    useEffect(() => {
        if (isAuthorizedToManage) fetchUsers();
    }, [isAuthorizedToManage, fetchUsers]);

    if (!isAuthorizedToManage) {
        return (
            <Container
                component={Paper}
                sx={{ p: 4, mt: 8, display: "flex", flexDirection: "column", alignItems: "center" }}
            >
                <LockIcon color="error" sx={{ fontSize: 60 }} />
                <Typography variant="h5" color="text.secondary" mt={2}>
                    Bu sayfaya erişim yetkiniz bulunmamaktadır.
                </Typography>
            </Container>
        );
    }

    // ----------------- CRUD -----------------
    const handleAdd = async () => {
        // 🚀 GÜNCELLENMİŞ KISIM: Zorunlu alan kontrolü
        if (!newUser.FullName || !newUser.Email || !newUser.PasswordHash) {
            alert("İsim Soyisim, Email ve Şifre alanları zorunludur!");
            return; 
        }

        try {
            const currentYear = new Date().getFullYear();

            // StudentNo artık frontend'den gönderilmiyor
            await createItem("Users", { 
                FullName: newUser.FullName,
                Email: newUser.Email,
                PasswordHash: newUser.PasswordHash,
                Role: newUser.Role,
                DepartmentID: newUser.DepartmentID,
                Gender: newUser.Gender,
                StartYear: currentYear
            });

            setNewUser({ 
                FullName: "",
                Email: "",
                Role: "student",
                DepartmentID: 1,
                PasswordHash: "",
                Gender: ""
            });

            fetchUsers();
        } catch (error) {
            console.error("Kullanıcı eklenirken bir hata oluştu:", error);
            // Backend'den gelen detaylı hata mesajını göster
            alert(`Kullanıcı eklenirken bir hata oluştu! Detay: ${error.response?.data?.message || 'Bilinmeyen Sunucu Hatası.'}`);
        }
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?");
        if (!confirmDelete) return;
        try {
            await deleteItem("Users", id);
            fetchUsers();
        } catch (error) {
            console.error("Kullanıcı silinirken hata oluştu:", error);
            alert("Kullanıcı silinirken bir hata oluştu!");
        }
    };

    const handleEditSave = async () => {
        try {
            await updateItem("Users", editUser.UserID, editUser);
            setEditUser(null);
            fetchUsers();
        } catch (error) {
            console.error("Kullanıcı güncellenirken hata oluştu:", error);
            alert("Kullanıcı güncellenirken bir hata oluştu!");
        }
    };

    const handleEditChange = (field, value) => {
        setEditUser({ ...editUser, [field]: value });
    };

    // ----------------- Filtreleme -----------------
    const filteredUsers = users.filter((u) => {
        return (
            u.FullName.toLowerCase().includes(filters.search.toLowerCase()) &&
            (filters.gender ? u.Gender === filters.gender : true) &&
            (filters.role ? u.Role === filters.role : true)
        );
    });

    return (
        <Container sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom color="#1565c0">
                Kullanıcılar Yönetimi
            </Typography>

            {/* Yeni Kullanıcı Ekleme */}
            <Paper sx={{ p: 3, mb: 4, backgroundColor: "#f5f5f5", borderRadius: 3 }}>
                <Typography variant="h6" color="#1976d2" mb={2}>
                    Yeni Kullanıcı Ekle
                </Typography>
                <Stack spacing={2} direction={{ xs: "column", sm: "row" }} alignItems="center">
                    <TextField
                        label="İsim Soyisim"
                        size="small"
                        value={newUser.FullName}
                        onChange={(e) => setNewUser({ ...newUser, FullName: e.target.value })}
                    />
                    <TextField
                        label="Email"
                        size="small"
                        value={newUser.Email}
                        onChange={(e) => setNewUser({ ...newUser, Email: e.target.value })}
                    />
                    <TextField
                        label="Şifre"
                        size="small"
                        type="password"
                        value={newUser.PasswordHash}
                        onChange={(e) => setNewUser({ ...newUser, PasswordHash: e.target.value })}
                    />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Cinsiyet</InputLabel>
                        <Select
                            value={newUser.Gender}
                            onChange={(e) => setNewUser({ ...newUser, Gender: e.target.value })}
                        >
                            <MenuItem value="">Seçiniz</MenuItem>
                            <MenuItem value="Erkek">Erkek</MenuItem>
                            <MenuItem value="Kadın">Kadın</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Rol</InputLabel>
                        <Select
                            value={newUser.Role}
                            onChange={(e) => setNewUser({ ...newUser, Role: e.target.value })}
                        >
                            <MenuItem value="student">Öğrenci</MenuItem>
                            <MenuItem value="teacher">Öğretmen</MenuItem>
                            <MenuItem value="admin">Yönetici</MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="contained" color="primary" onClick={handleAdd}>
                        Ekle
                    </Button>
                </Stack>
            </Paper>

            {/* Filtreleme */}
            <Paper sx={{ p: 3, mb: 4, backgroundColor: "#f0f0f0", borderRadius: 3 }}>
                <Typography variant="h6" color="#1976d2" mb={2}>
                    Filtreleme
                </Typography>
                <Stack spacing={2} direction={{ xs: "column", sm: "row" }} alignItems="center">
                    <TextField
                        label="İsim Ara"
                        size="small"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Cinsiyet</InputLabel>
                        <Select
                            value={filters.gender}
                            onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                        >
                            <MenuItem value="">Tümü</MenuItem>
                            <MenuItem value="Erkek">Erkek</MenuItem>
                            <MenuItem value="Kadın">Kadın</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Rol</InputLabel>
                        <Select
                            value={filters.role}
                            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                        >
                            <MenuItem value="">Tümü</MenuItem>
                            <MenuItem value="student">Öğrenci</MenuItem>
                            <MenuItem value="teacher">Öğretmen</MenuItem>
                            <MenuItem value="admin">Yönetici</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            {/* Kullanıcı Tablosu */}
            <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 3 }}>
                <Table>
                    <TableHead sx={{ backgroundColor: "#1976d2" }}>
                        <TableRow>
                            <TableCell sx={{ color: "#fff" }}>ID</TableCell>
                            <TableCell sx={{ color: "#fff" }}>İsim</TableCell>
                            <TableCell sx={{ color: "#fff" }}>Email</TableCell>
                            <TableCell sx={{ color: "#fff" }}>Rol</TableCell>
                            <TableCell sx={{ color: "#fff" }}>Cinsiyet</TableCell>
                            <TableCell sx={{ color: "#fff" }}>Öğrenci No</TableCell>
                            <TableCell sx={{ color: "#fff" }}>Giriş Yılı</TableCell>
                            <TableCell sx={{ color: "#fff" }} align="right">
                                İşlemler
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.map((u) => (
                            <TableRow
                                key={u.UserID}
                                hover
                                sx={{ transition: "0.3s", "&:hover": { backgroundColor: "#e3f2fd" } }}
                            >
                                <TableCell>{u.UserID}</TableCell>
                                <TableCell>{u.FullName}</TableCell>
                                <TableCell>{u.Email}</TableCell>
                                <TableCell>{u.Role}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={u.Gender || "-"}
                                        color={
                                            u.Gender === "Erkek"
                                                ? "primary"
                                                : u.Gender === "Kadın"
                                                ? "secondary"
                                                : "default"
                                        }
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{u.Role === "teacher" ? "-" : u.StudentNo}</TableCell>
                                <TableCell>{u.StartYear}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => setEditUser(u)} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(u.UserID)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Düzenleme Dialog */}
            {editUser && (
                <Dialog open={true} onClose={() => setEditUser(null)} maxWidth="sm" fullWidth>
                    <DialogTitle>Kullanıcı Düzenle</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} mt={1}>
                            <TextField
                                label="İsim Soyisim"
                                fullWidth
                                value={editUser.FullName}
                                onChange={(e) => handleEditChange("FullName", e.target.value)}
                            />
                            <TextField
                                label="Email"
                                fullWidth
                                value={editUser.Email}
                                onChange={(e) => handleEditChange("Email", e.target.value)}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Cinsiyet</InputLabel>
                                <Select
                                    value={editUser.Gender || ""}
                                    onChange={(e) => handleEditChange("Gender", e.target.value)}
                                >
                                    <MenuItem value="">Seçiniz</MenuItem>
                                    <MenuItem value="Erkek">Erkek</MenuItem>
                                    <MenuItem value="Kadın">Kadın</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Rol</InputLabel>
                                <Select
                                    value={editUser.Role}
                                    onChange={(e) => handleEditChange("Role", e.target.value)}
                                >
                                    <MenuItem value="student">Öğrenci</MenuItem>
                                    <MenuItem value="teacher">Öğretmen</MenuItem>
                                    <MenuItem value="admin">Yönetici</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditUser(null)}>İptal</Button>
                        <Button variant="contained" onClick={handleEditSave} color="primary">
                            Kaydet
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Container>
    );
};

export default Users;