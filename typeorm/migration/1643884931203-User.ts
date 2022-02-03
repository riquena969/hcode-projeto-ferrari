import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class User1643884931203 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "users",
            columns: [{
                name: "id",
                type: "int",
                isPrimary: true,
                isGenerated: true,
                generationStrategy: "increment"
            }, {
                name: "email",
                type: "varchar",
                length: "250",
                isNullable: false,
                isUnique: true
            }, {
                name: "password",
                type: "varchar",
                length: "250",
                isNullable: false
            }, {
                name: "photo",
                type: "varchar",
                length: "255",
                isNullable: true
            }, {
                name: "personId",
                type: "int",
                isNullable: true
            }, {
                name: "createdAt",
                type: "datetime",
                default: "CURRENT_TIMESTAMP",
                isNullable: false
            }, {
                name: "updatedAt",
                type: "datetime",
                default: "CURRENT_TIMESTAMP",
                isNullable: false
            }]
        }));

        await queryRunner.createForeignKey("users", new TableForeignKey({
            columnNames: ["personId"],
            referencedColumnNames: ["id"],
            referencedTableName: "persons",
            name: "FK_users_persons",
            onDelete: "CASCADE"
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("users");
    }

}
