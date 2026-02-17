import React, { useEffect, useState } from "react";
import { getAll, createItem, updateItem, deleteItem } from "../services/api";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const Sections = () => {
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [newSection, setNewSection] = useState({ SectionCode: "", CourseID: "" });

  // Düzenleme için state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSection, setEditSection] = useState({ SectionID: null, SectionCode: "" });

  const fetchAllData = async () => {
    try {
      const [sectionsData, coursesData] = await Promise.all([
        getAll("Sections"),
        getAll("Courses")
      ]);
      setSections(sectionsData);
      setCourses(coursesData);
    } catch (error) {
      console.error("Veriler getirilirken bir hata oluştu:", error);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const getCourseName = (id) => {
    const course = courses.find((c) => c.CourseID === id);
    return course ? course.CourseName : "Bilinmiyor";
  };

  const handleAdd = async () => {
    if (!newSection.CourseID || !newSection.SectionCode) {
      alert("Lütfen Şube Kodu ve Ders seçin.");
      return;
    }

    const isDuplicate = sections.some(
      (s) => s.CourseID === newSection.CourseID && s.SectionCode === newSection.SectionCode
    );

    if (isDuplicate) {
      const courseName = getCourseName(newSection.CourseID);
      alert(`HATA: ${courseName} dersi için ${newSection.SectionCode} şubesi zaten mevcut.`);
      return;
    }

    await createItem("Sections", newSection);
    setNewSection({ SectionCode: "", CourseID: "" });
    fetchAllData();
  };

  const handleDelete = async (id) => {
    await deleteItem("Sections", id);
    fetchAllData();
  };

  const openEditDialog = (section) => {
    setEditSection(section);
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editSection.SectionCode) {
      alert("Şube kodu boş olamaz.");
      return;
    }
    await updateItem("Sections", editSection.SectionID, {
      SectionCode: editSection.SectionCode
    });
    setEditDialogOpen(false);
    fetchAllData();
  };

  return (
    <Container component={Paper} sx={{ p: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Şubeler
      </Typography>

      {/* Ekleme Alanı */}
      <Stack spacing={2} direction="row" sx={{ mb: 4 }} alignItems="center">
        <TextField
          label="Şube Kodu"
          variant="outlined"
          size="small"
          value={newSection.SectionCode}
          onChange={(e) => setNewSection({ ...newSection, SectionCode: e.target.value })}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Ders Seçin</InputLabel>
          <Select
            value={newSection.CourseID}
            label="Ders Seçin"
            onChange={(e) => setNewSection({ ...newSection, CourseID: e.target.value })}
          >
            {courses.map((course) => (
              <MenuItem key={course.CourseID} value={course.CourseID}>
                {course.CourseName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleAdd}>
          Ekle
        </Button>
      </Stack>

      {/* Tablo */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Şube Kodu</TableCell>
              <TableCell>Ders Adı</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sections.map((s) => (
              <TableRow key={s.SectionID}>
                <TableCell>{s.SectionCode}</TableCell>
                <TableCell>{getCourseName(s.CourseID)}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEditDialog(s)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(s.SectionID)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Düzenleme Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Şubeyi Düzenle</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Şube Kodu"
            fullWidth
            value={editSection.SectionCode}
            onChange={(e) => setEditSection({ ...editSection, SectionCode: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleEditSave}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Sections;
