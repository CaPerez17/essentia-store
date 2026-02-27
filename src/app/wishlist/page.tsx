import { WishlistContent } from "./WishlistContent";

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-medium tracking-tight text-[var(--text)] mb-8">
        Wishlist
      </h1>
      <WishlistContent />
    </div>
  );
}
