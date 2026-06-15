import LoginForm from "./LoginForm";

interface Props {
  searchParams: Promise<{ from?: string; reason?: string; reset?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <LoginForm
      from={params.from ?? "/dashboard"}
      reason={params.reason ?? null}
      reset={params.reset ?? null}
    />
  );
}
