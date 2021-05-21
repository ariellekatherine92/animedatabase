'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class favorites extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.favorites.hasMany(models.user)
    }
  };
  favorites.init({
    genre: DataTypes.STRING,
    ratings: DataTypes.STRING,
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'favorites',
  });
  return favorites;
};