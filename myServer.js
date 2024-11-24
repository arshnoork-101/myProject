var express = require("express");
var mysql2 = require("mysql2");
var bodyParser = require("body-parser");

require('dotenv').config(); // Load .env file into process.env

var app = express(); // Express framework

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Start the Server
const port=2002;
app.listen(port, function () {
    console.log(`Server Started on Port ${port}`);
});

// MySQL connection configuration
let config = "mysql://avnadmin:AVNS_tpOP0jbL8CSXgcAcREm@mysql-50284af-arshnoor64050-06f9.l.aivencloud.com:25622/defaultdb";
var mysqlServer = mysql2.createConnection(config);

// Connect to MySQL database
mysqlServer.connect(function (err) {
    if (err == null) {
        console.log("Connected to AIVen Database Server Successfully");
    } else {
        console.log(err.message);
    }
});

// Serve static files (e.g., SignInPage.html) enabling access to HTML, CSS, and JavaScript files.
app.use(express.static("public"));

const fileUpload = require('express-fileupload');
app.use(fileUpload());

// Serve the SignInPage.html
app.get("/", function (req, resp) {
    let path = __dirname + "/index.html";
    resp.sendFile(path);
});

// ===============================================================================
// UPLOADING TO Cloudinary
var cloudinary=require("cloudinary").v2;
cloudinary.config({ 
    cloud_name: 'da9gwrtit', 
    api_key: '416944178917971', 
    api_secret: 's0ilyVaoJzh4vSoyPpwfO-yJMyw'
});
//================================================================================

app.post("/profileOrganizer", async function(req, resp) {
    let filename = "";
    if (req.files == null) {
        // If no picture is uploaded, set a default image
        filename = "nopic.jpg";
    } else {
        filename = req.files.profilepic.name;
        let path = __dirname + "/public/uploads/" + filename;
        console.log(path);
        req.files.profilepic.mv(path);

        // Saving the file/picture on the Cloudinary server
        await cloudinary.uploader.upload(path).then(function(result) {
            filename = result.url; // Get the URL of the image from Cloudinary
            console.log(filename);
        });
    }
    req.body.ppic = filename; 

    // Save data according to the column sequence in 'organizations' table
    mysqlServer.query("insert into organizations values(?,?,?,?,?,?,?,?,?,?,?)", [
        req.body.emailid, req.body.organization, req.body.contact, req.body.address, req.body.city, req.body.proof, req.body.ppic, req.body.sports, req.body.picprev, req.body.website, req.body.socialhandle       
    ], function(err) {
        if (err == null)
            resp.send("Record Saved Successfully");
        else
            resp.send(err.message);
    });
});

// SEARCH FOR AN EMAIL
app.get("/search-org", (req, res) => {
    const emailid = req.query.emailid; // Get the email ID from the request
  
    const query = "SELECT * FROM organizations WHERE emailid = ?"; // Query to find the organization
  
    mysqlServer.query(query, [emailid], (err, result) => {
      if (err) {
        return res.send({ message: "Server error: " + err.message });
      }
  
      if (result.length > 0) {
        // If the organization is found, send the details back
        res.send({
          found: true,
          organization: result[0].organization // Send the organization name as an example
        });
      } else {
        // If no organization is found with the given email
        res.send({ found: false });
      }
    });
  });
  
app.post("/signupModal", (req, res) => {
    const { emailid, pwd, utype } = req.body;

    // Check if the email already exists
    mysqlServer.query("SELECT * FROM players WHERE emailid = ?", [emailid], (err, result) => {
        if (err) {
            return res.send("Server error: " + err.message);
        }
        console.log(emailid);
        if (result.length > 0) {
            return res.send("This Email already exists");
        }

        // Insert new user into the players table, with current date set automatically
        const query = "INSERT INTO players (emailid, pwd, utype, status, dos) VALUES (?, ?, ?, ?, CURDATE())";
        const status = 1; // Assuming status 1 means active

        mysqlServer.query(query, [emailid, pwd, utype, status], (err, result) => {
            if (err) {
                console.log(emailid);
                return res.send("Error inserting data: " + err.message);
            }
            res.send("Signup successful");
        });
    });
});

app.post("/loginModal", (req, res) => {
    const { emailid, pwd } = req.body;

    // Query to find the user based on email and password
    const query = "SELECT * FROM players WHERE emailid = ? AND pwd = ?";

    mysqlServer.query(query, [emailid, pwd], (err, result) => {
        if (err) {
            return res.send({ message: "Server error: " + err.message });
        }

        // If login is successful, send back the user type and a success message
        if (result.length > 0) {
            // If login is successful, send back the user type
            const user = result[0];
            res.send({ utype: user.utype });
        } else {
            // If no match found, send an invalid message
            res.send({ utype: "Invalid" });
        }
    });
});

app.get("/dashOrganizer", function(req, res){
    let path3=__dirname+"/dashOrganizer.html";
    res.sendFile(path3);
})

app.get("/profileOrganizer", function(req,res){
    let path4=__dirname+"/profileOrganizer.html";
    res.sendFile(path4);
})
// PUBLISH TOURNAMENTS 
app.get("/publishTournaments", function(req, res){
    let path5=__dirname+"/publish-tournaments.html";
    res.sendFile(path5);
})
app.get("/publish-tournament", async function(req, resp) {
    let filename = "";

    try{
    // Check if no picture is uploaded
    if (req.files == null ) {
        filename = "nopic.jpg";
    } else {
        // Get the uploaded file
        const poster = req.files.poster;
        filename = poster.name;

        // Define the path to save the image locally
        let path = __dirname + "/public/uploads/" + filename;

        // Move the uploaded file to the server's directory
        req.files.poster.mv(path);
        await cloudinary.uploader.upload(path).then(function(result){
            filename=result.url;   //will give u the url of ur pic on cloudinary server
            console.log(filename);
        });
    }
    req.body.poster = filename; // Save the Cloudinary URL to req.body

    // Save data according to the column sequence in the 'tournaments' table
    mysqlServer.query("insert into tournaments (emailid, game, title, fee, dot, city, location, prizes, poster, info) values(?,?,?,?,?,?,?,?,?,?)", [
        req.body.emailid, req.body.game, req.body.title,  req.body.fee, req.body.dot, req.body.city, req.body.location, req.body.prizes, req.body.poster, req.body.info             
    ], function(err) {
        if (err == null) {
            resp.send("Tournament published successfully!");
        } else {
            resp.send(err.message);
        }
    });
} catch (err) {
    resp.send("Server Error: " + err.message);
}
});
app.get("/dashPlayer", function(req, resp){
    let path6=__dirname+"/dashPlayer.html";
    resp.sendFile(path6);
})

app.get("/index", function(req, resp){
    let path7=__dirname+"/index.html";
    resp.sendFile(path7);
})

app.get("/update-password", function(req, resp){
    let email=req.query.txtEmail;
    let currpwd=req.query.txtCurrPass;
    let newpwd=req.query.txtNewPass;

    console.log(email);
    console.log(currpwd);
    console.log(newpwd);
    
    mysqlServer.query("update players set pwd=? where emailid=? and pwd=?", [newpwd, email, currpwd], function(err, result){
        console.log(result.affectedRows);
        if(err!=null){
            resp.send(err.message);
        }
        else if(resp.affectedRows==1){
            resp.send("Password Updated Successfully");
        }
        else{
            resp.send("Invalid Credentials");
        }
    })
})

//======================================================================
app.get("/tournamentsFinder", function(req, resp){
    let path8=__dirname+"/public/tournaments-finder.html";
    resp.sendFile(path8);
})
// Endpoint to fetch all tournaments
app.get('/fetch-all-tournaments', (req, res) => {
    const query = 'SELECT * FROM tournaments';
    mysqlServer.query(query, (err, results) => {
        if (err==null) {
            res.json(results);
        }
        else{
            return res.send(err);
        }
    });
});

// Endpoint to fetch all unique cities
app.get('/fetch-all-cities', (req, res) => {
    const query = 'SELECT DISTINCT city FROM tournaments';
    mysqlServer.query(query, (err, results) => {
        if (err) {
            return res.send(err);
        }
        res.json(results);
    });
});

// Endpoint to fetch all unique game names
app.get('/fetch-all-games', (req, res) => {
    const query = 'SELECT DISTINCT game FROM tournaments';
    mysqlServer.query(query, (err, results) => {
        if (err) {
            return res.send(err);
        }
        res.json(results);
    });
});
