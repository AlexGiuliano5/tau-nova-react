import { FaRegIdCard, FaSitemap } from 'react-icons/fa'
import { FiMapPin } from 'react-icons/fi'
import { TbNetwork } from 'react-icons/tb'

import { FtthButton } from '@/features/shell/components/FtthButton'

const searchButtons = [
  {
    id: 'address',
    title: 'Búsqueda por dirección',
    icon: <FiMapPin size={24} />,
    href: '/ftth/busqueda/direccion',
  },
  {
    id: 'network',
    title: 'Búsqueda por elemento de red',
    icon: <TbNetwork size={24} />,
    href: '/ftth/busqueda/elemento-de-red',
  },
  {
    id: 'dni',
    title: 'Búsqueda por DNI',
    icon: <FaRegIdCard size={24} />,
    href: '/ftth/busqueda/dni',
  },
  {
    id: 'tree',
    title: 'Búsqueda de árbol',
    icon: <FaSitemap size={24} />,
    href: '/ftth/busqueda/arbol',
  },
]

export function FtthSearchButtons() {
  return (
    <div className="mx-5 flex flex-col gap-3">
      {searchButtons.map((button) => (
        <FtthButton
          key={button.id}
          title={button.title}
          icon={button.icon}
          chevron
          href={button.href}
        />
      ))}
    </div>
  )
}
