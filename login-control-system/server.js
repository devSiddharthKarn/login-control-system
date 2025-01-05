const express= require('express');
const app = express();
const path = require('path');
const bcryptjs = require("bcryptjs");
const PORT = 3000;

app.use(express.urlencoded({extended:true}));
app.set("view engine","ejs");
app.get("",(req,res)=>{
    const home = path.join(__dirname,"home.ejs");
    res.render(home,{message:"Sign in to see full content"});
    console.log("sent the home page to the user");
});

app.get("/register",(req,res)=>{
    const form = path.join(__dirname,"register_form.ejs");
    res.status(200).render(form,{message:"Fill out correct details to register"});
    console.log("Sent the register form form to the user");
});

app.post("/temp",(req,res)=>{
    try{
        const username = req.body.username;
        const password = req.body.password;
        if(username.length !=0 && password.length !=0){
            const mysql = require('mysql');
            const conn =  mysql.createConnection({
                host:"localhost",
                user:"root",
                password:"",
                database:"login"
            });


            conn.connect((err)=>{
                if(err){
                    console.log("Error connecting to database");
                    throw  err;
                }else{
                    console.log("Database connected successfully");
                }
            });

            const check = "SELECT * FROM login_info WHERE username=? ";

            conn.query(check,[username],async (err,result)=>{
                if(result.length>0){
                    const form = path.join(__dirname,"register_form.ejs");
                    res.status(409).render(form,{message:"username with this name already exists"});
                    conn.end(()=>{
                         console.log("Connection to database ended");
                    })
                    console.log("username with this name already exists");
                }else{
                    const put = "INSERT INTO login_info (username,password) VALUES (?,?) ";

                    const saltingRound= Math.floor(Math.random()*(10-1+1))+1;
                    const hashedPassword = await bcryptjs.hash(password,saltingRound);
                    console.log(`saltingRound is set ${saltingRound}`);

                    conn.query(put,[username,hashedPassword],(err)=>{
                        if(err){
                            console.log("Failed to register user to the database");
                            res.status(500).send("Got an Internal Server Error");
                            conn.end(()=>{
                                console.log("Connection to database ended ");
                            });
                            throw err;
                        }
                        else{
                            console.log("user registered successfully");
                            conn.end(()=>{
                                console.log("Connection to database ended");
                            })
                            const goToLogin = path.join(__dirname,"goToLogin.ejs");
                            res.status(200).render(goToLogin,{name:username});
                            console.log("user directed to goToLogin page");
                        }
                    });
                }

            });

        }
    }catch(e){
        console.log("Got an error at /temp route");
    }
});

app.get("/login",(req,res)=>{
    const login = path.join(__dirname,"login.ejs");
    res.render(login,{message:"please fill out the form to login"});
    console.log(`user  is at the login page`);
})

app.post("/home",(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
    
    if(username.length !=0 && password.length !=0){
        const mysql = require('mysql');
        const conn = mysql.createConnection({
            host:"localhost",
            user:"root",
            password:"",
            database:"login"
        });

        conn.connect((err)=>{
            if(err){
                console.log("Error connecting to database at /home route");
                throw err;
            }else{
                console.log("Connected to database at /home route");
            }
        });

        const isExist = "SELECT COUNT(*) AS login_count FROM login_info where username= ?";

        conn.query(isExist,[username],(err,results)=>{
            if(err){
                console.log("Error executing query at /home route");
                throw err;
            }else{
                if(results[0].login_count==1){
                    console.log("username with the name found");
                    const pass = "SELECT password FROM login_info where username=?";

                    conn.query(pass,[username],(err,result)=>{
                        if(err){
                            console.log("Error comparing the password at login");
                            return;
                        }else{
                            const hashedPassword = result[0].password;
                            const match = bcryptjs.compare(password,hashedPassword);
                            if(match){
                                const home = path.join(__dirname,"home.ejs");
                                res.render(home,{message:username});
                                console.log(`user ${username} logged into home page successfully`);
                                conn.end(()=>{
                                    console.log("Connection to database ended");
                                });
                            }
                        }
                    });
                    
                }
            }
        });
    }

});

app.listen(PORT,(err)=>{
    if(err){
        console.log("Error listening to the server");
        throw err;
    }else{
        console.log(`Listening to server at PORT ${PORT}`);
    }
})