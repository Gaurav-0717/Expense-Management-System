exports.success = (res, data = {}, message = 'OK', status = 200) => {
  return res.status(status).json({ success: true, message, ...data });
};

exports.error = (res, message = 'Error', status = 500, details = null) => {
  const payload = { success: false, message };
  if (details) payload.details = details;
  return res.status(status).json(payload);
};
