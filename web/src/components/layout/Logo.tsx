import Logo from "@/assets/svg/logo.svg?react"
import { useNavigate } from 'react-router-dom'

const LogoComponent = () => {

  const navigate = useNavigate()

  return <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg shadow-sm">
      <Logo className="size-5 text-(--primary)" />
    </div>
    <span className="truncate font-serif text-[20px] tracking-[-0.03em] text-[#25324c] group-data-[collapsible=icon]:hidden">
      Pilot
    </span>
  </div>
}

export default LogoComponent