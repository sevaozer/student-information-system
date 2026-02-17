const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ----------------- SQL CONFIG -----------------
const config = {
    user: "",
    password: "",
    server: "127.0.0.1",
    database: "OBS_SISTEMI2",
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};

// ----------------- SQL POOL -----------------
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log("✅ SQL bağlantısı başarılı");
        pool.on("error", err => console.error("❌ SQL pool hatası:", err));
        return pool;
    })
    .catch(err => {
        console.error("❌ SQL bağlantı hatası:", err);
        throw err;
    });

async function getPool() {
    return await poolPromise;
}

// ----------------- GENEL CRUD OLUŞTURUCU -----------------
function createCRUD(tableName, keyColumn) {
    // GET ALL
    app.get(`/${tableName}`, async (_req, res) => {
        try {
            const pool = await getPool();
            const result = await pool.request().query(`SELECT * FROM ${tableName}`);
            res.json(result.recordset);
        } catch (err) {
            console.error(`❌ ${tableName} listeleme SQL hatası:`, err);
            res.status(500).json({ message: `${tableName} listeleme hatası`, error: err.message });
        }
    });

    // GET BY ID
    app.get(`/${tableName}/:id`, async (req, res) => {
        try {
            const pool = await getPool();
            const result = await pool.request()
                .input("id", sql.Int, req.params.id)
                .query(`SELECT * FROM ${tableName} WHERE ${keyColumn}=@id`);
            res.json(result.recordset[0] || {});
        } catch (err) {
            console.error(`❌ ${tableName} ID ile getirme SQL hatası:`, err);
            res.status(500).json({ message: `${tableName} bulunamadı`, error: err.message });
        }
    });

    // POST (EKLEME) - 🚀 GÜNCELLENMİŞ KISIM
    app.post(`/${tableName}`, async (req, res) => {
        try {
            const pool = await getPool();
            const cols = Object.keys(req.body).map(c => `[${c}]`).join(", ");
            const vals = Object.keys(req.body).map(c => `@${c}`).join(", ");

            let request = pool.request();
            
            // Boş stringleri, undefined/null değerleri SQL NULL'a çevirme
            for (let k in req.body) {
                const value = req.body[k];
                // Eğer değer boş string ("") veya undefined/null ise, SQL'e NULL olarak gönder.
                const sqlValue = (value === "" || value === undefined || value === null) ? null : value;
                request.input(k, sqlValue);
            }

            const result = await request.query(
                `INSERT INTO ${tableName} (${cols}) VALUES (${vals}); SELECT SCOPE_IDENTITY() AS ID`
            );
            res.status(201).json({ message: `${tableName} eklendi`, id: result.recordset[0].ID });
        } catch (err) {
            // Hatayı terminale detaylı yazdır (Sorun Çözme için ÇOK ÖNEMLİ!)
            console.error(`❌ ${tableName} ekleme SQL hatası:`, err.message, err.originalError?.message); 
            
            // Frontend'e daha anlaşılır bir mesaj gönder
            let userMessage = `${tableName} eklenirken bir veritabanı hatası oluştu. Lütfen tüm zorunlu alanları kontrol edin.`;
            
            if (err.message.includes("UNIQUE KEY constraint")) {
                userMessage = "Veritabanı kural ihlali: E-posta zaten mevcut veya başka bir benzersiz alan tekrarlandı.";
            } else if (err.message.includes("Cannot insert the value NULL into column")) {
                userMessage = "Zorunlu bir alan (NOT NULL) boş gönderildi. Tüm zorunlu alanları doldurun.";
            }

            res.status(500).json({ 
                message: `${tableName} ekleme hatası: ${userMessage}`, 
                error: err.message 
            });
        }
    });

    // PUT (GÜNCELLEME)
    app.put(`/${tableName}/:id`, async (req, res) => {
        try {
            const pool = await getPool();
            const bodyWithoutPK = { ...req.body };
            delete bodyWithoutPK[keyColumn];

            if (Object.keys(bodyWithoutPK).length === 0) {
                return res.status(400).json({ message: "Güncellenecek veri bulunamadı." });
            }

            const updates = Object.keys(bodyWithoutPK).map(k => `[${k}]=@${k}`).join(", ");

            let request = pool.request();
            request.input("id", sql.Int, req.params.id);

            for (let k in bodyWithoutPK) {
                const val = bodyWithoutPK[k];
                // Güncellemede de boş stringleri NULL olarak kabul et
                if (val === undefined || val === null || val === "") {
                    // mssql, null değeri gönderdiğinizde tipi bilemez, bu yüzden bir tip belirtmek daha güvenli:
                    request.input(k, sql.NVarChar, null); 
                } else if (!isNaN(val) && (typeof val !== 'string' || val.trim() !== '')) {
                    // Sayısal alanları Float olarak gönder (Örn: Credits)
                    request.input(k, sql.Float, Number(val));
                } else {
                    // String/Diğer tipleri NVarChar olarak gönder
                    request.input(k, sql.NVarChar, val);
                }
            }

            await request.query(`UPDATE ${tableName} SET ${updates} WHERE ${keyColumn}=@id`);
            res.json({ message: `${tableName} güncellendi` });
        } catch (err) {
            console.error("❌ Güncelleme hatası:", err);
            res.status(500).json({ message: `${tableName} güncelleme hatası`, error: err.message });
        }
    });

    // DELETE (SİLME)
    app.delete(`/${tableName}/:id`, async (req, res) => {
        try {
            const pool = await getPool();
            await pool.request()
                .input("id", sql.Int, req.params.id)
                .query(`DELETE FROM ${tableName} WHERE ${keyColumn}=@id`);
            res.json({ message: `${tableName} silindi` });
        } catch (err) {
            console.error(`❌ ${tableName} silme SQL hatası:`, err);
            res.status(500).json({ message: `${tableName} silme hatası`, error: err.message });
        }
    });
}

// ----------------- TABLOLAR İÇİN CRUD -----------------
createCRUD("Departments", "DepartmentID");
createCRUD("Users", "UserID");
createCRUD("Courses", "CourseID");
createCRUD("Sections", "SectionID");
createCRUD("Enrollments", "EnrollmentID");
createCRUD("ExamResults", "ResultID");
createCRUD("SectionGrades", "GradeID");
createCRUD("ClassSchedule", "ScheduleID");

// ----------------- ÖZEL ENDPOINTLER -----------------
app.get("/SectionGrades/Student/:userId", async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("studentId", sql.Int, req.params.userId)
            .query("SELECT * FROM SectionGrades WHERE StudentID=@studentId");
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Öğrenci notları getirme SQL hatası:", err);
        res.status(500).json({ message: "Öğrenci notları alınamadı", error: err.message });
    }
});

app.get("/ClassSchedule/Student/:userId", async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("studentId", sql.Int, req.params.userId)
            .query(`
                SELECT cs.*
                FROM ClassSchedule cs
                JOIN Enrollments e ON cs.SectionID = e.SectionID
                WHERE e.StudentID = @studentId
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Öğrenci ders programı getirme SQL hatası:", err);
        res.status(500).json({ message: "Öğrenci ders programı alınamadı", error: err.message });
    }
});

app.get("/Enrollments/Student/:userId", async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("studentId", sql.Int, req.params.userId)
            .query("SELECT * FROM Enrollments WHERE StudentID=@studentId");
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Öğrenci ders kayıtları getirme SQL hatası:", err);
        res.status(500).json({ message: "Öğrenci ders kayıtları alınamadı", error: err.message });
    }
});

// ----------------- MESSAGES -----------------
app.get("/Messages", async (_req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                m.MessageID,
                sender.FullName AS SenderName,
                receiver.FullName AS ReceiverName,
                m.MessageText,
                m.IsRead,
                m.SentDate,
                m.SenderID,
                m.ReceiverID
            FROM Messages m
            JOIN Users sender ON m.SenderID = sender.UserID
            JOIN Users receiver ON m.ReceiverID = receiver.UserID
            ORDER BY m.SentDate DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Mesaj listeleme SQL hatası:", err);
        res.status(500).json({ message: "Mesaj listeleme hatası", error: err.message });
    }
});

app.post("/Messages", async (req, res) => {
    try {
        const pool = await getPool();
        const cols = Object.keys(req.body).map(c => `[${c}]`).join(", ");
        const vals = Object.keys(req.body).map(c => `@${c}`).join(", ");

        let request = pool.request();
        for (let k in req.body) {
             const value = req.body[k];
             const sqlValue = (value === "" || value === undefined || value === null) ? null : value;
             request.input(k, sqlValue);
        }

        const result = await request.query(
            `INSERT INTO Messages (${cols}) VALUES (${vals}); SELECT SCOPE_IDENTITY() AS ID`
        );

        res.status(201).json({ message: "Mesaj eklendi", id: result.recordset[0].ID });
    } catch (err) {
        console.error("❌ Mesaj ekleme SQL hatası:", err);
        res.status(500).json({ message: "Mesaj ekleme hatası", error: err.message });
    }
});

app.put("/Messages/:id", async (req, res) => {
    try {
        const pool = await getPool();
        const updates = Object.keys(req.body).map(k => `[${k}]=@${k}`).join(", ");

        let request = pool.request();
        request.input("id", sql.Int, req.params.id);
        for (let k in req.body) request.input(k, req.body[k]);

        await request.query(`UPDATE Messages SET ${updates} WHERE MessageID=@id`);
        res.json({ message: "Mesaj güncellendi" });
    } catch (err) {
        console.error("❌ Mesaj güncelleme SQL hatası:", err);
        res.status(500).json({ message: "Mesaj güncelleme hatası", error: err.message });
    }
});

app.delete("/Messages/:id", async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input("id", sql.Int, req.params.id)
            .query(`DELETE FROM Messages WHERE MessageID=@id`);
        res.json({ message: "Mesaj silindi" });
    } catch (err) {
        console.error("❌ Mesaj silme SQL hatası:", err);
        res.status(500).json({ message: "Mesaj silme hatası", error: err.message });
    }
});

// ----------------- SERVER BAŞLAT -----------------
poolPromise
    .then(() => {
        const PORT = process.env.PORT || 4000;
        app.listen(PORT, () => console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`));
    })
    .catch(() => {
        console.error("❌ SQL bağlantısı kurulamadı, sunucu başlatılamadı.");
    });