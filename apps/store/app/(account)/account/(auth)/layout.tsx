
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-(--bg-base) flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        {children}
      </main>
    </div>
  );
}
