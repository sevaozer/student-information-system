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
  Alert,
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

const SectionGrades = () => {
  const [grades, setGrades] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [newGrade, setNewGrade] = useState({
    StudentID: "",
    SectionID: "",
    VizeNotu: 0,
    FinalSinavNotu: 0,
    FinalGrade: 0,
    LetterGrade: "FF",
    Status: "Kaldı",
    GPA: 0
  });
  const [gpa, setGpa] = useState(null);
  const [filterStudent, setFilterStudent] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);

  const { user } = useAuth();
  const userRole = user?.Role?.toLowerCase();
  const isStudent = userRole === 'student';
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';

  const creditMap = { AA: 4.0, BA: 3.5, BB: 3.0, CB: 2.5, CC: 2.0, DC: 1.5, DD: 1.0, FD: 0.5, FF: 0.0 };
  const credits = 3;

  // ------------------- Helper Functions -------------------
  const calculateWeightedGradeAndLetter = useCallback((vize, finalScore) => {
    const vizeScore = parseInt(vize) || 0;
    const finalS = parseInt(finalScore) || 0;
    const weighted = vizeScore * 0.4 + finalS * 0.6;

    let letter = "FF";
    let status = "Kaldı";

    if (weighted >= 90) letter = "AA";
    else if (weighted >= 75) letter = "BA";
    else if (weighted >= 65) letter = "BB";
    else if (weighted >= 55) letter = "CB";
    else if (weighted >= 45) letter = "CC";

    if (["AA", "BA", "BB", "CB", "CC"].includes(letter)) status = "Geçti";

    return {
      FinalGrade: parseFloat(weighted.toFixed(2)),
      LetterGrade: letter,
      Status: status,
      GPA: creditMap[letter] || 0
    };
  }, [creditMap]);

  // ------------------- Fetch Data -------------------
  const fetchAllData = useCallback(async () => {
    if (!user) return;

    try {
      const [gradesData, usersData, coursesData] = await Promise.all([
        getAll("SectionGrades"),
        getAll("Users"),
        getAll("Courses")
      ]);

      const studentUsers = usersData.filter(u => u.Role?.toLowerCase() === 'student');
      setUsers(studentUsers);
      setCourses(coursesData);

      if (isStudent) {
        setGrades(gradesData.filter(g => String(g.StudentID) === String(user.UserID)));
      } else {
        setGrades(gradesData);
      }

      if (isTeacherOrAdmin && studentUsers.length > 0 && !newGrade.StudentID) {
        setNewGrade(prev => ({ ...prev, StudentID: studentUsers[0].UserID }));
      }

      if (isTeacherOrAdmin && coursesData.length > 0 && !newGrade.SectionID) {
        setNewGrade(prev => ({ ...prev, SectionID: coursesData[0].CourseID }));
      }
    } catch (error) {
      console.error("Veriler getirilirken bir hata oluştu:", error);
    }
  }, [user, isStudent, isTeacherOrAdmin, newGrade.StudentID, newGrade.SectionID]);

  useEffect(() => { if (user) fetchAllData(); }, [fetchAllData]);
  useEffect(() => { if (user && isStudent && grades.length > 0) calculateGPA(grades); }, [grades, isStudent]);

  const calculateGPA = (grades) => {
    const totalPoints = grades.reduce((acc, grade) => acc + (creditMap[grade.LetterGrade] || 0) * credits, 0);
    const totalCredits = grades.length * credits;
    setGpa(totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0);
  };

  const getUserName = (id) => {
    const u = users.find(u => String(u.UserID) === String(id));
    return u ? u.FullName : `ID: ${id}`;
  };

  const getCourseName = (id) => {
    const c = courses.find(c => String(c.CourseID) === String(id));
    return c ? c.CourseName : `Ders ID: ${id}`;
  };

  // ------------------- CRUD -------------------
  const handleAdd = async () => {
    if (!isTeacherOrAdmin) return;

    if (!newGrade.StudentID || !newGrade.SectionID) {
      alert("Lütfen öğrenci ve ders seçin");
      return;
    }

    const exists = grades.some(
      g => String(g.StudentID) === String(newGrade.StudentID) && String(g.SectionID) === String(newGrade.SectionID)
    );

    if (exists) {
      alert("Bu öğrenciye bu dersten not verilmiş");
      return;
    }

    const calculated = calculateWeightedGradeAndLetter(newGrade.VizeNotu, newGrade.FinalSinavNotu);

    const gradeData = {
      StudentID: newGrade.StudentID,
      SectionID: newGrade.SectionID,
      Vize: parseInt(newGrade.VizeNotu),
      Final: parseInt(newGrade.FinalSinavNotu),
      FinalGrade: calculated.FinalGrade,
      LetterGrade: calculated.LetterGrade,
      Status: calculated.Status,
      GPA: calculated.GPA,
    };

    try {
      await createItem("SectionGrades", gradeData);
      setNewGrade(prev => ({ ...prev, VizeNotu: 0, FinalSinavNotu: 0, FinalGrade: 0, LetterGrade: "FF", Status: "Kaldı", GPA: 0 }));
      fetchAllData();
    } catch (err) {
      console.error(err);
      alert("Hata oluştu");
    }
  };

  const handleDelete = async (id) => {
    if (!isTeacherOrAdmin) return;

    if (window.confirm("Bu not kaydını silmek istediğinizden emin misiniz?")) {
      await deleteItem("SectionGrades", id);
      fetchAllData();
    }
  };

  const handleUpdateClick = (grade) => {
    setSelectedGrade({ ...grade, StudentName: getUserName(grade.StudentID), CourseName: getCourseName(grade.SectionID) });
    setOpenDialog(true);
  };

  const handleSaveGrade = (vize, finalScore) => {
    const calculated = calculateWeightedGradeAndLetter(vize, finalScore);
    const updateData = {
      Vize: parseInt(vize),
      Final: parseInt(finalScore),
      FinalGrade: calculated.FinalGrade,
      LetterGrade: calculated.LetterGrade,
      Status: calculated.Status,
      GPA: calculated.GPA,
    };
    updateItem("SectionGrades", selectedGrade.GradeID, updateData).then(() => fetchAllData());
  };

  // ------------------- Filters -------------------
  const filteredGrades = grades.filter(g => {
    const student = users.find(u => String(u.UserID) === String(g.StudentID));
    const studentMatch = !filterStudent || (student && (
      student.FullName.toLowerCase().startsWith(filterStudent.toLowerCase()) ||
      student.FullName.split(" ")[1]?.toLowerCase().startsWith(filterStudent.toLowerCase())
    ));
    const courseMatch = !filterCourse || String(g.SectionID) === filterCourse;
    return studentMatch && courseMatch;
  });

  return (
    <Container component={Paper} sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Ders Notları</Typography>

      {user && isTeacherOrAdmin && (
        <Stack spacing={2} direction={{ xs: "column", sm: "row" }} sx={{ mb: 4 }} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Öğrenci Seçin</InputLabel>
            <Select
              value={newGrade.StudentID}
              label="Öğrenci Seçin"
              onChange={e => setNewGrade({ ...newGrade, StudentID: e.target.value })}
            >
              {users.map(u => <MenuItem key={u.UserID} value={u.UserID}>{u.FullName}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Ders Seçin</InputLabel>
            <Select
              value={newGrade.SectionID}
              label="Ders Seçin"
              onChange={e => setNewGrade({ ...newGrade, SectionID: e.target.value })}
            >
              {courses.map(c => <MenuItem key={c.CourseID} value={c.CourseID}>{c.CourseName}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField
            label="Vize Notu (%40)"
            type="number"
            size="small"
            value={newGrade.VizeNotu}
            onChange={e => setNewGrade({ ...newGrade, VizeNotu: e.target.value })}
            inputProps={{ min: 0, max: 100 }}
          />
          <TextField
            label="Final Notu (%60)"
            type="number"
            size="small"
            value={newGrade.FinalSinavNotu}
            onChange={e => setNewGrade({ ...newGrade, FinalSinavNotu: e.target.value })}
            inputProps={{ min: 0, max: 100 }}
          />
          <Button variant="contained" onClick={handleAdd} disabled={!newGrade.StudentID || !newGrade.SectionID}>EKLE</Button>
        </Stack>
      )}

      <Paper elevation={2} sx={{ p: 2, mb: 2, display: "flex", gap: 2, flexWrap: "wrap", backgroundColor: "#f5f5f5" }}>
        <TextField
          label="Öğrenci Filtrele (Baş Harf)"
          size="small"
          value={filterStudent}
          onChange={e => setFilterStudent(e.target.value)}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Ders Filtrele</InputLabel>
          <Select value={filterCourse} label="Ders Filtrele" onChange={e => setFilterCourse(e.target.value)}>
            <MenuItem value="">Tümü</MenuItem>
            {courses.map(c => <MenuItem key={c.CourseID} value={c.CourseID}>{c.CourseName}</MenuItem>)}
          </Select>
        </FormControl>
      </Paper>

      {user && isStudent && gpa !== null && (
        <Alert severity="info" sx={{ mb: 2 }}>Genel Not Ortalamanız (AGNO): <strong>{gpa}</strong></Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Öğrenci Adı</TableCell>
              <TableCell>Ders Adı</TableCell>
              <TableCell>Vize Notu</TableCell>
              <TableCell>Final Notu</TableCell>
              <TableCell>Başarı Notu (Ort.)</TableCell>
              <TableCell>Harf Notu</TableCell>
              <TableCell>Durum</TableCell>
              {isTeacherOrAdmin && <TableCell align="right">İşlemler</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredGrades.map(g => (
              <TableRow key={g.GradeID}>
                <TableCell>{getUserName(g.StudentID)}</TableCell>
                <TableCell>{getCourseName(g.SectionID)}</TableCell>
                <TableCell>{g.Vize || '-'}</TableCell>
                <TableCell>{g.Final || '-'}</TableCell>
                <TableCell><strong>{g.FinalGrade}</strong></TableCell>
                <TableCell>{g.LetterGrade}</TableCell>
                <TableCell>{g.Status}</TableCell>
                {isTeacherOrAdmin && (
                  <TableCell align="right">
                    <IconButton onClick={() => handleUpdateClick(g)} color="primary"><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(g.GradeID)} color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedGrade && (
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Not Güncelleme: {selectedGrade.StudentName} - {selectedGrade.CourseName}</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Vize Notu"
              type="number"
              value={selectedGrade.Vize}
              onChange={e => setSelectedGrade({ ...selectedGrade, Vize: e.target.value })}
              inputProps={{ min: 0, max: 100 }}
            />
            <TextField
              label="Final Notu"
              type="number"
              value={selectedGrade.Final}
              onChange={e => setSelectedGrade({ ...selectedGrade, Final: e.target.value })}
              inputProps={{ min: 0, max: 100 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} color="inherit">İptal</Button>
            <Button onClick={() => handleSaveGrade(selectedGrade.Vize, selectedGrade.Final)} variant="contained">Kaydet</Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default SectionGrades;























