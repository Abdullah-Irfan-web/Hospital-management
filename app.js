const express=require('express');
const app=express();
const path=require('path');
const bodyparser=require('body-parser');
const mongoose=require('mongoose');
const passport =require('passport');
const passportmongoose=require('passport-local-mongoose');
const LocalStrategy=require('passport-local').Strategy;
const session=require('express-session');

const nodemailer=require('nodemailer');



//SETTING ESSENTIALS

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended:true}));

//Connection with database


mongoose.connect('mongodb://localhost:27017/hospitalmanage',{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true
});

const db=mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {

    console.log("Connected");
});



    let adminschema=new mongoose.Schema({
        fname:String,
        lname:String,
        email:String,
        phone:String,
        date:Date,
        gender:String,
        designation:String
    });

    let userschema=new mongoose.Schema({
        username:{
            type:String,
            required:true
        },
        password:{
            type:String,
            required:true
        }
    });
    let staffdata=mongoose.model('StaffData',adminschema);
    let userdata=mongoose.model('Userdata',userschema);

    


   


    //Passport Setup
    passport.use(new LocalStrategy({usernameField:'username'},(username,password,done)=>{
        userdata.findOne({username:username})
        .then(user=>{
            if(!user){
                return done(null,false)
            }
            if(password==user.password){
                return done(null,user);
            }
            else{
                return done(null,false);
            }
        })
        .catch(err=>{
            console.log(err);
        })
    }));
    passport.serializeUser((user,done)=>{
        done(null,user.id);
    });
    passport.deserializeUser((id,done)=>{
        userdata.findById(id,(err,user)=>{
            done(err,user);
    
        })
    })

app.use(session({
    secret:"nodejs",
    resave:true,
    saveUninitialized:true
}));
    
app.use(passport.initialize());
app.use(passport.session());


function ensureauthentication(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
}


    // Mail Setup
    var transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'abd.khan7007@gmail.com',
            pass: 'abdirfan@70'
        }
    });
    

//SETTING GET ROUTES
app.get('/',(req,res)=>{
    res.render('Home');
})

app.get('/about',(req,res)=>{
    res.render('About');
});

app.get('/error',(req,res)=>{
    res.send("Error 404 please enter valid credentials");
})

app.get('/register',(req,res)=>{
    res.render('Register');
})
app.get('/login',(req,res)=>{
    res.render('Login');
})

app.get('/admin',ensureauthentication,(req,res)=>{
    res.render('Admin-Page');
})
app.get('/admin/add',ensureauthentication,(req,res)=>{
    res.render('add')
})

app.get('/admin/search',ensureauthentication,(req,res)=>{
    res.render('Search-Staff',{staff:""});
})

app.get('/admin/view',ensureauthentication,(req,res)=>{

    staffdata.find({})
    .then(staff=>{
        res.render('Veiw-Staff',{staff:staff});
    })
    .catch(err=>{
        console.log(err);
    })

   
});

app.get('/logout',(req,res)=>{
    req.logout();
    res.redirect('/login')
})





//SETTING POST ROUTES




app.post('/registerbed' ,(req,res)=>{

    let {fname,lname,email,address,phone,date,admitdate,gender,select,message}=req.body;


    var mailoptions = {
        from: `${email}`,
        to: "saoadda0099@gmail.com",
        subject: 'Bed Registration',
        text: `FirstName: ${fname} \n SecondName: ${lname} \n Address: ${address} \n Phone: ${phone} \n Email: ${email} \n Date of birth: ${date} \n Admit Date: ${admitdate} \n Gender: ${gender} \n Bed Type: ${select} \n Message: ${message}`


    };
    transport.sendMail(mailoptions,(err,info)=>{
        if(err){

console.log(err);
        }
        else{
            res.render('registerconfirm',{firstname:fname,lastname:lname,email:email,address:address,phone:phone,date:date,gender:gender,admitdate:admitdate,bed:select,msg:message});
           
        } ;
       
    });
});




app.post('/sendmessage',(req,res)=>{
    let {name,email,message}=req.body;



    var mailoptions = {
        from: `${email}`,
        to: "saoadda0099@gmail.com",
        subject: 'Customer Message',
        text: `Name: ${name} \n Message: ${message}`

    };
    transport.sendMail(mailoptions,(err,info)=>{
        if(err){

console.log(err);
        }
        else{
          res.redirect('/');
           
        } 
       
    });

})

app.post('/addemp',(req,res)=>{
    let data={


        fname:req.body.fname,
        lname:req.body.lname,
        email:req.body.email,
        phone:req.body.phone,
        date:req.body.date,
        gender:req.body.gender,
        designation:req.body.designation
    };
    
    staffdata.create(data)
    .then(staff=>{
        res.redirect('/admin/view');
    })
    .catch(err=>{
        res.render('Veiw-Staff',{msg:"Error!!Cannot add staff"})
    })
})


app.get('/admin/delete/:id',(req,res)=>{

    let query={_id : req.params.id};
    staffdata.deleteOne(query)
    .then(staff=>{
        res.redirect('/admin/view');
    })
    .catch(err=>{
        console.log(err);
    })
})

app.get('/admin/edit/:id',(req,res)=>{
    let qry={_id:req.params.id};
    staffdata.findOne(qry)
    .then(staff=>{
        res.render('update',{staff:staff});
    }).catch(err=>{
        console.log(err);
    
    });
})

app.post('/editemp/:id',(req,res)=>{

  
    let searchquery={_id:req.params.id};
    staffdata.updateOne(searchquery,{$set:{
        fname:req.body.fname,
        lname:req.body.lname,
        email:req.body.email,
        phone:req.body.phone,
        date:req.body.date,
        gender:req.body.gender,
        designation:req.body.designation
    }})
    .then(staff=>{
       
        res.redirect('/admin/view');
    }).catch(err=>{
      console.log(err);
    })

})


app.get('/adminsearch',(req,res)=>{
    let str=req.query.search;
    const myArr = str.split(' ');
    
    staffdata.find({$or: [{fname:myArr[0]},{lname:myArr[1]}]})
    .then(staff=>{
        res.render('Search-Staff',{staff:staff});
    })
    .catch(err=>{
        console.log("cannot find ")
    })

});

app.post('/adminlogin',
passport.authenticate('local',{  successRedirect: '/admin',
failureRedirect: '/error',
failureFlash: true 

})
)

app.listen(3000,()=>{
    console.log('port started')
})