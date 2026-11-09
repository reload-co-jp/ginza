// 緯度経度を囲む OpenStreetMap 埋め込みの表示範囲
const LNG_SPAN = 0.003
const LAT_SPAN = 0.002

export const googleMapsUrl = (latitude: number, longitude: number) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`

export const osmEmbedUrl = (latitude: number, longitude: number) => {
  const bbox = [
    longitude - LNG_SPAN,
    latitude - LAT_SPAN,
    longitude + LNG_SPAN,
    latitude + LAT_SPAN,
  ]
    .map((n) => n.toFixed(6))
    .join(",")
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`
}

/** 会場の地図（OpenStreetMap 埋め込み＋Googleマップへのリンク） */
export const PlaceMap = ({
  latitude,
  longitude,
  name,
}: {
  latitude: number
  longitude: number
  name: string
}) => (
  <div className="place-map">
    <iframe
      className="place-map__frame"
      loading="lazy"
      src={osmEmbedUrl(latitude, longitude)}
      title={`${name}の地図`}
    />
    <a
      className="place-map__link"
      href={googleMapsUrl(latitude, longitude)}
      target="_blank"
      rel="noopener noreferrer"
    >
      Googleマップで開く →
    </a>
  </div>
)
