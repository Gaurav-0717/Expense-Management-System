const Budget = require('./Budget');
const { success, error } = require('../Utils/response');

const createBudget = async (req, res) => {
  try {
    const budget = new Budget({ ...req.body, userId: req.user.id });
    await budget.save();
    success(res, { budget }, 'Budget created successfully', 201);
  } catch (error) {
    error(res, 'Error creating budget', 500, error.message);
  }
};

const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.id });
    success(res, { budgets }, 'Budgets retrieved successfully');
  } catch (error) {
    error(res, 'Error retrieving budgets', 500, error.message);
  }
};

const getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user.id });
    if (!budget) return error(res, 'Budget not found', 404);
    success(res, { budget }, 'Budget retrieved successfully');
  } catch (error) {
    error(res, 'Error retrieving budget', 500, error.message);
  }
};

const updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!budget) return error(res, 'Budget not found', 404);
    success(res, { budget }, 'Budget updated successfully');
  } catch (error) {
    error(res, 'Error updating budget', 500, error.message);
  }
};

const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!budget) return error(res, 'Budget not found', 404);
    success(res, {}, 'Budget deleted successfully');
  } catch (error) {
    error(res, 'Error deleting budget', 500, error.message);
  }
};

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
};
