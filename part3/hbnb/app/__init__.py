"""
Application factory module.

Creates and configures the Flask application instance
for the HBnB project.
"""

from flask import Flask
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

from sqlalchemy import event
from sqlalchemy.engine import Engine
import sqlite3

bcrypt = Bcrypt()
cors = CORS()
jwt = JWTManager()
db =  SQLAlchemy()

# Activation des contraintes FK pour SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()

from app.api import api_bp


def create_app(config_class="config.DevelopmentConfig"):
    """
    Application factory function.

    Args:
        config_class (str): Dotted path to the configuration class.
                            Defaults to DevelopmentConfig.

    Returns:
        Flask: Configured Flask application instance.
    """
    app = Flask(__name__)

    app.config.from_object(config_class)
    print(">>> USING DATABASE:", app.config["SQLALCHEMY_DATABASE_URI"])

    CORS(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    db.init_app(app)

    with app.app_context():
        db.create_all()

    from app.services import facade
    # Reset uniquement en mode Test
    if app.config.get('TESTING'):
        facade.reset()

    # Register API Blueprint
    app.register_blueprint(api_bp)

    return app
