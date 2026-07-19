import AuthErrorPage from "@/views/Auth/Error";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AuthErrorPage searchParams={searchParams} />
      </div>
    </div>
  );
}
