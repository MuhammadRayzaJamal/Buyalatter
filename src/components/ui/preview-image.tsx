/** <img> biasa supaya URL eksternal apa pun (bukan hanya picsum) tetap bisa dipratinjau. */
export function PreviewImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} className={className} src={src} />;
}
