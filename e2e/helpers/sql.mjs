import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const servidor = '(localdb)\\MSSQLLocalDB'
const base = 'GradeX_IntegrationTests'
const sqlcmd = [
  process.env.SQLCMD_PATH,
  'C:\\Program Files\\Microsoft SQL Server\\Client SDK\\ODBC\\170\\Tools\\Binn\\SQLCMD.EXE',
  'C:\\Program Files\\Microsoft SQL Server\\170\\Tools\\Binn\\SQLCMD.EXE',
].filter(Boolean).find((ruta) => existsSync(ruta))

if (!sqlcmd) {
  throw new Error(
    'No se encontró sqlcmd. Define SQLCMD_PATH con la ruta absoluta del ejecutable.',
  )
}

function escapar(valor) {
  return String(valor).replaceAll("'", "''")
}

export function ejecutarSql(consulta) {
  execFileSync(
    sqlcmd,
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

export function prepararCertificadoNoAutentico(numero, qrToken, correo, folio) {
  ejecutarSql(`
DECLARE @idCategoria int = (SELECT IdCategoria FROM dbo.Categoria WHERE Nombre = N'Sneakers');
DECLARE @idEstadoSolicitud int = (SELECT IdEstadoSolicitud FROM dbo.EstadoSolicitud WHERE Codigo = N'FINALIZADA');
DECLARE @idEstadoCertificado int = (SELECT IdEstadoCertificado FROM dbo.EstadoCertificado WHERE Codigo = N'EMITIDO');
IF @idCategoria IS NULL THROW 51010, N'Categoría E2E no encontrada', 1;
IF @idEstadoSolicitud IS NULL THROW 51011, N'Estado FINALIZADA no encontrado', 1;
IF @idEstadoCertificado IS NULL THROW 51012, N'Estado EMITIDO no encontrado', 1;

INSERT INTO dbo.Usuario (NombreCompleto, Correo, PasswordHash, Activo)
VALUES (N'Solicitante no auténtico E2E', N'${escapar(correo)}', N'hash', 1);
DECLARE @idSolicitante int = SCOPE_IDENTITY();

INSERT INTO dbo.Usuario (NombreCompleto, Correo, PasswordHash, Activo)
VALUES (N'Especialista no auténtico E2E', N'especialista-${escapar(correo)}', N'hash', 1);
DECLARE @idUsuarioEspecialista int = SCOPE_IDENTITY();

INSERT INTO dbo.Especialista (IdUsuario, AniosExperiencia, Estado, FechaAlta)
VALUES (@idUsuarioEspecialista, 5, N'ACTIVO', SYSUTCDATETIME());
DECLARE @idEspecialista int = SCOPE_IDENTITY();

INSERT INTO dbo.EspecialidadEspecialista
    (IdEspecialista, IdCategoria, IdMarca, Nivel, Activa, FechaRegistro)
VALUES (@idEspecialista, @idCategoria, NULL, N'EXPERTO', 1, SYSUTCDATETIME());
DECLARE @idEspecialidad int = SCOPE_IDENTITY();

INSERT INTO dbo.Producto
    (IdPropietario, IdCategoria, Nombre, Modelo, FechaRegistro, Activo)
VALUES (@idSolicitante, @idCategoria, N'Producto no auténtico E2E', N'Modelo E2E',
    SYSUTCDATETIME(), 1);
DECLARE @idProducto int = SCOPE_IDENTITY();

INSERT INTO dbo.SolicitudEvaluacion
    (Folio, IdSolicitante, IdProducto, IdEstadoSolicitud, FechaSolicitud, FechaUltimoCambio,
     ObservacionesSolicitante)
VALUES (N'${escapar(folio)}', @idSolicitante, @idProducto, @idEstadoSolicitud,
    SYSUTCDATETIME(), SYSUTCDATETIME(), N'Prueba de certificado no auténtico');
DECLARE @idSolicitud int = SCOPE_IDENTITY();

INSERT INTO dbo.Evaluacion
    (IdSolicitud, IdEspecialista, FechaInicio, FechaFin, Dictamen, ConditionGrade,
     TechnicalHealth, ObservacionesGenerales)
VALUES (@idSolicitud, @idEspecialista, SYSUTCDATETIME(), SYSUTCDATETIME(), N'NO_AUTENTICO',
    6.5, 70, N'El producto no corresponde al original.');
DECLARE @idEvaluacion int = SCOPE_IDENTITY();

INSERT INTO dbo.Certificado
    (IdEvaluacion, IdEstadoCertificado, IdEspecialidad, NumeroCertificado, QrToken,
     FechaEmision, FechaVencimiento)
VALUES (@idEvaluacion, @idEstadoCertificado, @idEspecialidad, N'${escapar(numero)}',
    '${escapar(qrToken)}', SYSUTCDATETIME(), NULL);
`)
}

export function limpiarCertificadoNoAutentico(folio, correo) {
  ejecutarSql(`
DELETE n FROM dbo.Notificacion n
INNER JOIN dbo.SolicitudEvaluacion s ON s.IdSolicitud = n.IdSolicitud
WHERE s.Folio = N'${escapar(folio)}';
DELETE c FROM dbo.Certificado c
INNER JOIN dbo.Evaluacion e ON e.IdEvaluacion = c.IdEvaluacion
INNER JOIN dbo.SolicitudEvaluacion s ON s.IdSolicitud = e.IdSolicitud
WHERE s.Folio = N'${escapar(folio)}';
DELETE r FROM dbo.ResultadoCriterio r
INNER JOIN dbo.Evaluacion e ON e.IdEvaluacion = r.IdEvaluacion
INNER JOIN dbo.SolicitudEvaluacion s ON s.IdSolicitud = e.IdSolicitud
WHERE s.Folio = N'${escapar(folio)}';
DELETE e FROM dbo.Evaluacion e
INNER JOIN dbo.SolicitudEvaluacion s ON s.IdSolicitud = e.IdSolicitud
WHERE s.Folio = N'${escapar(folio)}';
DELETE FROM dbo.SolicitudEvaluacion WHERE Folio = N'${escapar(folio)}';
DELETE p FROM dbo.Producto p
WHERE p.Nombre = N'Producto no auténtico E2E'
  AND p.IdPropietario = (SELECT IdUsuario FROM dbo.Usuario WHERE Correo = N'${escapar(correo)}');
DELETE de FROM dbo.EspecialidadEspecialista de
INNER JOIN dbo.Especialista esp ON esp.IdEspecialista = de.IdEspecialista
INNER JOIN dbo.Usuario u ON u.IdUsuario = esp.IdUsuario
WHERE u.Correo = N'especialista-${escapar(correo)}';
DELETE esp FROM dbo.Especialista esp
INNER JOIN dbo.Usuario u ON u.IdUsuario = esp.IdUsuario
WHERE u.Correo = N'especialista-${escapar(correo)}';
DELETE FROM dbo.Usuario WHERE Correo IN (N'${escapar(correo)}', N'especialista-${escapar(correo)}');
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
