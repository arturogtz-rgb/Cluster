"""
=============================================================
  TEST DE CONEXION A MONGODB ATLAS
  Cluster de Turismo de Naturaleza y Aventura Jalisco
=============================================================

USO:
  python3 test_db.py

  El script lee MONGO_URL del archivo .env o de las variables
  de entorno del sistema. Si todo esta bien, veras:
  
  [OK] CONECTADO A MONGODB ATLAS
  
  Si algo falla, te dira exactamente que esta mal.
=============================================================
"""
import os
import sys

def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    val = val.strip().strip('"').strip("'")
                    os.environ.setdefault(key.strip(), val)

def main():
    print("=" * 60)
    print("  TEST DE CONEXION - MongoDB Atlas")
    print("=" * 60)
    print()

    load_env()

    mongo_url = os.environ.get('MONGO_URL', '')
    db_name = os.environ.get('DB_NAME', 'test_database')

    # --- Check 1: Variable exists ---
    if not mongo_url:
        print("[ERROR] MONGO_URL no esta definida.")
        print("        Revisa tu archivo .env o variables de entorno.")
        print("        Formato esperado:")
        print('        MONGO_URL="mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority"')
        sys.exit(1)

    print(f"[OK] MONGO_URL encontrada")

    # Mask password for display
    display_url = mongo_url
    if '@' in mongo_url and ':' in mongo_url.split('@')[0]:
        parts = mongo_url.split('@')
        user_part = parts[0].rsplit(':', 1)[0]
        display_url = f"{user_part}:****@{parts[1]}"
    print(f"     URL: {display_url}")
    print(f"     DB:  {db_name}")
    print()

    # --- Check 2: Is it Atlas or local? ---
    is_atlas = 'mongodb+srv' in mongo_url or 'mongodb.net' in mongo_url
    is_local = 'localhost' in mongo_url or '127.0.0.1' in mongo_url
    if is_local:
        print("[INFO] Usando MongoDB LOCAL (localhost)")
    elif is_atlas:
        print("[INFO] Usando MongoDB ATLAS (nube)")
    else:
        print("[INFO] Usando MongoDB externo")
    print()

    # --- Check 3: Connection ---
    try:
        from pymongo import MongoClient
        from pymongo.errors import (
            ConnectionFailure,
            OperationFailure,
            ServerSelectionTimeoutError,
            ConfigurationError,
        )
    except ImportError:
        print("[ERROR] pymongo no esta instalado.")
        print("        Ejecuta: pip install pymongo[srv]")
        sys.exit(1)

    print("[...] Intentando conectar (timeout: 10s)...")
    try:
        client = MongoClient(mongo_url, serverSelectionTimeoutMS=10000)
        info = client.server_info()
        print(f"[OK] CONECTADO A MONGODB {'ATLAS' if is_atlas else 'LOCAL'}")
        print(f"     Version: {info.get('version', '?')}")
    except ServerSelectionTimeoutError:
        print("[ERROR] TIMEOUT - No se pudo conectar al servidor.")
        if is_atlas:
            print()
            print("  CAUSA MAS PROBABLE: La IP de tu servidor NO esta")
            print("  en el Whitelist de MongoDB Atlas.")
            print()
            print("  SOLUCION:")
            print("  1. Ve a https://cloud.mongodb.com")
            print("  2. Tu Cluster > Network Access > Add IP Address")
            print("  3. Agrega la IP de tu servidor Hostinger")
            print("     (o usa 0.0.0.0/0 para permitir todas)")
            print()
            print("  Para obtener la IP de Hostinger, ejecuta:")
            print("  curl -s https://api.ipify.org && echo")
        sys.exit(1)
    except ConfigurationError as e:
        print(f"[ERROR] URL MAL FORMADA: {e}")
        print()
        print('  Formato correcto:')
        print('  MONGO_URL="mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority"')
        sys.exit(1)
    except OperationFailure as e:
        print(f"[ERROR] AUTENTICACION FALLIDA: {e}")
        print()
        print("  Tu usuario o password de Atlas es incorrecto.")
        print("  Verifica en Atlas > Database Access > tu usuario")
        sys.exit(1)
    except ConnectionFailure as e:
        print(f"[ERROR] CONEXION RECHAZADA: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] {type(e).__name__}: {e}")
        sys.exit(1)

    # --- Check 4: DB operations ---
    print()
    print("[...] Probando lectura/escritura...")
    try:
        db = client[db_name]
        collections = db.list_collection_names()
        print(f"[OK] Base de datos '{db_name}' accesible")
        print(f"     Colecciones: {collections if collections else '(vacia - es nueva)'}")

        empresas = db.empresas.count_documents({})
        usuarios = db.usuarios.count_documents({})
        actividades = db.actividades.count_documents({})
        contactos = db.contactos.count_documents({})

        print()
        print(f"     Empresas:    {empresas}")
        print(f"     Usuarios:    {usuarios}")
        print(f"     Actividades: {actividades}")
        print(f"     Leads:       {contactos}")

        if usuarios == 0:
            print()
            print("[AVISO] No hay usuarios. El sistema creara el admin")
            print("        automaticamente al iniciar el servidor.")

        if empresas == 0:
            print()
            print("[AVISO] No hay empresas. Ejecuta el seed:")
            print(f"        curl -X POST http://localhost:8001/api/seed")
    except OperationFailure as e:
        print(f"[ERROR] Sin permisos de lectura/escritura: {e}")
        print("        Ve a Atlas > Database Access > tu usuario")
        print("        y asegurate de que tenga rol 'readWriteAnyDatabase'")
        sys.exit(1)

    # --- Summary ---
    print()
    print("=" * 60)
    print("  RESULTADO: TODO CORRECTO")
    print("=" * 60)
    print()
    client.close()


if __name__ == "__main__":
    main()
