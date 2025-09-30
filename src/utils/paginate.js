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