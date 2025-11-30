const mongoose = require('mongoose');  
let Assignment = require('../model/assignment');

// Récupérer tous les assignments (GET)
async function getAssignments(req, res) {
  try {
    const assignments = await Assignment.find();
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
}

// GET /api/assignments/:id  -> un assignment par son champ "id" (string)
// Exemple : "34"
async function getAssignment(req, res) {
  const numericId = Number(req.params.id); // convertir en nombre
  try {
    const assignment = await Assignment.findOne({ id: numericId });
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
}

// Ajout d'un assignment (POST)
async function postAssignment(req, res){
  try {
    const assignment = new Assignment();
    assignment.id = req.body.id;
    assignment.nom = req.body.nom;
    assignment.dateDeRendu = req.body.dateDeRendu || req.body.dateRendu;
    assignment.rendu = req.body.rendu;

    console.log("POST assignment reçu :");
    console.log(assignment);

    await assignment.save();
    res.json({ message: `${assignment.nom} saved!` });
  } catch (err) {
    res.status(400).json({ error: err.message || err });
  }
}

// Update d'un assignment (PUT)
async function updateAssignment(req, res) {
  console.log("UPDATE recu assignment : ");
  console.log(req.body);
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.body._id, req.body, { new: true });
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.json({ message: 'updated', assignment });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message || err });
  }
}

// suppression d'un assignment (DELETE)
// Exemple dans assignments.controller.js ou similaire

async function deleteAssignment(req, res) {
  try {
    const param = req.params.id;

    // 1) Cas : c'est un ObjectId Mongo (_id)
    if (mongoose.isValidObjectId(param)) {
      console.log('deleteAssignment by _id =', param);
      const assignment = await Assignment.findByIdAndDelete(param);

      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }

      console.log('Deleted assignment =>', assignment._id, assignment.id, assignment.nom);
      return res.json({ message: `${assignment.nom} deleted` });
    }

    // 2) Sinon, on essaye par id numérique
    const numericId = Number(param);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    console.log('deleteAssignment by numeric id =', numericId);
    const assignment = await Assignment.findOneAndDelete({ id: numericId });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    console.log('Deleted assignment =>', assignment._id, assignment.id, assignment.nom);
    return res.json({ message: `${assignment.nom} deleted` });

  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message || err });
  }
}


module.exports = { getAssignments, postAssignment, getAssignment, updateAssignment, deleteAssignment };
