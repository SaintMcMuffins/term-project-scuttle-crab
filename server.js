const express = require("express");
const path = require("path");
const createError = require("http-errors");
const requestTime = require("./backend/middleware/request-time");

const app = express();

app.use(requestTime);
const PORT = process.env.PORT || 3000;

app.set("views", path.join(__dirname, "backend", "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "backend", "static")));
const rootRoutes = require("./backend/routes/root");

app.use("/", rootRoutes);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

app.use((request, response, next) => {
    next(createError(404));
  });