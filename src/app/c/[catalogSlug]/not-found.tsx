import Link from "next/link";

export default function CatalogNotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-bold">Catalog not found</h1>
      <p className="mt-2 text-sm text-quinary">Try /c/demo or /c/merzljak</p>
      <Link href="/" className="btn-primary mt-6 inline-block">
        Home
      </Link>
    </main>
  );
}
