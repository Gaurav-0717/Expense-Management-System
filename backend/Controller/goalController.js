const Goal = require('./Goal');
const { success, error } = require('../Utils/response');

const createGoal = async (req, res) => {
  try {
    const goal = new Goal({ ...req.body, userId: req.user.id });
    await goal.save();
    success(res, { goal }, 'Goal created successfully', 201);
  } catch (error) {
    error(res, 'Error creating goal', 500, error.message);
  }
};

const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id });
    success(res, { goals }, 'Goals retrieved successfully');
  } catch (error) {
    error(res, 'Error retrieving goals', 500, error.message);
  }
};

const getGoalById = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) return error(res, 'Goal not found', 404);
    success(res, { goal }, 'Goal retrieved successfully');
  } catch (error) {
    error(res, 'Error retrieving goal', 500, error.message);
  }
};

const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!goal) return error(res, 'Goal not found', 404);
    success(res, { goal }, 'Goal updated successfully');
  } catch (error) {
    error(res, 'Error updating goal', 500, error.message);
  }
};

const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!goal) return error(res, 'Goal not found', 404);
    success(res, {}, 'Goal deleted successfully');
  } catch (error) {
    error(res, 'Error deleting goal', 500, error.message);
  }
};

module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
};
