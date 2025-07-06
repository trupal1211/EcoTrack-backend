const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true },

  description: { type: String, required: true },

  photos: {
    type: [String], // Cloudinary image URLs
    required: true,
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: "At least one photo is required"
    }
  },

  autoLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },

  landmark: { type: String, required: true },
  city: { type: String, required: true },

  status: {
    type: String,
    enum: ["pending", "taken", "completed"],
    default: "pending"
  },

  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  takenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  takenOn: { type: Date },
  dueDate: { type: Date },

  resolvedImages: {
        type: [String]
},
  resolutionDescription: { type: String },
  resolvedOn: { type: Date },

  incompletedBy: [ 
    {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: []
    }
  ],

  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],

  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]

}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema);
