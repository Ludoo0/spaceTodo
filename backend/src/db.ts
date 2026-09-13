import { Sequelize, DataTypes, Model } from "sequelize";

export const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: "postgres",
  logging: false,
});

// User Model
export class User extends Model {
  declare id: string;
  declare oidcSub: string;
  declare email?: string;
  declare name?: string;
  declare createdAt: Date;
  declare spaces?: Space[];
}

User.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    oidcSub: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "User",
    timestamps: false,
  }
);

// Space Model
export class Space extends Model {
  declare id: string;
  declare name: string;
  declare color: string;
  declare icon: string;
  declare position: number;
  declare noteLayout: string;
  declare ownerId: string;
  declare createdAt: Date;
  declare owner?: User;
  declare todos?: Todo[];
  declare notes?: Note[];
}

Space.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "#3E7C6B",
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "folder",
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    noteLayout: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "grid",
    },
    ownerId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Space",
    tableName: "Space",
    timestamps: false,
  }
);

// Todo Model
export class Todo extends Model {
  declare id: string;
  declare title: string;
  declare done: boolean;
  declare priority: boolean;
  declare position: number;
  declare spaceId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare space?: Space;
}

Todo.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    done: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    priority: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    spaceId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Space,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
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
    sequelize,
    modelName: "Todo",
    tableName: "Todo",
    timestamps: false,
  }
);

// Note Model
export class Note extends Model {
  declare id: string;
  declare content: string;
  declare color: string;
  declare x: number;
  declare y: number;
  declare rotation: number;
  declare spaceId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare space?: Space;
}

Note.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "#D9A441",
    },
    x: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    y: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    rotation: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    spaceId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Space,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
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
    sequelize,
    modelName: "Note",
    tableName: "Note",
    timestamps: false,
  }
);

// Define Relationships
User.hasMany(Space, { foreignKey: "ownerId", as: "spaces" });
Space.belongsTo(User, { foreignKey: "ownerId", as: "owner" });

Space.hasMany(Todo, { foreignKey: "spaceId", as: "todos" });
Todo.belongsTo(Space, { foreignKey: "spaceId", as: "space" });

Space.hasMany(Note, { foreignKey: "spaceId", as: "notes" });
Note.belongsTo(Space, { foreignKey: "spaceId", as: "space" });
