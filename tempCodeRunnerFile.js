import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/carconnect", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Define Car Schema (Storing Image as File Path)
const carSchema = new mongoose.Schema({
    make: String,
    model: String,
    year: Number,
    price: Number,
    fuelType: String,
    ownerType: String,
    contact: String,
    imagePath: String  // Store file path instead of Base64
});

const Car = mongoose.model("Car", carSchema);

// Set up Multer for image uploads (Disk Storage)
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Routes for serving HTML pages
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "index.html")));
app.get("/browse", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "browse.html")));
app.get("/sell", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "sell.html")));
app.get("/contact", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "contact.html")));

// Handle car selling (store image file path)
app.post("/sell-car", upload.single("carImage"), async (req, res) => {
    try {
        const { make, model, year, price, fuelType, ownerType, contact } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        const newCar = new Car({ make, model, year, price, fuelType, ownerType, contact, imagePath });
        await newCar.save();

        res.redirect("/browse");
    } catch (error) {
        console.error("Error saving car:", error);
        res.status(500).send("Error saving car details.");
    }
});

// Fetch cars with filtering (GET `/api/cars`)
app.get("/api/cars", async (req, res) => {
    try {
        const { make, year, minPrice, maxPrice, fuelType } = req.query;
        let filters = {};

        if (make) filters.make = { $regex: new RegExp(make, "i") }; // Case-insensitive match
        if (year) filters.year = parseInt(year);
        if (minPrice || maxPrice) {
            filters.price = {};
            if (minPrice) filters.price.$gte = parseFloat(minPrice);
            if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
        }
        if (fuelType) filters.fuelType = fuelType;

        const cars = await Car.find(filters);
        res.json(cars);
    } catch (error) {
        console.error("Error fetching cars:", error);
        res.status(500).send("Error fetching cars.");
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
