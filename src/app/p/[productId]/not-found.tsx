import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-bold">Product not found</h1>
      <p className="mt-2 text-sm text-quinary">
        This article is not in the demo catalog (e.g. 12345, 67890, 23456).
      </p>
      <Link href="/" className="btn-primary mt-6 inline-block">
        Back to home
      </Link>
    </main>
  );
}
