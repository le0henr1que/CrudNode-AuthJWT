const express = require('express')
const authModdleware = require('../middlawares/auth')

const Project = require('../models/project')
const Task = require('../models/task')

const router = express.Router();

router.use(authModdleware);

router.get('/', async (req, res) =>{
    try{
        const projects = await Project.find().populate(['user', 'tasks']);
        return res.send({projects})
    }catch{
        return res.status(400).send({error: 'Error Load Project'});

    }
})

router.get('/:projectId', async (req, res)=>{
    try{
        const projects = await Project.findById(req.params.projectId).populate(['user', 'tasks']);
        return res.send({projects})
    }catch{
        return res.status(400).send({error: 'Error Load Project'});

    }

})


router.post('/', async (req, res)=>{

    try{

        const{ title, description, tasks} = req.body

        const project = await Project.create({title, description, user: req.userId});
        
        await Promise.all(tasks.map( async task =>{
            const projectTask = new Task({...task, project: project._id});

            await projectTask.save();

            project.tasks.push(projectTask);
        }))

        await project.save();

        return res.send({project});

    }catch(err){
        return res.status(400).send({error: 'Error Create New Project'});
    }


});


router.put('/:projectId', async (req, res)=>{
  
    try{

        const{ title, description, tasks} = req.body

        const project = await Project.findByIdAndUpdate(req.params.projectId,{
            title, 
            description, 
            }, {new:true});
        
            project.tasks = [];
            await Task.remove({project: project._id})

        await Promise.all(tasks.map( async task =>{
            const projectTask = new Task({...task, project: project._id});

            await projectTask.save();

            project.tasks.push(projectTask);
        }))

        await project.save();

        return res.send({project});

    }catch(err){
        return res.status(400).send({error: 'Error update New Project'});
    }


})

router.delete('/:projectId', async (req, res)=>{
    try{
        const projects = await Project.findByIdAndRemove(req.params.projectId).populate('user');
        return res.send()
    }catch{
        return res.status(400).send({error: 'Error Delete Project'});

    }

})




module.exports = app => app.use('/projects', router)