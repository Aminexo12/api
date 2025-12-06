const mongoose = require('mongoose');  
let Assignment = require('../model/assignment');


async function getAssignment(req, res) {
  const numericId = Number(req.params.id);
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
async function getAssignments(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    
    const aggregate = Assignment.aggregate([]);
    const options = { page, limit };

    const pageResult = await Assignment.aggregatePaginate(aggregate, options);
    
    
    const [totalDocs, totalRendus] = await Promise.all([
      Assignment.countDocuments({}),
      Assignment.countDocuments({ rendu: true })
    ]);
    const totalNonRendus = totalDocs - totalRendus;

    return res.json({
      assignments: pageResult.docs,   // les docs de la page
      totalAssignments: totalDocs,    // total global
      totalRendus,
      totalNonRendus,
      totalPages: pageResult.totalPages,
      page: pageResult.page,
      limit: pageResult.limit
    });
  } catch (err) {
    console.error('Erreur getAssignments:', err);
    return res.status(500).json({ error: err.message || err });
  }
}


async function getAssignmentsPagines(req, res) {
  try {
    const page  = parseInt(req.query.page, 10)  || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip  = (page - 1) * limit;

    const search = (req.query.search || '').trim();  
    const filter = (req.query.filter || '').trim();  

    
    const query = {};

   
    if (search) {
      query.nom = { $regex: search, $options: 'i' };
    }

    
    if (filter === 'rendu') {
      query.rendu = true;
    } else if (filter === 'non-rendu') {
      query.rendu = false;
    }
    // Filtre par priorité
    else if (['Critique', 'Haute', 'Moyenne', 'Basse'].includes(filter)) {
      query.priorite = filter;
    }

      const assignments = await Assignment.find(query)
      .sort({ dateDeRendu: 1 })
      .skip(skip)
      .limit(limit);

    
    const totalAssignments = await Assignment.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(totalAssignments / limit));

    // 4) Stats filtrées (rendus / non rendus)
    const statsAgg = await Assignment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRendus: {
            $sum: {
              $cond: [
                { $in: ['$rendu', [true, 1, 'true', '1']] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = statsAgg[0] || { totalRendus: 0 };
    const totalRendus = stats.totalRendus;
    const totalNonRendus = totalAssignments - totalRendus;

    
    return res.json({
      docs: assignments,
      totalDocs: totalAssignments,
      totalRendus,
      totalNonRendus,
      totalPages,
      page,
      limit
    });

  } catch (err) {
    console.error('Erreur pagination :', err);
    return res.status(500).json({ error: err.message || err });
  }
}




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
    assignment.matiere = req.body.matiere;
    assignment.priorite = req.body.priorite;
    assignment.note = req.body.note;
    assignment.remarques = req.body.remarques;
    assignment.auteur = req.body.auteur;
    assignment.dateDeRendu = req.body.dateDeRendu || req.body.dateRendu;
    assignment.rendu = req.body.rendu;
    assignment.dateCreation = req.body.dateCreation || new Date();

    console.log("POST assignment reçu :");
    console.log(assignment);

    const saved = await assignment.save();

    
    res.json(saved);
    

  } catch (err) {
    res.status(400).json({ error: err.message || err });
  }
}


// Update d'un assignment (PUT)
async function updateAssignment(req, res) {
  console.log("UPDATE recu assignment : ");
  console.log('params.id =', req.params.id);
  console.log('body =', req.body);

  try {
    const param = req.params.id;
    let assignment;

    if (mongoose.isValidObjectId(param)) {
      console.log('updateAssignment by _id =', param);
      assignment = await Assignment.findByIdAndUpdate(param, req.body, { new: true });
    } else {
      const numericId = Number(param);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ message: 'Invalid id' });
      }

      console.log('updateAssignment by numeric id =', numericId);
      assignment = await Assignment.findOneAndUpdate({ id: numericId }, req.body, { new: true });
    }

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ message: 'updated', assignment });
  } catch (err) {
    console.error('Update error:', err);
    res.status(400).json({ error: err.message || err });
  }
}



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


module.exports = { getAssignments, postAssignment, getAssignment, updateAssignment, deleteAssignment , getAssignmentsPagines };
