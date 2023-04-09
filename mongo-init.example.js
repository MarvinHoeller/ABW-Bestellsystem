print('Start #################################################################');

db = db.getSiblingDB('abwdb');
db.createUser(
  {
    user: '',
    pwd: '',
    roles: [{ role: 'readWrite', db: 'abwdb' }],
  },
);

print('END #################################################################');