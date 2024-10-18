import express from "express";
import axios from "axios";
import bodyParser from "body-parser"

const app = express();
const port = 3000;
const API_URL = "https://collectionapi.metmuseum.org/public/collection/v1"

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("index.ejs");
  });

  app.get("/random", async (req, res) => {
    try {
      // Generate a random objectID
      const randomObjectId = Math.floor(Math.random() * 500000) + 1;
      const response = await axios.get(`${API_URL}/objects/${randomObjectId}`);
  
      if (response && response.data) {
        const artwork = response.data;
  
        // Fallback values for title, artist, and year in case they are undefined
        const title = artwork.title || "Unknown Title";
        const artist = artwork.artistDisplayName || "Unknown Artist";
        const year = artwork.objectDate || "Unknown Year";
  
        // If the artwork has an image, render the page
        if (artwork.primaryImage) {
          res.render("index.ejs", {
            title: title,
            artist: artist,
            year: year,
            image: artwork.primaryImage
          });
        } else {
          // If no image, try another artwork
          res.redirect("/random");
        }
      } else {
        // If no valid data is found, try another artwork
        res.redirect("/random");
      }
    } catch (error) {
      // Handle any errors gracefully
      res.render("index.ejs", {
        title: "Error",
        artist: "Unknown Artist",
        year: "Unknown Year",
        image: null
      });
    }
  });

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
  });