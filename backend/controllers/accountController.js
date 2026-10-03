const Account = require('../models/Account');
const { success, error } = require('../Utils/response');

const createAccount = async (req, res) => {
  try {
    const account = new Account({ ...req.body, userId: req.user.id });
    await account.save();
    success(res, { account }, 'Account created successfully', 201);
  } catch (error) {
    error(res, 'Error creating account', 500, error.message);
  }
};

const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id });
    success(res, { accounts }, 'Accounts retrieved successfully');
  } catch (error) {
    error(res, 'Error retrieving accounts', 500, error.message);
  }
};

const getAccountById = async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, userId: req.user.id });
    if (!account) return error(res, 'Account not found', 404);
    success(res, { account }, 'Account retrieved successfully');
  } catch (error) {
    error(res, 'Error retrieving account', 500, error.message);
  }
};

const updateAccount = async (req, res) => {
  try {
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!account) return error(res, 'Account not found', 404);
    success(res, { account }, 'Account updated successfully');
  } catch (error) {
    error(res, 'Error updating account', 500, error.message);
  }
};

const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!account) return error(res, 'Account not found', 404);
    success(res, {}, 'Account deleted successfully');
  } catch (error) {
    error(res, 'Error deleting account', 500, error.message);
  }
};

module.exports = {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
};
