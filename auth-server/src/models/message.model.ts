import { DataTypes, Model, Optional, CreationOptional } from 'sequelize';
import db from '../config/sequelize';

export type MessageRole = 'user' | 'assistant';

interface MessageAttributes {
    id: number;
    conversationId: number;
    role: MessageRole;
    content: string;
    attachmentsJson?: string | null;
    createdAt?: Date;
}

type MessageCreationAttributes = Optional<MessageAttributes, 'id' | 'attachmentsJson' | 'createdAt'>;

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
    declare id: CreationOptional<number>;
    declare conversationId: number;
    declare role: MessageRole;
    declare content: string;
    declare attachmentsJson: string | null;
    declare readonly createdAt: CreationOptional<Date>;
}

Message.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        conversationId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('user', 'assistant'),
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT('long'),
            allowNull: false,
        },
        attachmentsJson: {
            type: DataTypes.TEXT('long'),
            allowNull: true,
            defaultValue: null,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize: db,
        modelName: 'Message',
        tableName: 'messages',
        timestamps: false,
        indexes: [
            { fields: ['conversationId'] },
            { fields: ['createdAt'] },
        ],
    }
);

export default Message;


