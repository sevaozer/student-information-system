import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  TextField,
  Button,
} from "@mui/material";

const ExamResults = () => {
  const [examResults, setExamResults] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);

  const [editing, setEditing] = useState(null); // ResultID
  const [form, setForm] = useState({
    StudentID: "",
    SectionID: "",
    ExamType: "",
    Score: "",
    LetterGrade: "",
  });

  // ----------------- Load Data -----------------
  const loadData = async () => {
    try {
      const [resResults, resSections, resStudents] = await Promise.all([
        axios.get("http://localhost:4000/ExamResults"),
        axios.get("http://localhost:4000/Sections"),
        axios.get("http://localhost:4000/Users"),
      ]);

      setExamResults(resResults.data);
      setSections(resSections.data);
      setStudents(resStudents.data.filter(s => s.Role === "student")); // sadece öğrenciler
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ----------------- Handlers -----------------
  const handleEdit = result => {
    setEditing(result.ResultID);
    setForm({
      StudentID: result.StudentID,
      SectionID: result.SectionID,
      ExamType: result.ExamType,
      Score: result.Score,
      LetterGrade: result.LetterGrade,
    });
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`http://localhost:4000/ExamResults/${editing}`, form);
      setEditing(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Güncelleme hatası!");
    }
  };

  const handleDelete = async id => {
    try {
      await axios.delete(`http://localhost:4000/ExamResults/${id}`);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Silme hatası!");
    }
  };

  // ----------------- Render -----------------
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Öğrenci</TableCell>
            <TableCell>Ders (Şube)</TableCell>
            <TableCell>Sınav Türü</TableCell>
            <TableCell>Puan</TableCell>
            <TableCell>Harf Notu</TableCell>
            <TableCell>İşlemler</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {examResults.map(result => {
            const student = students.find(s => s.UserID === result.StudentID);
            const section = sections.find(s => s.SectionID === result.SectionID);

            return (
              <TableRow key={result.ResultID}>
                <TableCell>{student ? student.FullName : "Bilinmiyor"}</TableCell>
                <TableCell>
                  {section
                    ? `${section.CourseCode} - ${section.CourseName} (${section.SectionCode})`
                    : "Bilinmiyor"}
                </TableCell>

                <TableCell>
                  {editing === result.ResultID ? (
                    <Select
                      name="ExamType"
                      value={form.ExamType || ""}
                      onChange={handleChange}
                    >
                      <MenuItem value="vize">Vize</MenuItem>
                      <MenuItem value="final">Final</MenuItem>
                    </Select>
                  ) : (
                    result.ExamType
                  )}
                </TableCell>

                <TableCell>
                  {editing === result.ResultID ? (
                    <TextField
                      name="Score"
                      type="number"
                      value={form.Score || ""}
                      onChange={handleChange}
                    />
                  ) : (
                    result.Score
                  )}
                </TableCell>

                <TableCell>
                  {editing === result.ResultID ? (
                    <Select
                      name="LetterGrade"
                      value={form.LetterGrade || ""}
                      onChange={handleChange}
                    >
                      {["AA", "BA", "BB", "CB", "CC", "DC", "FF"].map(lg => (
                        <MenuItem key={lg} value={lg}>
                          {lg}
                        </MenuItem>
                      ))}
                    </Select>
                  ) : (
                    result.LetterGrade
                  )}
                </TableCell>

                <TableCell>
                  {editing === result.ResultID ? (
                    <>
                      <Button onClick={handleUpdate} color="primary">
                        Kaydet
                      </Button>
                      <Button onClick={() => setEditing(null)} color="secondary">
                        İptal
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => handleEdit(result)} color="primary">
                        Düzenle
                      </Button>
                      <Button onClick={() => handleDelete(result.ResultID)} color="error">
                        Sil
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ExamResults;





