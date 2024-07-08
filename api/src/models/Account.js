import { DataTypes, Model } from "sequelize"
import { v4 as uuidv4 } from "uuid";
import sequelize from "../config/database.js";
import User from "./User.js";

class Account extends Model{}
Account.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        primaryKey: true,
        allowNull: false
    },
    bankName: {
        type: DataTypes.STRING
    },
    accessToken: {
        type: DataTypes.STRING
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: "id"
        }
    }    
},
{
    sequelize,
    paranoid: true
})

User.hasMany(Account, { foreignKey: "userId"});
Account.hasOne(User, { foreignKey: 'userId'});

export default Account;