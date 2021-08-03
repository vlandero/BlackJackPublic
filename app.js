const express = require('express');
const app = express();
require('dotenv').config();
const mongoose = require('mongoose');
const {MongoClient} = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true ,useCreateIndex:true});

const Schema = mongoose.Schema; 
const userSchema = new Schema({
    username: {type:String,required:true,unique:true},
    password: {type:String,required:true},
    money: {type:Number,required:true}
  });

let user = mongoose.model("user", userSchema);

app.set('view engine','html');
app.use('/public1',express.static(__dirname+'/public1'));
app.use('/public',express.static(__dirname+'/BlackJack/public'));
app.use(express.json());

app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/index.html');

});
app.get('/Blackjack',(req,res)=>{
    res.sendFile(__dirname+'/BlackJack/index.html');
});

app.get('/login',(req,res)=>{
    res.sendFile(__dirname+'/BlackJack/login.html');
});
app.get('/signup',(req,res)=>{
    res.sendFile(__dirname+'/BlackJack/sUp.html');
});

app.get('/change',(req,res)=>{
    res.sendFile(__dirname+'/BlackJack/change.html');
});

app.post('/api/signup',async (req,res)=>{

    const {username,password:plainTextPassword} = req.body;
    if(!username)
        return res.json({status: 'error',error: 'Enter username'});
    if(!plainTextPassword)
        return res.json({status: 'error',error: 'Enter password'});

    const password = await bcrypt.hash(plainTextPassword,11);
    try {
        let r = await user.create({
            username,
            password,
            money:30
        });
    } catch (error) {
        if(error.code === 11000){
            return res.json({status:'error', error:'Username already in use'});
        }
        throw error;
    }
    res.json({status:'ok'});
});
app.post('/api/login',async (req,res)=>{

    const {username,password} = req.body;
    let crtUser = await user.findOne({username:username}).lean();
    if(!crtUser)
        return res.json({status:'error',error:'Invalid username/password'});
    
    if(await bcrypt.compare(password,crtUser.password)){

        const token = jwt.sign({
            id:crtUser._id,
            username: crtUser.username
        },process.env.JWT_SECRET);
        
        return res.json({status:'ok',data:token});
    }
    else{
        return res.json({status:'error',error:'Invalid username/password'});
    }
});

app.post('/api/change',async (req,res)=>{
    const{newPass,token} = req.body;
    const currentUser = jwt.verify(token,process.env.JWT_SECRET);
    try{
        const hashedPassword = await bcrypt.hash(newPass,11);
        await user.updateOne({_id:currentUser.id},{
            $set:{password:hashedPassword}
        });
        res.json({status:'ok'});
    }
    catch(e){
        res.json({status:'error',error:e});
    }
});


app.post('/api/bj',async (req,res)=>{
    const {token} = req.body;
    if(!token)
        return res.json({status:'error',error:'Not logged in'});
    let crtUser = jwt.verify(token,process.env.JWT_SECRET);
    crtUser = await user.findOne({username:crtUser.username}).lean();
    return res.json({status:'ok',username:crtUser.username,money:crtUser.money});
});

app.post('/api/betData', async (req,res)=>{
    let {moneyToBet,token} = req.body;
    if(!moneyToBet)
        return res.json({status:'error',error:'Bet some money!'});
    moneyToBet = parseInt(moneyToBet);
    let multiplier;
    let crtUser = jwt.verify(token,process.env.JWT_SECRET);
    crtUser = await user.findOne({username:crtUser.username}).lean();
    let userMoney = crtUser.money;
    if(moneyToBet>userMoney)
        return res.json({status:"error",error:"Not enough money"});
    if(moneyToBet<0)
        return res.json({status:"error",error:"Enter a positive value"});
    if(moneyToBet<=100000) multiplier = 2;
    else multiplier = 3;
    await user.updateOne({username:crtUser.username},{$set:{money:(userMoney-moneyToBet)}},(e)=>{
        if(e) return res.json({status: 'error',error:e});
    });
    crtUser = await user.findOne({username:crtUser.username}).lean();
    return res.json({status:'ok',newMoney:userMoney-moneyToBet,moneyToWin:moneyToBet*multiplier});
});

app.post('/api/moneyupdate',async (req,res)=>{
    let {moneyToUpdate,token} = req.body;
    let crtUser = jwt.verify(token,process.env.JWT_SECRET);
    crtUser = await user.findOne({username:crtUser.username}).lean();
    await user.updateOne({username:crtUser.username},{$set:{money:moneyToUpdate}},(e)=>{
        if(e) return res.json({status: 'error',error:e});
    });
    return res.json({status:'ok'});
});

app.post('/api/leaderboard', async (req,res)=>{
    try {
        const users = await user.find().sort({money:-1}).limit(50);
        return res.json(users);
    } catch (e) {
        return res.json({status:'error',error:e});
    }
});

app.post('/api/getmoney', async (req,res)=>{
    let {token} = req.body;
    let crtUser = jwt.verify(token,process.env.JWT_SECRET);
    crtUser = await user.findOne({username:crtUser.username}).lean();
    if(crtUser.money)
        return res.json({status:'error',error:`Don't trick us! You do have money!`});
    await user.updateOne({username:crtUser.username},{$set:{money:5}},(e)=>{
        if(e) return res.json({status: 'error',error:e});
    });
    return res.json({status:'ok'});
})
const port = process.env.PORT || 80;
app.listen(port);
