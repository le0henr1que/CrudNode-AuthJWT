const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authconfig = require('../../config/auth')
const mailer = require('../../modules/mailer')

const crypto = require('crypto')
const User = require('../models/user');
const router = express.Router();

// router.use(session({secret:authconfig.secret,   resave: false, saveUninitialized: false}))

function generateToken(params = {}){
    return jwt.sign(params, authconfig.secret, {
        expiresIn: 86400
    } )
}



router.post('/register', async (req, res) => {
    const {email} = req.body
    try {
        if(await User.findOne({ email })){
            return res.status(400).send({ error: 'User already exists'});
        }
        const user = await User.create(req.body);

        user.password = undefined;

        return res.send({ 
            user,
            token: generateToken({id: user.id})
        
        });
   
    }catch(err){
        return res.status(400).send({ error: 'Registration failed'})
    }

});

router.post('/authenticate', async (req, res, next)=>{
    const { email, password} = req.body
  
    const user = await User.findOne({ email }).select('+password');


    if(!user){
        return res.status(400).send({ error: 'User not found'});
    }
    if(!await bcryptjs.compare(password, user.password) ){
        return res.status(400).send({ error: 'Invalid Password'});
    }
    user.password = undefined;

    res.send({ 
        user, 
        token: generateToken({id: user.id}) 
    });

})


router.post('/forgot_password', async (req, res) =>{
    const {email} = req.body;
    try{
        const user = await User.findOne({ email })
        if (!user){
            return res.status(400).send({ error: 'User not Found'});
        }
        const token = crypto.randomBytes(20).toString('hex');
        const now = new Date();
        now.setHours(now.getHours() + 1)

        await User.findByIdAndUpdate(user.id, {
            '$set':{
                passwordResetToken: token,
                passwordResetExpires: now,
            }
        });
        mailer.sendMail({
            to: email,
            from: 'leonardoferreira.henrique1210@gmail.com',
            template:'auth/forgot_password',
            context: {token},
        }, (err) => {
            if(err)
            {
                console.log(err)
                return res.status(400).send({ error: 'Cannot send forot password email'});
            }else{
                return res.send();

            }
        })
    }catch{
        return res.status(400).send({ error: 'Erro on forgot password, try again'});
    }
})

router.post('/reset_password', async(req, res) => {
    const {email, token, password} = req.body;
    try{
    const user = await User.findOne({ email })
    .select('+passwordResetToken passwordResetExpires')
    if (!user)
        return res.status(400).send({ error: 'User not Found'});
    
    if(token !== user.passwordResetToken)
        return res.status(400).send({error: 'Token invalid'})
    
    const now = new Date();

    if(now > user.passwordResetExpires)
        return res.status(400).send({error: 'Token expired, generate a new one'});
    
    user.password = password;
    await user.save();
    res.send();


    }catch(err){
        return res.status(400).send({ error: 'Cannot reset password, try again'});

    }

})

module.exports = app => app.use('/auth', router)

