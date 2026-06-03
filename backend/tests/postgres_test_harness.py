from __future__ import annotations

import atexit
import subprocess
import tempfile
import uuid
from pathlib import Path
from urllib.parse import quote_plus

from alembic import command
from alembic.config import Config
from psycopg import connect, sql
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BACKEND_DIR = Path(__file__).resolve().parent.parent


def _run_command(*args: str) -> None:
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode == 0:
        return

    message = "\n".join(part for part in (result.stdout.strip(), result.stderr.strip()) if part)
    raise RuntimeError(f"Command {' '.join(args)} failed.\n{message}")

class LocalPostgresServer:
    def __init__(self) -> None:
        self._temp_dir = tempfile.TemporaryDirectory(prefix="killexam-postgres-")
        self.base_dir = Path(self._temp_dir.name)
        self.data_dir = self.base_dir / "data"
        self.socket_dir = self.base_dir / "socket"
        self.socket_dir.mkdir(parents=True, exist_ok=True)
        self.port = 55432
        self._is_running = False

        _run_command(
            "initdb",
            "-D",
            str(self.data_dir),
            "-U",
            "postgres",
            "-A",
            "trust",
            "--encoding=UTF8",
            "--no-locale",
        )
        _run_command(
            "pg_ctl",
            "-D",
            str(self.data_dir),
            "-o",
            f"-F -p {self.port} -k {self.socket_dir} -c listen_addresses=",
            "-w",
            "start",
        )
        self._is_running = True
        atexit.register(self.stop)

    @property
    def admin_conninfo(self) -> str:
        return f"host={self.socket_dir} port={self.port} user=postgres dbname=postgres"

    def sqlalchemy_url(self, database_name: str) -> str:
        socket_path = quote_plus(str(self.socket_dir))
        return f"postgresql+psycopg://postgres@/{database_name}?host={socket_path}&port={self.port}"

    def create_database(self, database_name: str) -> str:
        with connect(self.admin_conninfo, autocommit=True) as connection:
            connection.execute(sql.SQL("DROP DATABASE IF EXISTS {} WITH (FORCE)").format(sql.Identifier(database_name)))
            connection.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(database_name)))

        return self.sqlalchemy_url(database_name)

    def drop_database(self, database_name: str) -> None:
        with connect(self.admin_conninfo, autocommit=True) as connection:
            connection.execute(sql.SQL("DROP DATABASE IF EXISTS {} WITH (FORCE)").format(sql.Identifier(database_name)))

    def stop(self) -> None:
        if not self._is_running:
            return

        try:
            _run_command("pg_ctl", "-D", str(self.data_dir), "-w", "stop")
        finally:
            self._is_running = False
            self._temp_dir.cleanup()


_SERVER: LocalPostgresServer | None = None


def get_postgres_server() -> LocalPostgresServer:
    global _SERVER
    if _SERVER is None:
        _SERVER = LocalPostgresServer()
    return _SERVER


def run_migrations(database_url: str) -> None:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    config.attributes["database_url"] = database_url
    command.upgrade(config, "head")


class PostgresTestDatabase:
    def __init__(self) -> None:
        self.server = get_postgres_server()
        self.database_name = f"test_{uuid.uuid4().hex}"
        self.database_url = self.server.create_database(self.database_name)
        run_migrations(self.database_url)
        self.engine = create_engine(self.database_url, pool_pre_ping=True)
        self.SessionLocal = sessionmaker(bind=self.engine, autoflush=False, autocommit=False, expire_on_commit=False)

    def dispose(self) -> None:
        self.engine.dispose()
        self.server.drop_database(self.database_name)
