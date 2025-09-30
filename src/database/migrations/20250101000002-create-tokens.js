module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tokens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        field: 'user_id',
      },
      type: {
        type: Sequelize.ENUM('refresh', 'resetPassword', 'verifyEmail'),
        allowNull: false,
      },
      expires: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      blacklisted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at',
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at',
      },
    });

    // Add indexes
    await queryInterface.addIndex('tokens', ['token'], {
      name: 'tokens_token_index',
    });

    await queryInterface.addIndex('tokens', ['user_id'], {
      name: 'tokens_user_id_index',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('tokens');
  },
};