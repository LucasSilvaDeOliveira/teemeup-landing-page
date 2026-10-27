import QRCode from "qrcode";

/** QR rendered on the server as inline SVG: no client JavaScript, no layout shift. Always dark on white so it scans. */
export async function Qr({ value, label }: { value: string; label: string }) {
  const svg = await QRCode.toString(value, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#07070F", light: "#FFFFFF" } });
  return <div className="qr" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />;
}
