const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true,
        enum: ['mathematics', 'physics', 'electronics', 'python', 'communication']
    },
    sessionType: {
        type: String,
        enum: ['study', 'practice', 'review'],
        default: 'study'
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Progress', progressSchema);
// Progress.js model
