export const metadata = {
  title: 'FightLog - Admin',
  description: 'Painel administrativo FightLog',
};

export default function FullAdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {children}
    </div>
  );
}
