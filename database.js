const sqlite3 = require('sqlite3').verbose();
const md5 = require('md5');

const dbSource = './database.sqlite';

let db = new sqlite3.Database(dbSource, (error) => {
    if (error) {
        console.log(error);
    } else {
        console.log('Connected to SQLite database');
        db.run('CREATE TABLE user (id INTEGER NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, PRIMARY KEY (id), CONSTRAINT email_unique UNIQUE (email))', (error) => {
        //FOR SOME REASON when I created the table with IF NOT EXISTS and email with the UNIQUE constraint, running database.js and server.js in Node created duplicates of the insert row and violated the UNIQUE constraint, so I could no longer run the server
            if (error) {
                console.log("Table already exists!");
            } else {
                const insert = 'INSERT INTO user (name, email, password) VALUES (?, ?, ?)';
                db.run(insert, ["Toni", "toni@astrology.com", md5("admin1234")]);
            }
        });
    }
});

module.exports = db;