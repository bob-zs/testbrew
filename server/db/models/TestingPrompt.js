const Sequelize = require('sequelize');
const db = require('../db');

const TestingPrompt = db.define('testingPrompt', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  narrative: {
    type: Sequelize.TEXT,
  },
  prompt: {
    type: Sequelize.TEXT,
  },
  jsCode: {
    type: Sequelize.TEXT,
  },
  templateTest: {
    type: Sequelize.TEXT,
  },
  solution: {
    type: Sequelize.TEXT,
  },
  orderNum: {
    type: Sequelize.INTEGER,
  },
  readOnlyRanges: {
    type: Sequelize.ARRAY(Sequelize.JSON(Sequelize.INTEGER)),
  },
  strikeMarkRanges: {
    type: Sequelize.ARRAY(Sequelize.JSON(Sequelize.INTEGER)),
  },
});

module.exports = TestingPrompt;
