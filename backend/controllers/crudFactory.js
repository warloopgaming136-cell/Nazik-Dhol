// A small factory that generates standard REST CRUD handlers for simple
// content collections (Service, Package, Team, Gallery, Video). Keeps
// controllers consistent without repeating boilerplate for each one.
module.exports = (Model, { populate, publicFilter } = {}) => ({
  // Public: list all active/approved records, admin: list everything
  getAll: async (req, res, next) => {
    try {
      const isAdmin = req.user && req.user.role === 'admin';
      let query = isAdmin ? {} : publicFilter || { isActive: true };

      // allow simple category/search filtering via query string
      if (req.query.category) query.category = req.query.category;

      let q = Model.find(query).sort('-createdAt');
      if (populate) q = q.populate(populate);
      const docs = await q;
      res.status(200).json({ success: true, count: docs.length, data: docs });
    } catch (error) {
      next(error);
    }
  },

  getOne: async (req, res, next) => {
    try {
      const doc = await Model.findById(req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'Not found.' });
      res.status(200).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      if (req.file) req.body.image = `/uploads/${req.uploadType || 'misc'}/${req.file.filename}`;
      if (req.file && Model.modelName === 'Team') req.body.photo = `/uploads/${req.uploadType}/${req.file.filename}`;
      const doc = await Model.create(req.body);
      res.status(201).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      if (req.file) {
        const field = Model.modelName === 'Team' ? 'photo' : 'image';
        req.body[field] = `/uploads/${req.uploadType || 'misc'}/${req.file.filename}`;
      }
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!doc) return res.status(404).json({ success: false, message: 'Not found.' });
      res.status(200).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'Not found.' });
      res.status(200).json({ success: true, message: 'Deleted successfully.' });
    } catch (error) {
      next(error);
    }
  },
});
