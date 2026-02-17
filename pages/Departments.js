import React, { useEffect, useState } from "react";
import { getAll, createItem, deleteItem } from "../services/api";
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
  IconButton
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState({ DepartmentName: "", FacultyName: "" });

  const fetchDepartments = async () => {
    try {
      const data = await getAll("Departments");
      setDepartments(data);
    } catch (error) {
      console.error("Bölümler getirilirken bir hata oluştu:", error);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAdd = async () => {
    await createItem("Departments", newDept);
    setNewDept({ DepartmentName: "", FacultyName: "" });
    fetchDepartments();
  };

  const handleDelete = async (id) => {
    await deleteItem("Departments", id);
    fetchDepartments();
  };

  return (
    <Container component={Paper} sx={{ p: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Bölümler
      </Typography>

      <Stack spacing={2} direction="row" sx={{ mb: 4 }} alignItems="center">
        <TextField
          label="Bölüm Adı"
          variant="outlined"
          size="small"
          value={newDept.DepartmentName}
          onChange={(e) => setNewDept({ ...newDept, DepartmentName: e.target.value })}
        />
        <TextField
          label="Fakülte Adı"
          variant="outlined"
          size="small"
          value={newDept.FacultyName}
          onChange={(e) => setNewDept({ ...newDept, FacultyName: e.target.value })}
        />
        <Button variant="contained" onClick={handleAdd}>
          Ekle
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Bölüm Adı</TableCell>
              <TableCell>Fakülte Adı</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((d) => (
              <TableRow key={d.DepartmentID}>
                <TableCell>{d.DepartmentID}</TableCell>
                <TableCell>{d.DepartmentName}</TableCell>
                <TableCell>{d.FacultyName}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleDelete(d.DepartmentID)} color="error">
                    <DeleteIcon />
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

export default Departments;