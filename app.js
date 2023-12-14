const express = require("express");
const bodyParser = require("body-parser");
const sql = require("mssql");
const app = express();
const cors = require("cors");
const port = 3000;
// SQL Server configuration
const config = {
  user: "legion",
  password: "legion",
  server: "localhost",
  database: "legion",
  port: 50433,
  options: {
    encrypt: false,
    trustedconnection: true,
    enableArithAbort: true,
    instancename: "LAPTOP-20JU0UKP\\SQLEXPRESS", // SQL Server instance name
  },
};

app.use(cors());
// Middleware to parse JSON in the request body
app.use(bodyParser.json());
app.get("/api/checkDBConnection", async (req, res) => {
  try {
    const pool = await sql.connect(config);
    res.status(200).json({ message: "Database connection successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.get("/", function (req, res, next) {
  res.status(200).send({
    "Node Express API is live now at": new Date().toString(),
    version: "0.0.1",
  });
});

// POST endpoint to receive JSON data and store it in SQL Server
app.post("/api/data", async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const { driverID, harshBreakCount, harshCornerCount, driverName, dateTimeInUTC, spikeInSpeedCount, jsonData } = req.body;
    const result = await pool
      .request()
      .input("driverID", sql.Int, driverID)
      .input("harshBreakCount", sql.Int, harshBreakCount)
      .input("harshCornerCount", sql.Int, harshCornerCount)
      .input("driverName", sql.NVarChar, driverName)
      .input("dateTimeInUTC", sql.DateTime2, dateTimeInUTC) // Use DateTime2 for microsecond precision
      .input("spikeInSpeedCount", sql.Int, spikeInSpeedCount)
      .input("jsonData", sql.NVarChar, jsonData)
      
      .query("INSERT INTO driverPerformance (driverID, harshBreakCount, harshCornerCount, driverName, dateTimeInUTC, spikeInSpeedCount, extras) VALUES (@driverID, @harshBreakCount, @harshCornerCount, @driverName, @dateTimeInUTC, @spikeInSpeedCount, @jsonData)");
    res.status(201).json({ message: "Data stored successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET endpoint to retrieve all data from SQL Server
app.get("/api/data", async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT * FROM driverPerformance");
    const data = result.recordset;
    res.status(200).json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET endpoint to retrieve data based on driverID query parameter
app.get("/api/data/:driverID", async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const { driverID } = req.params;
    const result = await pool
      .request()
      .input("driverID", sql.NVarChar, driverID)
      .query("SELECT * FROM your_table_name WHERE driverID = @driverID");
    const data = result.recordset;
    res.status(200).json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET endpoint to retrieve the list of drivers with performance points
app.get("/api/driverRewardsList/:driverID", async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT * FROM driverPerformance");
    const data = result.recordset;
    const driverID  = req.params.driverID;

    // Calculate performance points for each driver and update the table

    const updatedDrivers = await Promise.all(
      data.map(async (driver) => {
         return {
          driverID: driver.driverID,
          driverName: driver.driverName,
          points: driver.rewardPoints,
        };
      })
    );

    res.status(200).json({ updatedDrivers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// app.get("/api/driverRewardsList/:driverID", async (req, res) => {
//   try {
//     const pool = await sql.connect(config);
//     const result = await pool.request().query("SELECT * FROM driverPerformance");
//     const data = result.recordset;
//     const { driverID } = req.query;

//     // Calculate performance points for each driver and update the table
//     const updatedDrivers = await Promise.all(
//       data.map(async (driver) => {
//         const harshBreakCount = driver.harshBreakCount;

//         // Assign points based on harsh breaking counts
//         let points = 0;
//         if (harshBreakCount < 5) {
//           points = 5;
//         } else {
//           points = -5;
//         }

//         // Update the table with the calculated points
//         await pool
//           .request()
//           .input("driverID", sql.Int, driver.driverID)
//           .input("points", sql.Int, points)
//           .query("UPDATE driverPerformance SET rewardPoints = @points WHERE driverID = @driverID");

//         return {
//           driverID: driver.driverID,
//           driverName: driver.driverName,
//           points: points,
//         };
//       })
//     );

//     res.status(200).json({ updatedDrivers });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });



// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
