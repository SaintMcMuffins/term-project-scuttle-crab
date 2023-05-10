const path = require("path");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const requestTime = require("./backend/middleware/request-time");

const express = require("express");

// const session = require("express-session");
// const pgSession = require("connect-pg-simple")(session);
// const addSessionLocals = require("./middleware/add-session-locals");
// const isAuthenticated = require("./middleware/is-authenticated");
const initSockets = require("./backend/sockets/initialize.js");

const app = express();
require("dotenv").config();

if (process.env.NODE_ENV === "development") {
    const livereload = require("livereload");
    const connectLiveReload = require("connect-livereload");

    const liveReloadServer = livereload.createServer();
    liveReloadServer.watch(path.join(__dirname, "backend", "static"));
    liveReloadServer.server.once("connection", () => {
        setTimeout(() => {
        liveReloadServer.refresh("/");
        }, 100);
    });

    app.use(connectLiveReload());
}

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());


//const server = initSockets(app, sessionMiddleware)

app.set("views", path.join(__dirname, "backend", "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "backend", "static")));
app.use(express.static(__dirname + "/backend/views"));
app.use(express.static(__dirname + "/backend/assets"));
app.use(requestTime);

const PORT = process.env.PORT || 3000;

const rootRoutes = require("./backend/routes/root");
const chatRoutes = require("./backend/static/chat");
const authRoutes = require("./backend/static/auth")


app.use("/", rootRoutes);
app.use("/chat", chatRoutes);
app.use("/auth", authRoutes);



app.use((request,response,next) => {
    next(createError(404));
});

//Server should open port later
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

