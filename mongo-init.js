// MongoDB initialization script for Docker
// Creates the application user and database

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

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ googleId: 1 }, { sparse: true });
db.users.createIndex({ facebookId: 1 }, { sparse: true });

db.tickets.createIndex({ code: 1 }, { unique: true });
db.tickets.createIndex({ status: 1 });
db.tickets.createIndex({ usedBy: 1 });

db.participations.createIndex({ user: 1, ticket: 1 }, { unique: true });
db.participations.createIndex({ user: 1 });
db.participations.createIndex({ status: 1 });

print('✅ MongoDB initialized successfully!');
