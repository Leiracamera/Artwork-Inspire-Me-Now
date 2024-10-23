import express from "express";
import axios from "axios";
import bodyParser from "body-parser"
import expressEjsLayouts from "express-ejs-layouts";

const app = express();
const port = process.env.PORT || 3000;
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


// RANDOM image search request
  app.get("/random", async (req, res) => {
    console.log("/random page loading");

    let retryAttempts = 5;
    let artwork;
    let validArtworkFound = false;

    while (retryAttempts > 0 && !validArtworkFound) {
      try {
        const randomObjectId = Math.floor(Math.random() * 500000) + 1;
        const response = await axios.get(`${API_URL}/objects/${randomObjectId}`);

        if (response && response.data) {
          artwork = response.data;

          if (artwork.primaryImage) {
            validArtworkFound = true;
          }
      }
    } catch (error) {
      console.log("Error fetching random artwork:", error.message);
    }

    retryAttempts--;
  }

  if (validArtworkFound) {
    res.render("random.ejs", {
      layout: 'layout',
      title: artwork.title || "Unknown Title", 
      artist: artwork.artistDisplayName || "Unknown Artist", 
      year: artwork.objectDate || "Unknown Year",
      image: artwork.primaryImage
    }); 
    } else {
      res.render("random.ejs", {
        layout: 'layout',
        title: "Error",
        artist: "Unknown Artist",
        year: "Unknown Year",
        image: null,
        errorMessage: "Sorry, we couldn't fetch an artwork after multiple attempts. Please try again!"
      });
    }
  });

  // SEARCH BY KEYWORD request 
  app.get("/searchByKeyword", async (req, res) => {
    try {
      const keyword = req.query.q;
      const searchResponse = await axios.get(`${API_URL}/search?q=${keyword}`);
      const objectIDs = searchResponse.data.objectIDs;
  
      if (objectIDs && objectIDs.length > 0) {
        let validArtworkFound = false;
        let retryAttempts = 5; // Retry limit
        let artwork; 
  
        // Retry logic
        while (retryAttempts > 0 && !validArtworkFound && objectIDs.length > 0) {
          const randomIndex = Math.floor(Math.random() * objectIDs.length);
          const randomObjectId = objectIDs[randomIndex];
          const artworkResponse = await axios.get(`${API_URL}/objects/${randomObjectId}`);
          artwork = artworkResponse.data;
  
          if (artwork.primaryImage) {
            validArtworkFound = true;
          } else {
            objectIDs.splice(randomIndex, 1); // Remove invalid objectID
          }
  
          retryAttempts--; // Decrease the retry attempts
        }
  
        if (validArtworkFound) {
          console.log("Valid artwork found, rendering searchbykeyword.ejs"); // debug log
          res.render("searchbykeyword.ejs", {
            layout: 'layout',
            keyword: keyword,
            title: artwork.title || "Unknown Title",
            artist: artwork.artistDisplayName || "Unknown Artist",
            year: artwork.objectDate || "Unknown Year",
            image: artwork.primaryImage || null
          });
        } else {
          console.log("No valid artworks with images found, rendering searchform.ejs"); // debug log
          res.render("searchform.ejs", {
            layout: 'layout',
            title: "Error",
            errorMessage: "Sorry, we couldn't fetch any artworks with an image. Please try again with a different keyword!"
          });
        }
      } else {
        console.log("No artworks found for keyword:", keyword);
        res.render("searchform.ejs", {
          layout: 'layout',
          title: "Error",
          errorMessage: "No artworks found for the keyword. Please try a different keyword!"
        });
      }
    } catch (error) {
      console.log("General error (catch) during search:", error.message);
      res.render("searchform.ejs", {
        layout: 'layout',
        title: "Error",
        errorMessage: "Sorry, we couldn't fetch any artworks. Please try again later!"
      });
    }
  });

// search form - from navbar
app.get("/search", (req, res) => {
  res.render("searchform.ejs", { 
    layout: 'layout',
    title: 'Search Artworks by Keyword'
  });
});

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
  });