let mongoose = require('mongoose');
let Schema = mongoose.Schema;
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const assignmentSchema = new mongoose.Schema({
  id: Number,
  nom: String,
  matiere: String,
  // harmonisé avec le reste du code (dateDeRendu utilisé dans les routes)
  dateDeRendu: Date,
  priorite: String,
  rendu: Boolean,
  note: Number,
  remarques: String,
  auteur: String,
  dateCreation: Date,
});
assignmentSchema.plugin(aggregatePaginate);
// C'est à travers ce modèle Mongoose qu'on pourra faire le CRUD
module.exports = mongoose.model('Assignment', assignmentSchema, 'assignments');
