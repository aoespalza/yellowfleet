const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'yellow_machinery_erp',
  user: 'postgres',
  password: 'postgres'
});

async function main() {
  try {
    await client.connect();

    // Drop and recreate Role table
    await client.query('DROP TABLE IF EXISTS "Role" CASCADE');
    
    await client.query(
      "CREATE TABLE \"Role\" (" +
      "\"id\" TEXT NOT NULL," +
      "\"name\" TEXT NOT NULL," +
      "\"description\" TEXT," +
      "\"canCreateMachine\" BOOLEAN NOT NULL DEFAULT false," +
      "\"canEditMachine\" BOOLEAN NOT NULL DEFAULT false," +
      "\"canDeleteMachine\" BOOLEAN NOT NULL DEFAULT false," +
      "\"canUpdateHourMeter\" BOOLEAN NOT NULL DEFAULT false," +
      "\"canCreateContract\" BOOLEAN NOT NULL DEFAULT false," +
      "\"canEditContract\" BOOLEAN NOT NULL DEFAULT false," +
      "\"canDeleteContract\" BOOLEAN NOT NULL DEFAULT false," +
      "\"canAssignMachine\" BOOLEAN NOT NULL DEFAULT false," +
      "\"canCreateWorkOrder\" BOOLEAN NOT NULL DEFAULT false," +
      "\"canEditWorkOrder\" BOOLEAN NOT NULL DEFAULT false," +
      "\"canDeleteWorkOrder\" BOOLEAN NOT NULL DEFAULT false," +
      "\"canCloseWorkOrder\" BOOLEAN NOT NULL DEFAULT false," +
      "\"canEditLegalDocuments\" BOOLEAN NOT NULL DEFAULT false," +
      "\"canCreateUser\" BOOLEAN NOT NULL DEFAULT false," +
      "\"canEditUser\" BOOLEAN NOT NULL DEFAULT false," +
      "\"canDeleteUser\" BOOLEAN NOT NULL DEFAULT false," +
      "\"canManageRoles\" BOOLEAN NOT NULL DEFAULT false," +
      "\"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP," +
      "\"updatedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP," +
      "CONSTRAINT \"Role_pkey\" PRIMARY KEY (\"id\"))"
    );
    console.log('Role table created');

    // Insert roles one at a time with different query text
    await client.query({
      text: "INSERT INTO \"Role\" (\"id\", \"name\", \"description\", \"canCreateMachine\", \"canEditMachine\", \"canDeleteMachine\", \"canUpdateHourMeter\", \"canCreateContract\", \"canEditContract\", \"canDeleteContract\", \"canAssignMachine\", \"canCreateWorkOrder\", \"canEditWorkOrder\", \"canDeleteWorkOrder\", \"canCloseWorkOrder\", \"canEditLegalDocuments\", \"canCreateUser\", \"canEditUser\", \"canDeleteUser\", \"canManageRoles\") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)",
      values: ['a0000000-0000-0000-0000-000000000001', 'ADMIN', 'Admin full access', true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
    });
    console.log('ADMIN inserted');

    await client.query({
      text: "INSERT INTO \"Role\" (\"id\", \"name\", \"description\", \"canCreateMachine\", \"canEditMachine\", \"canDeleteMachine\", \"canUpdateHourMeter\", \"canCreateContract\", \"canEditContract\", \"canDeleteContract\", \"canAssignMachine\", \"canCreateWorkOrder\", \"canEditWorkOrder\", \"canDeleteWorkOrder\", \"canCloseWorkOrder\", \"canEditLegalDocuments\", \"canCreateUser\", \"canEditUser\", \"canDeleteUser\", \"canManageRoles\") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)",
      values: ['a0000000-0000-0000-0000-000000000002', 'MANAGER', 'Manager limited', true, true, false, true, true, true, false, true, true, true, true, true, false, false, false, false, false]
    });
    console.log('MANAGER inserted');

    await client.query({
      text: "INSERT INTO \"Role\" (\"id\", \"name\", \"description\", \"canCreateMachine\", \"canEditMachine\", \"canDeleteMachine\", \"canUpdateHourMeter\", \"canCreateContract\", \"canEditContract\", \"canDeleteContract\", \"canAssignMachine\", \"canCreateWorkOrder\", \"canEditWorkOrder\", \"canDeleteWorkOrder\", \"canCloseWorkOrder\", \"canEditLegalDocuments\", \"canCreateUser\", \"canEditUser\", \"canDeleteUser\", \"canManageRoles\") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)",
      values: ['a0000000-0000-0000-0000-000000000003', 'OPERATOR', 'Operator basic', false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false]
    });
    console.log('OPERATOR inserted');

    // Create unique index on name
    await client.query('CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name")');
    console.log('Unique index created');

    // Alter User table
    await client.query('ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT');
    await client.query('ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT \'OPERATOR\'');
    console.log('User table altered');

    // Add foreign key
    await client.query(
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'User_role_fkey') THEN ALTER TABLE \"User\" ADD CONSTRAINT \"User_role_fkey\" FOREIGN KEY (\"role\") REFERENCES \"Role\"(\"name\") ON DELETE SET DEFAULT ON UPDATE CASCADE; END IF; END $$"
    );
    console.log('Foreign key added');

    console.log('\nMigration completed!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

main();
