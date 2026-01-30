// import mysql from "mysql2/promise";

// const database = mysql.createPool({
//     host: "localhost",
//     user: "root",
//     password: "",
//     database: "wishlist",
//     connectionLimit: 10,
// });

// (async () => {
//     try {
//         const connection = await database.getConnection();
//         console.log("✅ Connected to MySQL database");
//         connection.release();
//     } catch (err) {
//         console.error("❌ Error connecting to MySQL database:", err);
//     }
// })();

// // Optional: Handle pool errors globally
// database.on("error", (err) => {
//     console.error("⚠️ MySQL pool error:", err);
// });

// export default database;









import mysql from "mysql2";

const database = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "rohit79",
    database: "gift-registry-guru",
    connectionLimit: 10,
});

// Listen for the 'connection' event
database.on('connection', () => {
    console.log('Connected to MySQL database');
});

// Listen for the 'error' event
database.on('error', (err) => {
    console.error('Error connecting to MySQL database:', err);
});

// Testing connection status
if (database._closed) {
    console.error('Error: Not connected to MySQL database');
} else {
    console.log('Connected to MySQL database');
}
export default database;







// import mysql from "mysql2";

// const database = mysql.createPool({
//     host: "127.0.0.1",
//     user: "wishlist-user",
//     password: "wishlist.@102!",
//     database: "wishlist",
//     connectionLimit: 10,
// });

// // Listen for the 'connection' event
// database.on('connection', () => {
//     console.log('Connected to MySQL database');
// });

// // Listen for the 'error' event
// database.on('error', (err) => {
//     console.error('Error connecting to MySQL database:', err);
// });

// // Testing connection status
// if (database._closed) {
//     console.error('Error: Not connected to MySQL database');
// } else {
//     console.log('Connected to MySQL database');
// }
// export default database;


