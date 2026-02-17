import React, { useEffect, useState } from "react";
import { getAll, createItem, updateItem, deleteItem } from "../services/api";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableBody,
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
  DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [newCourse, setNewCourse] = useState({
    CourseName: "",
    CourseCode: "",
    Credits: 0,
    DepartmentID: "",
    InstructorID: "",
    Capacity: 0,
  });
  const [editingCourse, setEditingCourse] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [error, setError] = useState("");

  const fetchAllData = async () => {
    try {
      const [coursesData, usersData, departmentsData] = await Promise.all([
        getAll("Courses"),
        getAll("Users"),
        getAll("Departments"),
      ]);
      setCourses(coursesData);
      setInstructors(
        usersData.filter(
          (user) => user.Role === "teacher" || user.Role === "instructor"
        )
      );
      setDepartments(departmentsData);
    } catch (err) {
      console.error("Veriler getirilirken bir hata oluştu:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAdd = async () => {
    const isDuplicate = courses.some(
      (c) =>
        c.CourseCode.toLowerCase() === newCourse.CourseCode.toLowerCase() ||
        c.CourseName.toLowerCase() === newCourse.CourseName.toLowerCase()
    );
    if (isDuplicate) {
      setError("Aynı ders kodu veya adına sahip bir ders zaten mevcut.");
      return;
    }
    if (!newCourse.InstructorID || !newCourse.DepartmentID) {
      setError("Lütfen bir öğretmen ve bir bölüm seçin.");
      return;
    }

    const payload = {
      CourseName: newCourse.CourseName,
      CourseCode: newCourse.CourseCode,
      Credits: parseInt(newCourse.Credits) || 0,
      DepartmentID: parseInt(newCourse.DepartmentID),
      InstructorID: parseInt(newCourse.InstructorID),
      Capacity: parseInt(newCourse.Capacity) || 0,
    };

    try {
      await createItem("Courses", payload);
      setNewCourse({
        CourseName: "",
        CourseCode: "",
        Credits: 0,
        DepartmentID: "",
        InstructorID: "",
        Capacity: 0,
      });
      setError("");
      fetchAllData();
    } catch (err) {
      console.error("=== EKLEME HATASI ===", err);
      setError("Ders eklenirken bir hata oluştu.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteItem("Courses", id);
      fetchAllData();
    } catch (err) {
      console.error("=== SİLME HATASI ===", err);
      setError("Ders silinirken bir hata oluştu.");
    }
  };

  const handleEditOpen = (course) => {
    setEditingCourse({ ...course, Capacity: course.Capacity || 0 });
    setOpenEditDialog(true);
  };

  const handleEditClose = () => {
    setOpenEditDialog(false);
    setEditingCourse(null);
    setError("");
  };

  const handleEditSave = async () => {
    if (!editingCourse.InstructorID || !editingCourse.DepartmentID) {
      setError("Lütfen bir öğretmen ve bir bölüm seçin.");
      return;
    }

    const payload = {
      CourseName: editingCourse.CourseName,
      CourseCode: editingCourse.CourseCode,
      Credits: parseInt(editingCourse.Credits) || 0,
      DepartmentID: parseInt(editingCourse.DepartmentID),
      InstructorID: parseInt(editingCourse.InstructorID),
      Capacity: parseInt(editingCourse.Capacity) || 0,
    };

    try {
      console.log("=== GÜNCELLEME İSTEĞİ ===");
      console.log("URL:", `http://localhost:4000/Courses/${editingCourse.CourseID}`);
      console.log("Payload:", payload);

      await updateItem("Courses", editingCourse.CourseID, payload);
      handleEditClose();
      fetchAllData();
    } catch (err) {
      console.error("=== GÜNCELLEME HATASI ===", err);
      setError("Ders güncellenirken bir hata oluştu.");
    }
  };

  const getInstructorName = (id) => {
    const instructor = instructors.find((inst) => inst.UserID === id);
    return instructor ? instructor.FullName : "Bilinmiyor";
  };

  const getDepartmentName = (id) => {
    const department = departments.find((dept) => dept.DepartmentID === id);
    return department ? department.DepartmentName : "Bilinmiyor";
  };

  return (
    <Container component={Paper} sx={{ p: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Dersler
      </Typography>

      <Stack spacing={2} direction="row" sx={{ mb: 4 }} alignItems="center">
        <TextField
          label="Ders Adı"
          variant="outlined"
          size="small"
          value={newCourse.CourseName}
          onChange={(e) =>
            setNewCourse({ ...newCourse, CourseName: e.target.value })
          }
        />
        <TextField
          label="Ders Kodu"
          variant="outlined"
          size="small"
          value={newCourse.CourseCode}
          onChange={(e) =>
            setNewCourse({ ...newCourse, CourseCode: e.target.value })
          }
        />
        <TextField
          label="Kredi"
          variant="outlined"
          size="small"
          type="number"
          value={newCourse.Credits}
          onChange={(e) =>
            setNewCourse({ ...newCourse, Credits: parseInt(e.target.value) })
          }
        />
        <TextField
          label="Kapasite"
          variant="outlined"
          size="small"
          type="number"
          value={newCourse.Capacity}
          onChange={(e) =>
            setNewCourse({ ...newCourse, Capacity: parseInt(e.target.value) })
          }
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Bölüm Seçin</InputLabel>
          <Select
            value={newCourse.DepartmentID}
            label="Bölüm Seçin"
            onChange={(e) =>
              setNewCourse({ ...newCourse, DepartmentID: e.target.value })
            }
          >
            {departments.map((dept) => (
              <MenuItem key={dept.DepartmentID} value={dept.DepartmentID}>
                {dept.DepartmentName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Öğretmen Seçin</InputLabel>
          <Select
            value={newCourse.InstructorID}
            label="Öğretmen Seçin"
            onChange={(e) =>
              setNewCourse({ ...newCourse, InstructorID: e.target.value })
            }
          >
            {instructors.map((inst) => (
              <MenuItem key={inst.UserID} value={inst.UserID}>
                {inst.FullName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleAdd}>
          Ekle
        </Button>
      </Stack>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ders Adı</TableCell>
              <TableCell>Ders Kodu</TableCell>
              <TableCell>Kredi</TableCell>
              <TableCell>Kapasite</TableCell>
              <TableCell>Bölüm</TableCell>
              <TableCell>Öğretmen</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((c) => (
              <TableRow key={c.CourseID}>
                <TableCell>{c.CourseName}</TableCell>
                <TableCell>{c.CourseCode}</TableCell>
                <TableCell>{c.Credits}</TableCell>
                <TableCell>{c.Capacity || 0}</TableCell>
                <TableCell>{getDepartmentName(c.DepartmentID)}</TableCell>
                <TableCell>{getInstructorName(c.InstructorID)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => handleEditOpen(c)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(c.CourseID)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Düzenleme Dialog */}
      <Dialog open={openEditDialog} onClose={handleEditClose}>
        <DialogTitle>
          Dersi Düzenle
          <IconButton
            aria-label="close"
            onClick={handleEditClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {editingCourse && (
            <Stack spacing={2} direction="column">
              <TextField
                label="Ders Adı"
                variant="outlined"
                size="small"
                value={editingCourse.CourseName}
                onChange={(e) =>
                  setEditingCourse({
                    ...editingCourse,
                    CourseName: e.target.value,
                  })
                }
              />
              <TextField
                label="Ders Kodu"
                variant="outlined"
                size="small"
                value={editingCourse.CourseCode}
                onChange={(e) =>
                  setEditingCourse({
                    ...editingCourse,
                    CourseCode: e.target.value,
                  })
                }
              />
              <TextField
                label="Kredi"
                variant="outlined"
                size="small"
                type="number"
                value={editingCourse.Credits}
                onChange={(e) =>
                  setEditingCourse({
                    ...editingCourse,
                    Credits: parseInt(e.target.value),
                  })
                }
              />
              <TextField
                label="Kapasite"
                variant="outlined"
                size="small"
                type="number"
                value={editingCourse.Capacity || 0}
                onChange={(e) =>
                  setEditingCourse({
                    ...editingCourse,
                    Capacity: parseInt(e.target.value),
                  })
                }
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Bölüm Seçin</InputLabel>
                <Select
                  value={editingCourse.DepartmentID}
                  label="Bölüm Seçin"
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      DepartmentID: e.target.value,
                    })
                  }
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.DepartmentID} value={dept.DepartmentID}>
                      {dept.DepartmentName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Öğretmen Seçin</InputLabel>
                <Select
                  value={editingCourse.InstructorID}
                  label="Öğretmen Seçin"
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      InstructorID: e.target.value,
                    })
                  }
                >
                  {instructors.map((inst) => (
                    <MenuItem key={inst.UserID} value={inst.UserID}>
                      {inst.FullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>İptal</Button>
          <Button onClick={handleEditSave} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Courses;

