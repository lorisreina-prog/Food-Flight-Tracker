interface Props {
  batchId: number;
  qrCode: string;
}

export default function QrImage({ batchId, qrCode }: Props) {
  return (
    <img
      src={`/api/batch/${batchId}/qr-image`}
      alt={`QR ${qrCode}`}
      className="qr-image"
    />
  );
}
