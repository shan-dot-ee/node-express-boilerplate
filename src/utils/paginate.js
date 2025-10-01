/**
 * Paginate Sequelize query
 * @param {Model} model - Sequelize model
 * @param {Object} filter - Query filter (where clause)
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sorting criteria using the format: sortField:(desc|asc). Multiple sorting criteria should be separated by commas (,)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {string} [options.populate] - Populate data fields (Sequelize includes)
 * @returns {Promise<Object>}
 */
const paginate = async (model, filter = {}, options = {}) => {
  let sort = [];
  if (options.sortBy) {
    const sortingCriteria = options.sortBy.split(',').map((sortOption) => {
      const [key, order] = sortOption.split(':');

      // If the attribute is an ENUM on the model, cast it to TEXT so sorting
      // is alphabetical instead of using the ENUM internal order (Postgres)
      try {
        if (model && model.rawAttributes && model.rawAttributes[key]) {
          const attrType = model.rawAttributes[key].type;
          const typeKey = attrType && (attrType.key || (attrType.constructor && attrType.constructor.key));
          if (typeKey === 'ENUM' && model.sequelize && model.sequelize.cast && model.sequelize.col) {
            return [model.sequelize.cast(model.sequelize.col(key), 'TEXT'), order === 'desc' ? 'DESC' : 'ASC'];
          }
        }
      } catch {
        // If anything goes wrong inspecting the model, fall back to default behavior
      }

      return [key, order === 'desc' ? 'DESC' : 'ASC'];
    });
    sort = sortingCriteria;
  } else {
    sort = [['createdAt', 'DESC']];
  }

  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const offset = (page - 1) * limit;

  const queryOptions = {
    where: filter,
    order: sort,
    limit,
    offset,
  };

  // Handle populate/include for Sequelize
  if (options.populate) {
    queryOptions.include = options.populate.split(',').map((association) => ({
      association,
    }));
  }

  const { count, rows } = await model.findAndCountAll(queryOptions);

  const totalPages = Math.ceil(count / limit);

  return {
    results: rows,
    page,
    limit,
    totalPages,
    totalResults: count,
  };
};

module.exports = paginate;
