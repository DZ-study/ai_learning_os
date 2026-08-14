interface TagProps {
  label: string,
  color: string,
}

export default function Tag({
  label,
  color
}: TagProps) {
  return (
    <span
      className="inline-flex items-center rounded-full bg-white border border-(--tag-color) px-2.5 py-0.5 text-xs font-medium text-(--tag-color)"
      style={{
        "--tag-color": color,
      } as React.CSSProperties}
    >
      {label}
    </span>
  )
}