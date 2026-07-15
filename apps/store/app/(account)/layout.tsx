import AccountHeader from "@/components/navigation/AccountHeader";


export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AccountHeader />
      {children}
    </>
  );
}
