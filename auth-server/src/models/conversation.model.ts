import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import db from '../config/sequelize';

interface ConversationAttributes {
    id: number;
    userId: number;
    title: string;
    createdAt?: Date;
    updatedAt?: Date;
}

type ConversationCreationAttributes = Optional<ConversationAttributes, 'id' | 'createdAt' | 'updatedAt'>;

class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
    declare id: CreationOptional<number>;
    declare userId: number;
    declare title: string;
    declare readonly createdAt: CreationOptional<Date>;
    declare readonly updatedAt: CreationOptional<Date>;
}

Conversation.init(
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
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: 'New chat',
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
        modelName: 'Conversation',
        tableName: 'conversations',
        timestamps: true,
        indexes: [
            { fields: ['userId'] },
            { fields: ['updatedAt'] },
        ],
    }
);

export default Conversation;


