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
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const Enrollments = () => {
  const { user } = useAuth();

  const userRole = user?.Role?.toLowerCase();
  const isStudent = userRole === "student";
  const isAuthorizedToManage = userRole === "admin" || userRole === "teacher";

  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [newEnrollment, setNewEnrollment] = useState({
    StudentID: "",
    SectionID: "",
    EnrollmentDate: new Date().toISOString().slice(0, 10)
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editEnrollment, setEditEnrollment] = useState(null);

  const getCourseNameFromSection = (sectionId) => {
    const section = sections.find((s) => s.SectionID === sectionId);
    const course = courses.find((c) => c.CourseID === section?.CourseID);
    return course
      ? `${course.CourseCode || ""} - ${course.CourseName || "Ders Adı Bilinmiyor"}`
      : "Şube/Ders Bilinmiyor";
  };

  const fetchAllData = useCallback(async () => {
    if (!user) return;

    try {
      const [enrollmentsData, usersData, sectionsData, coursesData] =
        await Promise.all([
          getAll("Enrollments"),
          getAll("Users"),
          getAll("Sections"),
          getAll("Courses")
        ]);

      const studentList = usersData.filter(
        (u) => u.Role?.toLowerCase() === "student"
      );

      setStudents(studentList);
      setSections(sectionsData);
      setCourses(coursesData);

      let enrollmentsToDisplay = enrollmentsData;
      if (isStudent) {
        enrollmentsToDisplay = enrollmentsData.filter(
          (e) => String(e.StudentID) === String(user.UserID)
        );
      }
      setEnrollments(enrollmentsToDisplay);

      if (isAuthorizedToManage && studentList.length > 0 && sectionsData.length > 0) {
        setNewEnrollment((prev) => ({
          ...prev,
          StudentID: studentList[0].UserID,
          SectionID: sectionsData[0].SectionID
        }));
      }
    } catch (error) {
      console.error("Veriler getirilirken hata:", error);
    }
  }, [user, isStudent, isAuthorizedToManage]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAdd = async () => {
    if (!isAuthorizedToManage) return;

    if (!newEnrollment.StudentID || !newEnrollment.SectionID) {
      alert("Lütfen öğrenci ve şube seçin.");
      return;
    }

    const exists = enrollments.some(
      (e) =>
        String(e.StudentID) === String(newEnrollment.StudentID) &&
        String(e.SectionID) === String(newEnrollment.SectionID)
    );
    if (exists) {
      alert("Bu öğrenci zaten seçilen derse kayıtlı!");
      return;
    }

    await createItem("Enrollments", newEnrollment);
    fetchAllData();
  };

  const handleDelete = async (id) => {
    if (!isAuthorizedToManage) return;
    if (window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
      await deleteItem("Enrollments", id);
      fetchAllData();
    }
  };

  const handleOpenEdit = (enrollment) => {
    setEditEnrollment(enrollment);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editEnrollment.SectionID) {
      alert("Şube seçiniz!");
      return;
    }

    const exists = enrollments.some(
      (e) =>
        e.EnrollmentID !== editEnrollment.EnrollmentID &&
        String(e.StudentID) === String(editEnrollment.StudentID) &&
        String(e.SectionID) === String(editEnrollment.SectionID)
    );
    if (exists) {
      alert("Bu öğrenci zaten seçilen derse kayıtlı!");
      return;
    }

    await updateItem("Enrollments", editEnrollment.EnrollmentID, {
      SectionID: editEnrollment.SectionID
    });

    setEditDialogOpen(false);
    setEditEnrollment(null);
    fetchAllData();
  };

  const getStudentName = (id) => {
    const student = students.find((s) => s.UserID === id);
    return student ? student.FullName : "Bilinmiyor";
  };

  const getSectionCode = (id) => {
    const section = sections.find((s) => s.SectionID === id);
    return section ? section.SectionCode : "Bilinmiyor";
  };

  if (!user) return <Typography>Yükleniyor...</Typography>;

  return (
    <Container component={Paper} sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        {isStudent ? "Kayıtlı Derslerim" : "Kayıt Yönetimi (Tüm Ders Kayıtları)"}
      </Typography>

      {isAuthorizedToManage && (
        <Stack
          spacing={2}
          direction={{ xs: "column", sm: "row" }}
          sx={{ mb: 4 }}
          alignItems="center"
        >
          <FormControl size="small" sx={{ minWidth: 150 }} variant="outlined">
            <InputLabel>Öğrenci</InputLabel>
            <Select
              value={newEnrollment.StudentID}
              onChange={(e) =>
                setNewEnrollment({ ...newEnrollment, StudentID: e.target.value })
              }
            >
              {students.map((s) => (
                <MenuItem key={s.UserID} value={s.UserID}>
                  {s.FullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }} variant="outlined">
            <InputLabel>Şube</InputLabel>
            <Select
              value={newEnrollment.SectionID}
              onChange={(e) =>
                setNewEnrollment({ ...newEnrollment, SectionID: e.target.value })
              }
            >
              {sections.map((section) => (
                <MenuItem key={section.SectionID} value={section.SectionID}>
                  {getCourseNameFromSection(section.SectionID)} / {section.SectionCode}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant="contained" onClick={handleAdd}>
            Ekle
          </Button>
        </Stack>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {!isStudent && <TableCell>Kayıt ID</TableCell>}
              {!isStudent && <TableCell>Öğrenci</TableCell>}
              <TableCell>Şube</TableCell>
              <TableCell>Ders</TableCell>
              <TableCell>Kayıt Tarihi</TableCell>
              {isAuthorizedToManage && <TableCell align="right">İşlemler</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {enrollments.map((e) => (
              <TableRow key={e.EnrollmentID}>
                {!isStudent && <TableCell>{e.EnrollmentID}</TableCell>}
                {!isStudent && <TableCell>{getStudentName(e.StudentID)}</TableCell>}
                <TableCell>{getSectionCode(e.SectionID)}</TableCell>
                <TableCell>{getCourseNameFromSection(e.SectionID)}</TableCell>
                <TableCell>
                  {e.EnrollmentDate ? e.EnrollmentDate.split("T")[0] : "N/A"}
                </TableCell>
                {isAuthorizedToManage && (
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenEdit(e)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(e.EnrollmentID)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {isAuthorizedToManage && (
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>Kayıt Düzenle</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }} variant="outlined">
              <InputLabel>Yeni Şube</InputLabel>
              <Select
                value={editEnrollment?.SectionID || ""}
                onChange={(e) =>
                  setEditEnrollment((prev) => ({ ...prev, SectionID: e.target.value }))
                }
              >
                {sections.map((section) => (
                  <MenuItem key={section.SectionID} value={section.SectionID}>
                    {getCourseNameFromSection(section.SectionID)} / {section.SectionCode}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>İptal</Button>
            <Button variant="contained" onClick={handleSaveEdit}>
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default Enrollments;


