const express = require('express');
const app = express();
const db = require('./database.js');
const md5 = require('md5');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));

const PORT = 8000
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

//response for the root endpoint /
app.get('/', (req, res, next) => {
    res.json({message: 'Ok'});
});

app.get('/api/users', (req, res, next) => {
    db.all('SELECT * FROM user', (error, rows) => {
        if (error) {
            res.status(400).json({error: error.message}); //need some error-handling middleware!
            return;
        } else {
            res.status(200).json({data: rows});
        }
    });
}); //to test, open http://localhost:8000/api/users/ in browser

app.get('/api/user/:id', (req, res, next) => {
    db.get('SELECT * FROM user WHERE id = ?', [req.params.id], (error, row) => {
        if (error) {
            res.status(400).json({error: error.message});
        } else if (!row) {
            res.status(404).json({error: "User with requested id does not exist"});
            return;
        } else {
            res.status(200).json({data: row});
        }
    });
}); //to test, open http://localhost:8000/api/users/1 in browser

app.post('/api/user/', (req, res, next) => {
    const data = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    }
    if (!data.name || !data.email || !data.password) {
        res.status(400).json({error: "Request missing one or more required fields: name, password, email"});
        return;
    }
    db.run('INSERT INTO user (name, email, password) VALUES ($name, $email, $password)',
    {
        $name: data.name,
        $email: data.email,
        $password: md5(data.password)
    },
    //another way to do this would be similar to the row creation in database.js --> 
    //const sql = 'INSERT INTO user (name, email, password) VALUES (?, ?, ?)';
    //db.run(sql, [data.name, data.email, md5(data.password)], function(error, row) {...});
    function(error) {
        if (error) {
            res.status(400).json({error: error.message});
        } else {
            db.get('SELECT * FROM user WHERE id = $id', 
            {
                $id: this.lastID
            },
            function(error, row) {
                if (error) {
                    res.status(400).json({error: error.message});
                } else {
                    res.status(201).json({
                        message: "User successfully created!",
                        data: row
                    });
                }
            });
        }
    });
});
//To test POST request: curl -d "name=test&email=test%40example.com&password=test123" -X POST http://localhost:8000/api/user/

app.patch('/api/user/:id', (req, res, next) => {
    const data = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password ? md5(req.body.password) : null
    };
    db.run(`UPDATE user SET 
        name = COALESCE(?, name), 
        email = COALESCE(?, email), 
        password = COALESCE(?, password) 
        WHERE id = ?`, 
    [data.name, data.email, data.password, req.params.id],
    function(error, result) {
        if (error) {
            res.status(400).json({"error": res.message});
            return;
        } 
        res.status(200).json({
            message: "User successfully updated!",
            data: data,
            changes: this.changes
        });
    });
});//To test this --> should be: 
   //curl -H "Content-Type: application/json" -H "Accept: application/json" -d "{\"name\": \"Boris\"}" -X PATCH http://localhost:8000/api/user/1
   //app.patch is written exactly like the example

app.delete('/api/user/:id', (req, res, next) => {
    db.run('DELETE FROM user WHERE id = $id', 
    {
        $id: req.params.id
    },
    //Could also do 'DELETE FROM user WHERE id = ?', req.params.id, function(error) {...}
    function(error) {
        if (error) {
            res.status(400).json({"error": res.message});
            return;
        } else {
            res.status(200).json({
                message: "User successfully deleted!",
                changes: this.changes
            });
        }
    });
})//to test: curl -X DELETE http://localhost:8000/api/user/1

//Default response for any other request:
app.use(function(req, res) {
    res.status(404);
});