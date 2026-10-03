const Reminder = require('./Reminder');
const { success, error } = require('../Utils/response');

const createReminder = async (req, res) => {
  try {
    const reminder = new Reminder({ ...req.body, userId: req.user.id });
    await reminder.save();
    success(res, { reminder }, 'Reminder created successfully', 201);
  } catch (error) {
    error(res, 'Error creating reminder', 500, error.message);
  }
};

const getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user.id });
    success(res, { reminders }, 'Reminders retrieved successfully');
  } catch (error) {
    error(res, 'Error retrieving reminders', 500, error.message);
  }
};

const getReminderById = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user.id });
    if (!reminder) return error(res, 'Reminder not found', 404);
    success(res, { reminder }, 'Reminder retrieved successfully');
  } catch (error) {
    error(res, 'Error retrieving reminder', 500, error.message);
  }
};

const updateReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!reminder) return error(res, 'Reminder not found', 404);
    success(res, { reminder }, 'Reminder updated successfully');
  } catch (error) {
    error(res, 'Error updating reminder', 500, error.message);
  }
};

const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!reminder) return error(res, 'Reminder not found', 404);
    success(res, {}, 'Reminder deleted successfully');
  } catch (error) {
    error(res, 'Error deleting reminder', 500, error.message);
  }
};

module.exports = {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
};
