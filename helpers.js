// Finds a user by a given email.
const getUserByEmail = (emailQuery, database) => {
  for (let user in database) {
    if (database[user]["email"] === emailQuery) return database[user];
  }
};

module.exports = { getUserByEmail };