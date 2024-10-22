import express from "express";
import axios from "axios";
import bodyParser from "body-parser"
import expressEjsLayouts from "express-ejs-layouts";

const app = express();
const port = 3000;
const API_URL = "https://collectionapi.metmuseum.org/public/collection/v1"

app.set('view engine', 'ejs');
app.use(expressEjsLayouts);
app.set('layout', 'layout');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// HOME PAGE
app.get("/", (req, res) => {
  console.log("homepage loading");
  res.render("index", {   
    title: "Artwork Inspire Me"
  });
});


//Test 
app.get("/test-ejs", (req, res) => {
  res.render("test");
});

// RANDOM image search request
  app.get("/random", async (req, res) => {
    console.log("/random page loading");
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
          res.render("random.ejs", {
            layout: 'layout',
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
      console.log("Error fetching random artwork:", error.message);
      // Render the random page with an error message
      res.render("random.ejs", {
        layout: 'layout',
        title: "Error",
        artist: "Unknown Artist",
        year: "Unknown Year",
        image: null,
        errorMessage: "Sorry, we couldn't fetch the artwork. Please try again!"
      });
    }
  });

  // SEARCH BY KEYWORD request 
  app.get("/searchByKeyword", async (req, res) => {
    try {
      const keyword = req.query.q;
      const searchResponse = await axios.get(`${API_URL}/search?q=${keyword}`);
      const objectIDs = searchResponse.data.objectIDs;

      if (objectIDs && objectIDs.length > 0 ) {
        let validArtworkFound = false;
        let artwork; 

        while (!validArtworkFound && objectIDs.length > 0) {
          const randomIndex = Math.floor(Math.random() * objectIDs.length);
          const randomObjectId = objectIDs[randomIndex];
          const artworkResponse = await axios.get(`${API_URL}/objects/${randomObjectId}`);
          artwork = artworkResponse.data;

        if (artwork.primaryImage) {
          validArtworkFound = true;
        } else {
          objectIDs.splice(randomIndex, 1);
        }
      }

      if (validArtworkFound) {
          res.render("searchbykeyword.ejs", {
          layout: 'layout',
          keyword: keyword,
          title: artwork.title || "Unknown Title",
          artist: artwork.artistDisplayName || "Unknown Artist",
          year: artwork.objectDate || "Unknown Year",
          image: artwork.primaryImage || null
        });
      } else {
        res.render("index", {
          layout: 'layout',
          title: "No Results",
          content: "No artworks with images found for this keyword."
        });
      }
    } else {
      res.render("index", {
        layout: 'layout',
        title: "No Results",
        content: "No artworks found for this keyword."
      });
    }
  } catch (error) {
    res.render("index", {
      layout: 'layout',
      title: "Error",
      content: "Error fetching artwork, please try again."
    });
  }
});


app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
  });