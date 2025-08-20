import { DataTypes, Model, Optional, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import db from '../config/sequelize'; 

interface UserAttributes {
    id: number;
    email: string;
    password: string;
    refreshToken?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    declare id: CreationOptional<number>;
    declare email: string;
    declare password: string;
    declare refreshToken: string | null;
    declare readonly createdAt: CreationOptional<Date>;
    declare readonly updatedAt: CreationOptional<Date>;
    declare readonly deletedAt: CreationOptional<Date>;

    // Safe JSON serialization without password
    public toJSON(): Record<string, any> {
        const values = { ...this.get() };
        const { password, ...userWithoutPassword } = values;
        return userWithoutPassword;
    }
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: {
                    msg: 'Please provide a valid email address'
                },
                notNull: {
                    msg: 'Email is required'
                },
                notEmpty: {
                    msg: 'Email cannot be empty'
                }
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Password is required'
                },
                notEmpty: {
                    msg: 'Password cannot be empty'
                },
                len: {
                    args: [6, 255],
                    msg: 'Password must be at least 6 characters long'
                }
            }
        },
        refreshToken: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, 
    {
        sequelize: db,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['email']
            },
            {
                fields: ['createdAt']
            }
        ],
        defaultScope: {
            attributes: {
                exclude: ['password', 'refreshToken']
            }
        },
        scopes: {
            withPassword: {
                attributes: {
                    include: ['password']
                }
            },
            withSensitive: {
                attributes: {
                    include: ['password', 'refreshToken']
                }
            }
        }
    }
); 

export default User;