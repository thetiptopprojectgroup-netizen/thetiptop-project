// MongoDB initialization script for Docker
// Creates the application user, database and indexes.
// Les codes et comptes admin/employé sont créés ensuite via les scripts Node (seed).

db = db.getSiblingDB('thetiptop');

db.createUser({
  user: 'thetiptop',
  pwd: 'thetiptop123',
  roles: [
    {
      role: 'readWrite',
      db: 'thetiptop',
    },
  ],
});

// Index pour la collection users (Mongoose model User)
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ googleId: 1 }, { sparse: true });
db.users.createIndex({ facebookId: 1 }, { sparse: true });

// Index pour la collection codes (Mongoose model Code)
db.codes.createIndex({ code: 1 }, { unique: true });
db.codes.createIndex({ etat: 1 });
db.codes.createIndex({ utilise_par: 1 });
db.codes.createIndex({ lot: 1 });

// Index pour la collection participations
db.participations.createIndex({ user: 1, ticket: 1 }, { unique: true });
db.participations.createIndex({ user: 1 });
db.participations.createIndex({ status: 1 });

print('✅ MongoDB initialized successfully!');
