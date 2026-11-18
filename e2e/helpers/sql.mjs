import { execFileSync } from 'node:child_process'

const servidor = '(localdb)\\MSSQLLocalDB'
const base = 'GradeX_IntegrationTests'

function escapar(valor) {
  return String(valor).replaceAll("'", "''")
}

export function ejecutarSql(consulta) {
  execFileSync(
    'sqlcmd',
    [
      '-S', servidor,
      '-d', base,
      '-E',
      '-b',
      '-Q', `SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON; ${consulta}`,
    ],
    { stdio: 'pipe' },
  )
}

export function limpiarSolicitudesE2E() {
  ejecutarSql(`
DELETE FROM dbo.Notificacion;
DELETE FROM dbo.Certificado;
DELETE FROM dbo.ResultadoCriterio;
DELETE FROM dbo.Evaluacion;
DELETE FROM dbo.AsignacionEspecialista;
DELETE FROM dbo.Evidencia;
DELETE FROM dbo.SolicitudEvaluacion;
DELETE FROM dbo.Producto;
`)
}

export function concederRol(correo, rol) {
  ejecutarSql(`
DECLARE @idUsuario int = (SELECT IdUsuario FROM dbo.Usuario WHERE Correo = N'${escapar(correo)}');
DECLARE @idRol int = (SELECT IdRol FROM dbo.Rol WHERE Nombre = N'${escapar(rol)}' AND Activo = 1);
IF @idUsuario IS NULL THROW 51001, N'Usuario E2E no encontrado', 1;
IF @idRol IS NULL THROW 51002, N'Rol E2E no encontrado', 1;
IF NOT EXISTS (SELECT 1 FROM dbo.UsuarioRol WHERE IdUsuario = @idUsuario AND IdRol = @idRol)
    INSERT INTO dbo.UsuarioRol (IdUsuario, IdRol, FechaAsignacion)
    VALUES (@idUsuario, @idRol, SYSUTCDATETIME());
`)
}

export function prepararEspecialista(correo, categoria = 'Sneakers') {
  ejecutarSql(`
DECLARE @idUsuario int = (SELECT IdUsuario FROM dbo.Usuario WHERE Correo = N'${escapar(correo)}');
DECLARE @idRol int = (SELECT IdRol FROM dbo.Rol WHERE Nombre = N'Especialista' AND Activo = 1);
DECLARE @idCategoria int = (SELECT IdCategoria FROM dbo.Categoria WHERE Nombre = N'${escapar(categoria)}');
IF @idUsuario IS NULL THROW 51003, N'Usuario especialista E2E no encontrado', 1;
IF @idRol IS NULL THROW 51004, N'Rol Especialista no encontrado', 1;
IF @idCategoria IS NULL THROW 51005, N'Categoría E2E no encontrada', 1;
IF NOT EXISTS (SELECT 1 FROM dbo.UsuarioRol WHERE IdUsuario = @idUsuario AND IdRol = @idRol)
    INSERT INTO dbo.UsuarioRol (IdUsuario, IdRol, FechaAsignacion)
    VALUES (@idUsuario, @idRol, SYSUTCDATETIME());
IF NOT EXISTS (SELECT 1 FROM dbo.Especialista WHERE IdUsuario = @idUsuario)
    INSERT INTO dbo.Especialista (IdUsuario, AniosExperiencia, Estado, FechaAlta)
    VALUES (@idUsuario, 5, N'ACTIVO', SYSUTCDATETIME());
DECLARE @idEspecialista int = (SELECT IdEspecialista FROM dbo.Especialista WHERE IdUsuario = @idUsuario);
IF NOT EXISTS (
    SELECT 1 FROM dbo.EspecialidadEspecialista
    WHERE IdEspecialista = @idEspecialista AND IdCategoria = @idCategoria AND IdMarca IS NULL)
    INSERT INTO dbo.EspecialidadEspecialista
        (IdEspecialista, IdCategoria, IdMarca, Nivel, Activa, FechaRegistro)
    VALUES (@idEspecialista, @idCategoria, NULL, N'EXPERTO', 1, SYSUTCDATETIME());
`)
}

export function prepararCriterioE2E() {
  ejecutarSql(`
DECLARE @idCategoria int = (SELECT IdCategoria FROM dbo.Categoria WHERE Nombre = N'Sneakers');
IF @idCategoria IS NULL THROW 51006, N'Categoría Sneakers no encontrada', 1;
IF NOT EXISTS (
    SELECT 1 FROM dbo.CriterioEvaluacion
    WHERE IdCategoria = @idCategoria AND Nombre = N'Condición E2E')
    INSERT INTO dbo.CriterioEvaluacion
        (IdCategoria, Nombre, Descripcion, TipoDato, Obligatorio, Orden, Activo)
    VALUES (@idCategoria, N'Condición E2E',
        N'Criterio numérico usado por la prueba E2E.', N'NUMERICO', 1, 90, 1);
`)
}
