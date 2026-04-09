from app import create_app
import os

app = create_app()

print(">>> REAL PATH:", os.path.abspath("instance/development.db"))
print(">>> CWD:", os.getcwd())

if __name__ == '__main__':
    app.run(debug=True)
