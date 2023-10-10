const { Console } = require("console");
const express = require("express");
const { hostname } = require("os");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = 3000;
const session = require("express-session");

app.use(express.static(path.join(__dirname)));
app.use(express.json());


// Configura express-session
app.use(
    session({
        secret: "1234", // Cambia esto a una cadena segura y única
        resave: false,
        saveUninitialized: true,
    })
);

const db = new sqlite3.Database("timesheet.db", (err) => {
    if (err) {
        console.error("Error al conectar a la base de datos:", err.message);
    } else {
        console.log("Conexión exitosa a la base de datos");
    }
});

// Crear la tabla timesheet con un ID autoincremental
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS timesheet (
	    id_registro INTEGER PRIMARY KEY AUTOINCREMENT,
        id_user INTEGER NOT NULL,
        tarea TEXT NOT NULL,
        horas_trabajadas INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users(
        id_user INTEGER PRIMARY KEY,
        pwrd TEXT NOT NULL
    )`);
});

// Agregar una ruta para el inicio de sesión (login)
app.post("/login", (req, res) => {
    const { id_user, pwrd } = req.body;

    // Realizar la autenticación en la base de datos aquí
    db.get("SELECT id_user, pwrd FROM users WHERE id_user = ? AND pwrd = ?", [id_user, pwrd], (err, row) => {
        if (err) {
            console.error("Error al autenticar al usuario:", err.message);
            return res.status(500).json({ error: "Error en la base de datos" });

        }

        if (row) {
            // Usuario autenticado con éxito
            req.session.id_user = id_user;
            req.session.pwrd = pwrd;
            res.status(200).json({ message: "Inicio de sesión exitoso", data: row });


        } else {
            // Credenciales incorrectas
            res.status(401).json({ error: "Credenciales incorrectas" });
        }
    });
});


app.post(`/api/timesheet`, (req, res) => {
    const { tarea, horas_trabajadas } = req.body;
    console.log("Dato horas trabajadas:", horas_trabajadas);
    if (tarea && horas_trabajadas) {
        const stmt = db.prepare("INSERT INTO timesheet(id_user, tarea, horas_trabajadas) VALUES (?, ?, ?)");
        stmt.run(req.session.id_user, tarea, horas_trabajadas, function (err) {
            if (err) {
                return res.status(500).json({ error: "Error al guardar el registro en la base de datos" });
            }

            const nuevoRegistro = {
                id_user: req.session.id_user, // Agregado para incluir el id_user en el objeto
                tarea,
                horas_trabajadas,
            };

            res.status(201).json({ message: "Registro agregado con éxito", data: nuevoRegistro });

            io.emit("nuevoRegistro", nuevoRegistro); // Emitir el nuevo registro a los clientes
        });

        stmt.finalize();
    } else {
        res.status(400).json({ error: "Faltan datos en el formulario" });
    }
});




app.get(`/api/timesheet`, (req, res) => {
    db.all("SELECT tarea, horas_trabajadas FROM timesheet WHERE id_user = ?", [req.session.id_user], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Error al obtener los registros de la base de datos" });
        }

        res.json(rows);
    });
});


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html")); // Cambiar la ruta al archivo de inicio de sesión
});

app.get("public/script.js", (req, res) => {
    res.type("application/javascript"); // Establecer el tipo MIME correcto
    res.sendFile(path.join(__dirname, "TIMESHEET-APP", "script.js"));
});

io.on("connection", (socket) => {
    console.log("Un cliente se ha conectado");
});

http.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
