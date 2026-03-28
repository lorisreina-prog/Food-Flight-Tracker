export default function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div className="spinner-wrap">
      <div
        className="spinner"
        style={{ "--spinner-size": `${size}px` } as React.CSSProperties}
      />
    </div>
  );
}

export function SpinnerPage() {
  return (
    <div className="spinner-page">
      <div className="spinner" style={{ "--spinner-size": "40px" } as React.CSSProperties} />
    </div>
  );
}

export function SpinnerInline({ size = 16 }: { size?: number }) {
  return (
    <div
      className="spinner spinner--inline"
      style={{ "--spinner-size": `${size}px` } as React.CSSProperties}
    />
  );
}
