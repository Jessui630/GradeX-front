import { QRCodeSVG } from 'qrcode.react'
import { enlaceVerificacion } from '../features/certificados/certificadoFormato'

export function CertificateQr({ token, size = 132 }) {
  const enlace = enlaceVerificacion(token)
  if (!enlace) return null

  return (
    <figure className="certificate-qr">
      <div
        aria-label="Código QR de verificación pública del certificado"
        className="certificate-qr-code"
        role="img"
      >
        <QRCodeSVG level="M" size={size} value={enlace} />
      </div>
      <figcaption>
        Escanea el QR o comparte este enlace para verificar el certificado.
      </figcaption>
    </figure>
  )
}
