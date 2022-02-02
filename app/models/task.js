const mongoose = require('../../database');
const bcryptjs = require('bcryptjs');

const TaskSchema = new mongoose.Schema({

    title: {
        type: String,
        require: true,
    },
    project:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
        require: true,
    },
    assignedTo:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        require: true,
    },
    completed:{
        type: Boolean,
        require: true,
        default:false,
    },
    createdAt:{
        type: Date,
        default: Date.now,
    },
});

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;