
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/carconnect", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});

// Define Car Schema
const carSchema = new mongoose.Schema({
    make: String,
    model: String,
    year: Number,
    price: Number,
    fuelType: String,
    ownerType: String,
    contact: String,
    location: String,
    imagePath: String
});

const Car = mongoose.model("Car", carSchema);

// Set up Multer for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "public", "uploads");
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// Serve HTML Pages
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "index.html")));
app.get("/browse", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "browse.html")));
app.get("/sell", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "sell.html")));
app.get("/contact", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "contact.html")));

// Handle Car Selling (Upload Image & Store File Path)
app.post("/sell-car", upload.single("carImage"), async (req, res) => {
    try {
        const { make, model, year, price, fuelType, ownerType, contact, location } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        const newCar = new Car({
            make, 
            model, 
            year: Number(year), // Ensure year is a number
            price: parseFloat(price), // Ensure price is a number
            fuelType, 
            ownerType, 
            contact, 
            location, 
            imagePath
        });

        await newCar.save();
        res.status(201).json({ message: "Car added successfully", car: newCar });
    } catch (error) {
        console.error("Error saving car:", error);
        res.status(500).json({ error: "Error saving car details" });
    }
});

// Fetch Cars with Multiple Filters
app.get("/api/cars", async (req, res) => {
    try {
        let filters = {};

        if (req.query.make) {
            filters.make = { $regex: new RegExp(req.query.make, "i") };
        }
        if (req.query.model) {
            filters.model = { $regex: new RegExp(req.query.model, "i") };
        }
        if (req.query.year) {
            filters.year = Number(req.query.year);
        }
        if (req.query.fuelType) {
            filters.fuelType = req.query.fuelType;
        }
        if (req.query.ownerType) {
            filters.ownerType = req.query.ownerType;
        }
        if (req.query.location) {
            filters.location = { $regex: new RegExp(req.query.location, "i") };
        }
        if (req.query.minPrice || req.query.maxPrice) {
            filters.price = {};
            if (req.query.minPrice) filters.price.$gte = parseFloat(req.query.minPrice);
            if (req.query.maxPrice) filters.price.$lte = parseFloat(req.query.maxPrice);
        }

        console.log("Applied Filters:", filters); // Debugging

        const cars = await Car.find(filters);
        res.json(cars);
    } catch (error) {
        console.error("Error fetching cars:", error);
        res.status(500).json({ error: "Error fetching cars" });
    }
});

// Fetch Single Car Details by ID
app.get("/api/car/:id", async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (car) {
            res.json(car);
        } else {
            res.status(404).json({ message: "Car not found" });
        }
    } catch (error) {
        console.error("Error fetching car details:", error);
        res.status(500).json({ error: "Error fetching car details" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
