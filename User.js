const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        },
        notifications: {
            type: Boolean,
            default: true
        },
        focusTime: {
            type: Number,
            default: 25
        },
        breakTime: {
            type: Number,
            default: 5
        }
    },
    stats: {
        totalStudyTime: {
            type: Number,
            default: 0
        },
        goalsCompleted: {
            type: Number,
            default: 0
        },
        currentStreak: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
// User.js model
