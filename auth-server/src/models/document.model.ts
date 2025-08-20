import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import db from '../config/sequelize';

interface DocumentAttributes {
    id: number;
    userId?: number | null;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    storagePath: string;
    textContent: string; // very long text supported by TEXT('long')
    checksum?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

type DocumentCreationAttributes = Optional<DocumentAttributes, 'id' | 'userId' | 'checksum' | 'createdAt' | 'updatedAt'>;

class Document extends Model<DocumentAttributes, DocumentCreationAttributes> implements DocumentAttributes {
    declare id: CreationOptional<number>;
    declare userId: number | null;
    declare originalFilename: string;
    declare mimeType: string;
    declare sizeBytes: number;
    declare storagePath: string;
    declare textContent: string;
    declare checksum: string | null;
    declare readonly createdAt: CreationOptional<Date>;
    declare readonly updatedAt: CreationOptional<Date>;
}

Document.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        originalFilename: {
            type: DataTypes.STRING(512),
            allowNull: false,
        },
        mimeType: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        sizeBytes: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        storagePath: {
            type: DataTypes.STRING(1024),
            allowNull: false,
        },
        textContent: {
            // LONGTEXT to hold book-sized content
            type: DataTypes.TEXT('long'),
            allowNull: false,
        },
        checksum: {
            type: DataTypes.STRING(64),
            allowNull: true,
            defaultValue: null,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize: db,
        modelName: 'Document',
        tableName: 'documents',
        timestamps: true,
        indexes: [
            { fields: ['userId'] },
            { fields: ['createdAt'] },
        ],
    }
);

export default Document;


