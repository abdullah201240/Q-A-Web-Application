import { DataTypes, Model, Optional } from 'sequelize';
import db from '../config/sequelize';

interface ConversationDocumentAttributes {
    conversationId: number;
    documentId: number;
}

type ConversationDocumentCreationAttributes = Optional<ConversationDocumentAttributes, never>;

class ConversationDocument extends Model<ConversationDocumentAttributes, ConversationDocumentCreationAttributes> implements ConversationDocumentAttributes {
    declare conversationId: number;
    declare documentId: number;
}

ConversationDocument.init(
    {
        conversationId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
        },
        documentId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
        },
    },
    {
        sequelize: db,
        modelName: 'ConversationDocument',
        tableName: 'conversation_documents',
        timestamps: false,
        indexes: [
            { unique: true, fields: ['conversationId', 'documentId'] },
            { fields: ['documentId'] },
        ],
    }
);

export default ConversationDocument;


