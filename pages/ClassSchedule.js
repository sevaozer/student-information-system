// src/pages/ClassSchedule.jsx  (veya kullandığın dosya adı)
import React, { useEffect, useState, useCallback } from "react";
import { getAll, updateItem, deleteItem, createItem } from "../services/api";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const ClassSchedule = () => {
  const { user } = useAuth();

  const userRole = user?.Role?.toLowerCase();
  const isStudent = userRole === "student";
  const isAuthorizedToManage = userRole === "teacher" || userRole === "admin";

  const [schedules, setSchedules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    SectionID: "",
    DayOfWeek: "Pazartesi",
    StartTime: "09:00",
    EndTime: "10:50",
    Classroom: "A101",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const daysOfWeek = [
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma",
    "Cumartesi",
    "Pazar",
  ];

  const formatTime = (time) => {
    if (!time) return "";
    if (time.includes("T")) return time.split("T")[1].substring(0, 5);
    if (time.length >= 5) return time.substring(0, 5);
    return time;
  };

  // getCourseName: sectionId (from DB) => CourseCode - CourseName
  const getCourseName = (scheduleSectionId) => {
    if (!scheduleSectionId) return "Bilinmiyor";

    const trimmedScheduleId = String(scheduleSectionId).trim();
    const section = sections.find(
      (s) => String(s.SectionID).trim() === trimmedScheduleId
    );

    if (!section) return `Şube ID: ${scheduleSectionId}`;

    const course = courses.find(
      (c) => String(c.CourseID).trim() === String(section.CourseID).trim()
    );

    if (course) return `${course.CourseCode || ""} ${course.CourseName || ""}`.trim();

    return `Ders ID: ${section.CourseID}`;
  };

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    try {
      const [schedulesDataRaw, coursesDataRaw, enrollmentsDataRaw, sectionsDataRaw] =
        await Promise.all([
          getAll("ClassSchedule"),
          getAll("Courses"),
          getAll("Enrollments"),
          getAll("Sections"),
        ]);

      const schedulesData = Array.isArray(schedulesDataRaw) ? schedulesDataRaw : [];
      const coursesData = Array.isArray(coursesDataRaw) ? coursesDataRaw : [];
      const enrollmentsData = Array.isArray(enrollmentsDataRaw) ? enrollmentsDataRaw : [];
      const sectionsData = Array.isArray(sectionsDataRaw) ? sectionsDataRaw : [];

      setCourses(coursesData);
      setSections(sectionsData);
      setEnrollments(enrollmentsData);

      if (isStudent) {
        const studentSections = enrollmentsData
          .filter((e) => String(e.StudentID).trim() === String(user.UserID).trim())
          .map((e) => String(e.SectionID).trim());

        const filteredSchedules = schedulesData.filter((s) =>
          studentSections.includes(String(s.SectionID).trim())
        );
        setSchedules(filteredSchedules);
      } else {
        setSchedules(schedulesData);

        // Eğer yönetici/öğretmense ve SectionID otomatik seçilmemişse
        if ((userRole === "teacher" || userRole === "admin") && coursesData.length > 0 && !newSchedule.SectionID) {
          // varsa ilk course'un ilk şubesini seç
          const firstCourse = coursesData[0];
          const firstSection = sectionsData.find(s => String(s.CourseID) === String(firstCourse.CourseID));
          setNewSchedule(prev => ({ ...prev, SectionID: firstSection ? firstSection.SectionID : `course-${firstCourse.CourseID}` }));
        }
      }
    } catch (err) {
      console.error("Veriler getirilirken hata:", err);
    }
  }, [user, isStudent, userRole, newSchedule.SectionID]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // === Yeni program ekle (eğer seçilen değer course-... ise önce Section oluştur) ===
  const handleAdd = async () => {
    if (!isAuthorizedToManage) return;
    if (!newSchedule.SectionID) return alert("Lütfen bir ders/şube seçin.");

    try {
      // Prepare schedule payload (times with seconds)
      const schedulePayload = {
        DayOfWeek: newSchedule.DayOfWeek,
        StartTime: `${newSchedule.StartTime}:00`,
        EndTime: `${newSchedule.EndTime}:00`,
        Classroom: newSchedule.Classroom,
      };

      let sectionIdToUse = null;

      // Eğer kullanıcı "course-{id}" seçtiyse -> önce Section oluştur
      if (typeof newSchedule.SectionID === "string" && newSchedule.SectionID.startsWith("course-")) {
        const courseId = parseInt(newSchedule.SectionID.replace("course-", ""), 10);
        if (!courseId) throw new Error("Geçersiz course id");

        // 1) Sections öncesi liste al (karşılaştırmak için)
        const sectionsBefore = await getAll("Sections");

        // 2) Yeni Section oluştur (basit default name)
        const sectionPayload = {
          CourseID: courseId,
          SectionName: "Genel", // istersen farklı isim verilebilir
        };

        const createdSectionResp = await createItem("Sections", sectionPayload);

        // 3) createItem'in dönüşünden ID alınmaya çalışılır
        sectionIdToUse =
          createdSectionResp?.SectionID ??
          createdSectionResp?.id ??
          createdSectionResp?.insertId ??
          null;

        // 4) Eğer createItem ID dönmediyse, sections sonrası alıp farkı bul
        if (!sectionIdToUse) {
          const sectionsAfter = await getAll("Sections");
          // yeni ekleneni sectionsBefore ile karşılaştır
          const diff = (sectionsAfter || []).find(
            (sa) =>
              String(sa.CourseID) === String(courseId) &&
              !(sectionsBefore || []).some(
                (sb) => String(sb.SectionID) === String(sa.SectionID)
              )
          );
          sectionIdToUse = diff?.SectionID ?? null;

          // alternatif: aynı courseId olan en büyük SectionID al
          if (!sectionIdToUse) {
            const sameCourseSecs = (sectionsAfter || []).filter(
              (s) => String(s.CourseID) === String(courseId)
            );
            if (sameCourseSecs.length > 0) {
              const maxSec = sameCourseSecs.reduce((a, b) =>
                parseInt(a.SectionID, 10) > parseInt(b.SectionID, 10) ? a : b
              );
              sectionIdToUse = maxSec.SectionID;
            }
          }
        }

        if (!sectionIdToUse) throw new Error("Şube oluşturulamadı.");
      } else {
        // seçilen zaten bir SectionID (numeric) ise direkt kullan
        sectionIdToUse = newSchedule.SectionID;
      }

      // 5) ClassSchedule ekle
      const finalPayload = {
        ...schedulePayload,
        SectionID: sectionIdToUse,
      };

      await createItem("ClassSchedule", finalPayload);

      // 6) Yeniden verileri çek
      await fetchAllData();

      // reset form
      setNewSchedule({
        SectionID: "",
        DayOfWeek: "Pazartesi",
        StartTime: "09:00",
        EndTime: "10:50",
        Classroom: "A101",
      });
    } catch (err) {
      console.error("Program eklenirken hata:", err);
      alert("Program eklenirken hata oluştu. Konsolu kontrol et.");
    }
  };

  const handleDelete = async (id) => {
    if (!isAuthorizedToManage) return;
    if (!window.confirm("Bu program kaydını silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteItem("ClassSchedule", id);
      await fetchAllData();
    } catch (err) {
      console.error("Program silinirken hata:", err);
      alert("Silme sırasında hata oluştu.");
    }
  };

  const handleEdit = (schedule) => {
    if (!isAuthorizedToManage) return;
    setEditingSchedule({
      ...schedule,
      StartTime: formatTime(schedule.StartTime),
      EndTime: formatTime(schedule.EndTime),
    });
    setIsModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!isAuthorizedToManage) return;
    if (!editingSchedule.DayOfWeek || !editingSchedule.StartTime || !editingSchedule.EndTime) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }
    try {
      await updateItem("ClassSchedule", editingSchedule.ScheduleID, {
        SectionID: editingSchedule.SectionID,
        DayOfWeek: editingSchedule.DayOfWeek,
        StartTime: `${editingSchedule.StartTime}:00`,
        EndTime: `${editingSchedule.EndTime}:00`,
        Classroom: editingSchedule.Classroom,
      });
      setIsModalOpen(false);
      setEditingSchedule(null);
      await fetchAllData();
    } catch (err) {
      console.error("Güncelleme hatası:", err);
      alert("Güncelleme başarısız.");
    }
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setEditingSchedule(prev => ({ ...prev, [name]: value }));
  };

  if (!user) return <Typography>Yükleniyor...</Typography>;

  return (
    <Container sx={{ p: 4 }} component={Paper}>
      <Typography variant="h4" gutterBottom>
        Ders Programı
      </Typography>

      {isAuthorizedToManage && (
        <Paper sx={{ p: 2, mb: 4 }}>
          <Stack spacing={2} direction={{ xs: "column", sm: "row" }} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 300 }}>
              <InputLabel>Ders / Şube Seçin</InputLabel>
              <Select
                value={newSchedule.SectionID}
                label="Ders / Şube Seçin"
                onChange={(e) => setNewSchedule({ ...newSchedule, SectionID: e.target.value })}
              >
                {/* Önce sections olanları göster (course + section) */}
                {courses.map((c) => {
                  const courseSections = sections.filter(s => String(s.CourseID) === String(c.CourseID));
                  if (courseSections.length > 0) {
                    return courseSections.map(sec => (
                      <MenuItem key={`sec-${sec.SectionID}`} value={sec.SectionID}>
                        {`${c.CourseCode || ""} - ${c.CourseName || ""} ${sec.SectionName ? `/ Şube ${sec.SectionName}` : `/ Şube ${sec.SectionID}`}`}
                      </MenuItem>
                    ));
                  } else {
                    // Eğer o kursun hiç şubesi yoksa, kursu "course-<id>" formatında seçenek olarak ekle
                    return (
                      <MenuItem key={`course-${c.CourseID}`} value={`course-${c.CourseID}`}>
                        {`${c.CourseCode || ""} - ${c.CourseName || ""} (Şube yok — oluştur)`}
                      </MenuItem>
                    );
                  }
                })}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Gün</InputLabel>
              <Select value={newSchedule.DayOfWeek} label="Gün" onChange={e => setNewSchedule({ ...newSchedule, DayOfWeek: e.target.value })}>
                {daysOfWeek.map(day => <MenuItem key={day} value={day}>{day}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField label="Başlangıç Saati" type="time" value={newSchedule.StartTime} onChange={e => setNewSchedule({ ...newSchedule, StartTime: e.target.value })} size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Bitiş Saati" type="time" value={newSchedule.EndTime} onChange={e => setNewSchedule({ ...newSchedule, EndTime: e.target.value })} size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Sınıf" value={newSchedule.Classroom} onChange={e => setNewSchedule({ ...newSchedule, Classroom: e.target.value })} size="small" />
            <Button variant="contained" onClick={handleAdd}>Ekle</Button>
          </Stack>
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ders</TableCell>
              <TableCell>Gün</TableCell>
              <TableCell>Başlangıç</TableCell>
              <TableCell>Bitiş</TableCell>
              <TableCell>Sınıf</TableCell>
              {isAuthorizedToManage && <TableCell align="right">İşlemler</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {schedules.map(s => (
              <TableRow key={s.ScheduleID}>
                <TableCell>{getCourseName(s.SectionID)}</TableCell>
                <TableCell>{s.DayOfWeek}</TableCell>
                <TableCell>{formatTime(s.StartTime)}</TableCell>
                <TableCell>{formatTime(s.EndTime)}</TableCell>
                <TableCell>{s.Classroom}</TableCell>
                {isAuthorizedToManage && (
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(s)} color="primary"><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(s.ScheduleID)} color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {isAuthorizedToManage && editingSchedule && (
        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <DialogTitle>Ders Programını Düzenle</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField label="Ders Adı" value={getCourseName(editingSchedule.SectionID)} disabled fullWidth />
              <FormControl fullWidth variant="outlined">
                <InputLabel>Gün</InputLabel>
                <Select name="DayOfWeek" value={editingSchedule.DayOfWeek} onChange={handleModalChange}>
                  {daysOfWeek.map(day => <MenuItem key={day} value={day}>{day}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Başlangıç Saati" name="StartTime" type="time" value={editingSchedule.StartTime} onChange={handleModalChange} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Bitiş Saati" name="EndTime" type="time" value={editingSchedule.EndTime} onChange={handleModalChange} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Sınıf" name="Classroom" value={editingSchedule.Classroom} onChange={handleModalChange} fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsModalOpen(false)} color="secondary">İptal</Button>
            <Button variant="contained" onClick={handleSaveEdit} color="primary">Kaydet</Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default ClassSchedule;






