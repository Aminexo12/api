let express = require('express');
let app = express();
let assignment = require('./routes/assignments');

let mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.set('debug', true);

// remplacer toute cette chaine par l'URI de connexion à votre propre base dans le cloud s
// NOTE: removed accidental space after the ':' in the password part
const uri = 'mongodb+srv://farikalamine_db_user:EDQe560qa3Ekf9kS@cluster0.tjhbvlo.mongodb.net/DB_Assignment?retryWrites=true&w=majority';

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect(uri, options)
  .then(() => {
    console.log("Connecté à la base MongoDB assignments dans le cloud !");
    console.log("at URI = " + uri);
    console.log("vérifiez with http://localhost:8010/api/assignments que cela fonctionne")
    },
    err => {
      console.log('Erreur de connexion: ', err);
    });

// Pour accepter les connexions cross-domain (CORS)
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// Pour les formulaires et JSON — express fournit maintenant ces middlewares
app.use(express.urlencoded({extended: true}));
app.use(express.json());

const port = 8010;

// les routes
const prefix = '/api';

app.route(prefix + '/assignments')
  .get(assignment.getAssignments)     // GET /api/assignments -> tous
  .post(assignment.postAssignment)    // POST /api/assignments
  .put(assignment.updateAssignment);  // PUT /api/assignments

// Un seul assignment + suppression
app.route(prefix + '/assignments/:id')
  .get(assignment.getAssignment)      // GET /api/assignments/:id
  .delete(assignment.deleteAssignment); 

// On démarre le serveur avec logique de secours si le port est déjà utilisé
function startServer(startPort, maxAttempts = 10) {
  const server = app.listen(startPort, '0.0.0.0', () => {
    console.log('Serveur démarré sur http://localhost:' + startPort);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`Port ${startPort} déjà utilisé.`);
      if (maxAttempts > 0) {
        const nextPort = startPort + 1;
        console.log(`Tentative sur le port ${nextPort}...`);
        // attendre un court instant avant de réessayer
        setTimeout(() => startServer(nextPort, maxAttempts - 1), 200);
      } else {
        console.error('Aucun port disponible après plusieurs tentatives.');
        process.exit(1);
      }
    } else {
      console.error('Erreur serveur non gérée:', err);
      process.exit(1);
    }
  });
}

startServer(port, 10);

module.exports = app;


