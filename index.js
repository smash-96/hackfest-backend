const express = require("express");
const cors = require("cors");
const config = require("./src/firebase/config");
const userRoutes = require("./src/routes/user-routes");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api", userRoutes.routes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(config.port, () =>
  console.log("App is listening on url http://localhost:" + config.port)
);
