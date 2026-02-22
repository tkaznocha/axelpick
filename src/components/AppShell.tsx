import NavBar from "./NavBar";

export default function AppShell({
  displayName = "Skater",
  children,
}: {
  displayName?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="app-aurora-bar" />
      <div className="app-aurora-glow" />
      <div className="app-aurora-glow-mid" />
      <div className="app-aurora-glow-btm" />
      <div className="app-noise" />
      <div style={{ position: "relative", zIndex: 1 }}>
        <NavBar displayName={displayName} />
        {children}
      </div>
    </>
  );
}
