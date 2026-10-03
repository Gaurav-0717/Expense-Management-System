const Tag = require('./Tag');
const { success, error } = require('../Utils/response');

const createTag = async (req, res) => {
  try {
    const tag = new Tag({ ...req.body, userId: req.user.id });
    await tag.save();
    success(res, { tag }, 'Tag created successfully', 201);
  } catch (error) {
    error(res, 'Error creating tag', 500, error.message);
  }
};

const getTags = async (req, res) => {
  try {
    const tags = await Tag.find({ userId: req.user.id });
    success(res, { tags }, 'Tags retrieved successfully');
  } catch (error) {
    error(res, 'Error retrieving tags', 500, error.message);
  }
};

const getTagById = async (req, res) => {
  try {
    const tag = await Tag.findOne({ _id: req.params.id, userId: req.user.id });
    if (!tag) return error(res, 'Tag not found', 404);
    success(res, { tag }, 'Tag retrieved successfully');
  } catch (error) {
    error(res, 'Error retrieving tag', 500, error.message);
  }
};

const updateTag = async (req, res) => {
  try {
    const tag = await Tag.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!tag) return error(res, 'Tag not found', 404);
    success(res, { tag }, 'Tag updated successfully');
  } catch (error) {
    error(res, 'Error updating tag', 500, error.message);
  }
};

const deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!tag) return error(res, 'Tag not found', 404);
    success(res, {}, 'Tag deleted successfully');
  } catch (error) {
    error(res, 'Error deleting tag', 500, error.message);
  }
};

module.exports = {
  createTag,
  getTags,
  getTagById,
  updateTag,
  deleteTag,
};
